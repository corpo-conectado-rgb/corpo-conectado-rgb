const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getSheet, getCachedRows, invalidateCache } = require('../services/googleSheets');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { calcularIdade } = require('../utils/dateUtils');

// Helper para pegar detalhes de um usuário incluindo a anamnese
async function fetchFullUser(userRowId, baseUser) {
  let userDetails = { ...baseUser };
  try {
    const rows = await getCachedRows('anamnese', []);
    const row = rows.find(r => r.get('id_usuario') === userRowId);
    if (row) {
      const dataNascimento = row.get('data_nascimento');
      userDetails.data_nascimento = dataNascimento;
      userDetails.idade = dataNascimento ? calcularIdade(dataNascimento) : row.get('idade');
      userDetails.altura = row.get('altura');
      userDetails.peso = row.get('peso');
      userDetails.sexo = row.get('sexo');
      userDetails.objetivo = row.get('objetivo');
      userDetails.nivel_fisico = row.get('nivel_fisico');
      userDetails.lesoes_criticas = row.get('lesoes_criticas');
      userDetails.habitos_freq = row.get('habitos_freq');
      userDetails.habitos_tempo = row.get('habitos_tempo');
      userDetails.habitos_local = row.get('habitos_local');
    }
  } catch (err) { }
  return userDetails;
}

// 1. Listar Todos os Usuários
router.get('/usuarios', adminMiddleware, async (req, res) => {
  try {
    const rows = await getCachedRows('usuarios', []);
    
    // Ignora administradores na listagem clinica, mostra apenas users reais
    const basicUsers = rows.filter(r => r.get('role') !== 'admin').map(r => ({
      id: r.get('id'),
      nome: r.get('nome'),
      email: r.get('email'),
      data_criacao: r.get('data_criacao'),
      role: r.get('role')
    }));

    const treinosRows = await getCachedRows('treinos', []);

    // Busca os dados físicos para cada um
    const fullUsers = await Promise.all(basicUsers.map(async u => {
       const user = await fetchFullUser(u.id, u);
       const fichaAtiva = treinosRows.find(t => t.get('user_id') === user.id && (t.get('status') === 'ativo' || t.get('status') === 'ativa'));
       
       user.status_treino = fichaAtiva ? 'ATIVO' : 'SEM TREINO';
       user.ficha_nome = fichaAtiva ? fichaAtiva.get('nome_ficha') : '';
       user.data_termino = fichaAtiva ? (fichaAtiva.get('data_termino') || '') : '';
       
       return user;
    }));

    res.json(fullUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.5. Pegar detalhes de 1 Usuário
router.get('/usuarios/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const row = (await getCachedRows('usuarios', [])).find(r => r.get('id') === id);
    if (!row) return res.status(404).json({ message: 'Atleta não encontrado' });

    const baseUser = { id: row.get('id'), nome: row.get('nome'), email: row.get('email') };
    const fullUser = await fetchFullUser(id, baseUser);
    res.json(fullUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.8. Pegar Ficha Ativa de um Usuário
router.get('/usuarios/:id/ficha-ativa', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const treinosRows = await getCachedRows('treinos', []);
    const activeTreino = treinosRows.find(
      r => r.get('user_id') === id && (r.get('status') === 'ativo' || r.get('status') === 'ativa')
    );

    if (!activeTreino) {
      return res.json([]);
    }

    const treinoId = activeTreino.get('id');
    const objetivo = activeTreino.get('objetivo');

    const diasRows = await getCachedRows('dias_treino', []);
    const diasParaTreino = diasRows.filter(r => r.get('treino_id') === treinoId);

    const exerciciosRows = await getCachedRows('exercicios', []);

    const fichasFrontend = diasParaTreino.map((dia, idx) => {
      const diaId = dia.get('id');
      const exsOfDia = exerciciosRows.filter(r => r.get('dia_treino_id') === diaId);

      return {
        id: diaId,
        letra: dia.get('letra_dia'),
        nome: dia.get('foco_muscular'),
        objetivo: objetivo || 'Hipertrofia',
        duracao: `${45 + (exsOfDia.length * 5)} min`,
        ativa: idx === 0,
        grupoPrimario: dia.get('foco_muscular') ? dia.get('foco_muscular').split(',')[0] : 'Geral',
        exercicios: exsOfDia.map((ex, i) => ({
          id: ex.get('id') || i.toString(),
          nome: ex.get('nome'),
          series: Number(ex.get('series')) || 3,
          reps: ex.get('repeticoes') || '10-12',
          descanso: Number(ex.get('descanso')) || 60,
          grupomuscular: dia.get('foco_muscular') || 'Geral'
        }))
      };
    });

    res.json(fichasFrontend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.9. Pegar Ficha Ativa no formato RAW para o Builder (Estúdio de Prescrição)
router.get('/fichas/usuario/:id/builder', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const treinosRows = await getCachedRows('treinos', []);
    const activeTreino = treinosRows.find(
      r => r.get('user_id') === id && (r.get('status') === 'ativo' || r.get('status') === 'ativa')
    );

    if (!activeTreino) {
      return res.json(null); // Retorna null se não houver ficha
    }

    const treinoId = activeTreino.get('id');

    const diasRows = await getCachedRows('dias_treino', []);
    const diasParaTreino = diasRows.filter(r => r.get('treino_id') === treinoId);

    const exerciciosRows = await getCachedRows('exercicios', []);

    const diasMapeados = diasParaTreino.map(dia => {
      const diaId = dia.get('id');
      const exsOfDia = exerciciosRows.filter(r => r.get('dia_treino_id') === diaId);

      return {
        letra_dia: dia.get('letra_dia'),
        foco_muscular: dia.get('foco_muscular') || '',
        exercicios: exsOfDia.map(ex => ({
          nome: ex.get('nome') || '',
          series: ex.get('series') || 3,
          repeticoes: ex.get('repeticoes') || '10-12',
          descanso: ex.get('descanso') || 60,
          carga: ex.get('carga') || '',
          observacoes: ex.get('observacoes') || ''
        }))
      };
    });

    res.json({
      nome_ficha: activeTreino.get('nome_ficha') || '',
      tipo_divisao: activeTreino.get('tipo_divisao') || 'A/B/C',
      objetivo: activeTreino.get('objetivo') || '',
      duracao_dias: activeTreino.get('duracao_dias') || '',
      data_termino: activeTreino.get('data_termino') || '',
      dias: diasMapeados
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Criar Estrutura de Treino (Master -> Dias -> Exercicios)
router.post('/fichas', adminMiddleware, async (req, res) => {
  try {
    const { user_id, nome_ficha, tipo_divisao, objetivo, duracao_dias, data_termino, dias } = req.body;
    // dias = [{ letra_dia: 'A', foco_muscular: 'Peito', exercicios: [{nome, series, reps...}] }, ...]

    const treinoId = uuidv4();

    // Inativar fichas antigas do usuário
    const treinosSheet = await getSheet('treinos', []);
    const treinosRows = await treinosSheet.getRows();
    for (const row of treinosRows) {
      if (row.get('user_id') === user_id && (row.get('status') === 'ativo' || row.get('status') === 'ativa')) {
        row.set('status', 'inativo');
        await row.save();
      }
    }

    // Salvar Master Treino
    await treinosSheet.addRow({
      id: treinoId,
      user_id,
      nome_ficha,
      tipo_divisao,
      objetivo,
      duracao_dias: duracao_dias || '',
      data_termino: data_termino || '',
      status: 'ativo',
      created_at: new Date().toISOString()
    });

    const diasSheet = await getSheet('dias_treino', []);
    const exerciciosSheet = await getSheet('exercicios', []);

    // Salvar Dias e Exercícios iterativamente
    for (const dia of dias) {
      const diaId = uuidv4();
      await diasSheet.addRow({
        id: diaId,
        treino_id: treinoId,
        letra_dia: dia.letra_dia,
        foco_muscular: dia.foco_muscular
      });

      for (let i = 0; i < dia.exercicios.length; i++) {
        const ex = dia.exercicios[i];
        await exerciciosSheet.addRow({
          id: uuidv4(),
          dia_treino_id: diaId,
          ordem: String(i + 1),
          nome: ex.nome,
          series: String(ex.series),
          repeticoes: String(ex.repeticoes),
          carga: String(ex.carga || ''),
          descanso: String(ex.descanso || '60'),
          observacoes: ex.observacoes || ''
        });
      }
    }

    // Registrar o log de auditoria
    const logsSheet = await getSheet('logs', []);
    await logsSheet.addRow({
      id: uuidv4(),
      usuario: req.user.id,
      acao: `Criou Ficha '${nome_ficha}' para usuario ${user_id}`,
      data: new Date().toISOString()
    });

    res.status(201).json({ message: 'Ficha de treino criada com sucesso!', treino_id: treinoId });

    // Invalida caches afetados
    invalidateCache('treinos');
    invalidateCache('dias_treino');
    invalidateCache('exercicios');
    invalidateCache('logs');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DELETE /admin/usuarios/:id — Exclusão em cascata de aluno e seus dados
// ============================================
router.delete('/usuarios/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar as planilhas do Sheets para ter referências
    const usuariosSheet = await getSheet('usuarios');
    const anamneseSheet = await getSheet('anamnese');
    const histSheet = await getSheet('historico_treinos');
    const treinosSheet = await getSheet('treinos');
    const diasSheet = await getSheet('dias_treino');
    const exsSheet = await getSheet('exercicios');

    // Carregar todas as linhas
    const [
      usuariosRows, anamneseRows, histRows, treinosRows, diasRows, exsRows
    ] = await Promise.all([
      usuariosSheet.getRows(),
      anamneseSheet.getRows(),
      histSheet.getRows(),
      treinosSheet.getRows(),
      diasSheet.getRows(),
      exsSheet.getRows()
    ]);

    const userRow = usuariosRows.find(r => r.get('id') === id);
    if (!userRow) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Coletar linhas relacionadas
    const rowsToDelete = [];
    rowsToDelete.push(userRow);

    const anamneseRow = anamneseRows.find(r => r.get('id_usuario') === id);
    if (anamneseRow) rowsToDelete.push(anamneseRow);

    const userHistRows = histRows.filter(r => r.get('user_id') === id);
    rowsToDelete.push(...userHistRows);

    const userTreinosRows = treinosRows.filter(r => r.get('user_id') === id);
    const treinosIds = userTreinosRows.map(t => t.get('id'));
    rowsToDelete.push(...userTreinosRows);

    const userDiasRows = diasRows.filter(r => treinosIds.includes(r.get('treino_id')));
    const diasIds = userDiasRows.map(d => d.get('id'));
    rowsToDelete.push(...userDiasRows);

    const userExsRows = exsRows.filter(r => diasIds.includes(r.get('dia_treino_id')));
    rowsToDelete.push(...userExsRows);

    // Deletar fisicamente (de trás pra frente é mais seguro com APIs baseadas em índices, mas o google-spreadsheet trata isso pela instância da linha)
    for (const row of rowsToDelete) {
      await row.delete();
    }

    // Invalidar todo o cache associado
    invalidateCache('usuarios');
    invalidateCache('anamnese');
    invalidateCache('historico_treinos');
    invalidateCache('treinos');
    invalidateCache('dias_treino');
    invalidateCache('exercicios');

    res.json({ message: 'Usuário e todos os dados associados foram excluídos com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
