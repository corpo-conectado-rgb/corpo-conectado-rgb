const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDoc, getSheet, getCachedRows, invalidateCache } = require('../services/googleSheets');
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
          descanso: ex.get('descanso') !== undefined && ex.get('descanso') !== null && ex.get('descanso') !== '' ? Number(ex.get('descanso')) : '',
          grupomuscular: dia.get('foco_muscular') || 'Geral',
          observacoes: ex.get('observacoes') || ''
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
          descanso: ex.get('descanso') !== undefined && ex.get('descanso') !== null ? ex.get('descanso') : '',
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

// ============================================
// GET /admin/fichas/templates — Lista todas as fichas ativas para usar como modelo
// ============================================
router.get('/fichas/templates', adminMiddleware, async (req, res) => {
  try {
    const treinosRows = await getCachedRows('treinos', []);
    const usuariosRows = await getCachedRows('usuarios', []);

    // Criar um mapa de id de usuário para nome
    const userMap = {};
    usuariosRows.forEach(u => {
      userMap[u.get('id')] = u.get('nome');
    });

    // Filtrar apenas treinos ativos
    const templates = treinosRows
      .filter(r => r.get('status') === 'ativo' || r.get('status') === 'ativa')
      .map(r => ({
        id_treino: r.get('id'),
        nome_ficha: r.get('nome_ficha') || 'Sem Nome',
        nome_aluno: userMap[r.get('user_id')] || 'Aluno Desconhecido',
        objetivo: r.get('objetivo') || ''
      }));

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /admin/fichas/clone/:treinoId — Retorna estrutura RAW de uma ficha específica pelo seu ID
// ============================================
router.get('/fichas/clone/:treinoId', adminMiddleware, async (req, res) => {
  try {
    const { treinoId } = req.params;
    const treinosRows = await getCachedRows('treinos', []);
    const activeTreino = treinosRows.find(r => r.get('id') === treinoId);

    if (!activeTreino) {
      return res.status(404).json({ error: 'Ficha não encontrada' });
    }

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
          descanso: ex.get('descanso') !== undefined && ex.get('descanso') !== null ? ex.get('descanso') : '',
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
          descanso: ex.descanso !== undefined && ex.descanso !== null ? String(ex.descanso) : '',
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

    // Deletar fisicamente via batchUpdate para evitar limite de requisições da API (Quota 429)
    const doc = await getDoc();
    
    const rowsBySheet = {};
    for (const row of rowsToDelete) {
      const sheetId = row._worksheet.sheetId;
      if (!rowsBySheet[sheetId]) rowsBySheet[sheetId] = [];
      rowsBySheet[sheetId].push(row.rowNumber);
    }

    const batchRequests = [];
    for (const sheetId in rowsBySheet) {
      // Ordenar decrescente para não bagunçar os índices ao deletar
      const sortedRowNumbers = [...new Set(rowsBySheet[sheetId])].sort((a, b) => b - a);
      for (const rowNum of sortedRowNumbers) {
        batchRequests.push({
          deleteDimension: {
            range: {
              sheetId: parseInt(sheetId),
              dimension: 'ROWS',
              startIndex: rowNum - 1,
              endIndex: rowNum
            }
          }
        });
      }
    }

    if (batchRequests.length > 0) {
      await doc.auth.request({
        method: 'POST',
        url: `https://sheets.googleapis.com/v4/spreadsheets/${doc.spreadsheetId}:batchUpdate`,
        data: { requests: batchRequests }
      });
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

// ==========================================================
// MÓDULO ACOMPANHAMENTO DE ALUNOS & DASHBOARD GERENCIAL (BI)
// ==========================================================
async function gerarDadosAcompanhamento() {
  const usuariosRows = await getCachedRows('usuarios', ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role', 'trial_expira', 'ultimo_acesso']);
  const anamneseRows = await getCachedRows('anamnese', ['id_usuario', 'idade', 'altura', 'peso', 'sexo', 'objetivo', 'nivel_fisico', 'lesoes_criticas', 'habitos_freq', 'habitos_tempo', 'habitos_local', 'data_nascimento', 'telefone']);
  const histTreinosRows = await getCachedRows('historico_treinos', ['id', 'user_id', 'treino_id', 'dia_treino_id', 'letra', 'nome_dia', 'data', 'hora_inicio', 'hora_fim', 'duracao_seg', 'volume_total', 'exercicios_feitos', 'exercicios_total', 'detalhes']);
  const histPesoRows = await getCachedRows('historico_peso', ['id', 'user_id', 'peso', 'data_registro']);
  const treinosRows = await getCachedRows('treinos', ['id', 'user_id', 'nome_ficha', 'objetivo', 'status', 'data_inicio', 'data_termino']);
  const assinaturasRows = await getCachedRows('assinaturas', ['id', 'user_id', 'status']);

  const agora = new Date();
  agora.setHours(23, 59, 59, 999);
  const hojeStr = agora.toISOString().split('T')[0];
  const trintaDiasAtras = new Date(agora.getTime() - (30 * 86400000));
  const seteDiasAtras = new Date(agora.getTime() - (7 * 86400000));

  // Apenas alunos reais (não admin)
  const alunos = usuariosRows.filter(r => r.get('role') !== 'admin');

  const listaAlunos = alunos.map(alunoRow => {
    const id = alunoRow.get('id');
    const nome = alunoRow.get('nome') || 'Anônimo';
    const email = alunoRow.get('email') || '';
    const dataCriacao = alunoRow.get('data_criacao') || '';
    let ultimoAcessoStr = alunoRow.get('ultimo_acesso') || '';

    // Anamnese
    const anamnese = anamneseRows.find(r => r.get('id_usuario') === id);
    const telefone = anamnese ? anamnese.get('telefone') : '';
    const pesoAnamnese = anamnese && anamnese.get('peso') ? Number(String(anamnese.get('peso')).replace(',', '.')) : 0;
    const objetivo = anamnese ? (anamnese.get('objetivo') || 'Geral') : 'Geral';

    // Assinatura & Trial
    const assinatura = assinaturasRows.find(r => r.get('user_id') === id && r.get('status') === 'ATIVA');
    const statusPlano = assinatura ? 'ASSINANTE' : 'TRIAL';

    // Ficha Ativa / Status
    const fichasAtivas = treinosRows.filter(r => r.get('user_id') === id && (r.get('status') === 'ativo' || r.get('status') === 'ativa'));
    let fichaStatus = 'SEM_TREINO';
    let nomeFicha = '';
    if (fichasAtivas.length > 0) {
      const ficha = fichasAtivas[0];
      nomeFicha = ficha.get('nome_ficha') || 'Ficha Atual';
      const dataTermino = ficha.get('data_termino');
      if (dataTermino && new Date(dataTermino) < new Date(hojeStr)) {
        fichaStatus = 'VENCIDA';
      } else {
        fichaStatus = 'ATIVA';
      }
    }

    // Helper para converter data no formato brasileiro (DD/MM/YYYY) ou ISO para Date de forma confiável
    const parseDateBrOrIso = (dateStr) => {
      if (!dateStr) return null;
      const s = String(dateStr).trim();
      if (s.includes('/')) {
        const parts = s.split(/[,\s]+/);
        const dataPart = parts[0];
        const horaPart = parts[1] || '00:00:00';
        const [dia, mes, ano] = dataPart.split('/');
        if (dia && mes && ano) {
          const d = new Date(`${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${horaPart}`);
          if (!isNaN(d.getTime())) return d;
        }
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };

    // Helper para calcular diferença em dias civis (desconsiderando horas)
    const calcDiasCivil = (d) => {
      if (!d || isNaN(d.getTime())) return 99;
      const agoraMid = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return Math.max(0, Math.round((agoraMid - dMid) / 86400000));
    };

    // Dias sem acessar o app
    let diasSemAcessar = 99;
    if (ultimoAcessoStr) {
      diasSemAcessar = calcDiasCivil(parseDateBrOrIso(ultimoAcessoStr));
    } else if (dataCriacao) {
      diasSemAcessar = calcDiasCivil(parseDateBrOrIso(dataCriacao));
    }

    // Treinos Histórico
    const treinosAluno = histTreinosRows
      .filter(r => r.get('user_id') === id)
      .map(r => ({
        data: r.get('data'),
        duracao_seg: Number(r.get('duracao_seg')) || 0,
        volume_total: Number(r.get('volume_total')) || 0
      }))
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    let ultimoTreinoData = '';
    let diasSemTreinar = null;
    let freqSemana = 0;
    let freqMes = 0;
    let treinosMesAtual = 0;
    let volumeMes = 0;

    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    treinosAluno.forEach(t => {
      const dt = new Date(t.data + 'T12:00:00');
      if (!ultimoTreinoData) {
        ultimoTreinoData = t.data;
        diasSemTreinar = calcDiasCivil(dt);
      }
      if (dt >= seteDiasAtras) freqSemana++;
      if (dt >= trintaDiasAtras) freqMes++;
      if (dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual) {
        treinosMesAtual++;
        volumeMes += t.volume_total;
      }
    });

    // Reconciliação lógica de coerência: É impossível ter treinado recentemente e não ter acessado o aplicativo.
    // Se o dia do último treino for mais recente que o último acesso registrado, equalizamos o acesso com o treino.
    if (ultimoTreinoData && diasSemTreinar !== null) {
      if (diasSemTreinar < diasSemAcessar) {
        diasSemAcessar = diasSemTreinar;
        ultimoAcessoStr = `${ultimoTreinoData}T12:00:00`;
      }
    }

    // Cálculo de Streaks (Semanas consecutivas) e Maior Streak
    let streakAtual = 0;
    let maiorStreak = 0;
    if (treinosAluno.length > 0) {
      const weekSet = new Set();
      treinosAluno.forEach(t => {
        const d = new Date(t.data + 'T12:00:00');
        const fd = new Date(d.getFullYear(), 0, 1);
        const wn = Math.ceil((((d - fd) / 86400000) + fd.getDay() + 1) / 7);
        weekSet.add(`${d.getFullYear()}-${wn}`);
      });

      // Calcular Streak Atual
      const currentWeekD = new Date(agora);
      const fdCurr = new Date(currentWeekD.getFullYear(), 0, 1);
      const wnCurr = Math.ceil((((currentWeekD - fdCurr) / 86400000) + fdCurr.getDay() + 1) / 7);
      let checkWeekStr = `${currentWeekD.getFullYear()}-${wnCurr}`;
      let checkDate = new Date(currentWeekD);

      while (weekSet.has(checkWeekStr)) {
        streakAtual++;
        checkDate.setDate(checkDate.getDate() - 7);
        const fd2 = new Date(checkDate.getFullYear(), 0, 1);
        const wn2 = Math.ceil((((checkDate - fd2) / 86400000) + fd2.getDay() + 1) / 7);
        checkWeekStr = `${checkDate.getFullYear()}-${wn2}`;
      }
      if (streakAtual === 0) {
        // Testa a semana anterior se ainda não treinou na semana corrente
        let prevDate = new Date(currentWeekD);
        prevDate.setDate(prevDate.getDate() - 7);
        const fdPrev = new Date(prevDate.getFullYear(), 0, 1);
        const wnPrev = Math.ceil((((prevDate - fdPrev) / 86400000) + fdPrev.getDay() + 1) / 7);
        let prevWeekStr = `${prevDate.getFullYear()}-${wnPrev}`;
        while (weekSet.has(prevWeekStr)) {
          streakAtual++;
          prevDate.setDate(prevDate.getDate() - 7);
          const fd2 = new Date(prevDate.getFullYear(), 0, 1);
          const wn2 = Math.ceil((((prevDate - fd2) / 86400000) + fd2.getDay() + 1) / 7);
          prevWeekStr = `${prevDate.getFullYear()}-${wn2}`;
        }
      }

      // Calcular Maior Streak na História
      const weeksArr = Array.from(weekSet).sort();
      let tempStreak = 0;
      let lastYearWeek = null;
      weeksArr.forEach(w => {
        const [ano, semana] = w.split('-').map(Number);
        if (!lastYearWeek) {
          tempStreak = 1;
        } else {
          const [lastAno, lastSemana] = lastYearWeek;
          const isNext = (ano === lastAno && semana === lastSemana + 1) || (ano === lastAno + 1 && semana === 1);
          if (isNext) tempStreak++;
          else tempStreak = 1;
        }
        if (tempStreak > maiorStreak) maiorStreak = tempStreak;
        lastYearWeek = [ano, semana];
      });
      if (streakAtual > maiorStreak) maiorStreak = streakAtual;
    }

    // Evolução de Peso
    const pesosAluno = histPesoRows
      .filter(r => r.get('user_id') === id)
      .map(r => ({
        data_registro: r.get('data_registro'),
        peso: Number(String(r.get('peso')).replace(',', '.')) || 0
      }))
      .filter(r => r.peso > 0)
      .sort((a, b) => new Date(a.data_registro) - new Date(b.data_registro));

    let pesoAtual = pesoAnamnese;
    let pesoInicial = pesoAnamnese;
    let dataUltimoPeso = '';
    let graficoPeso = [];

    if (pesoAnamnese > 0) {
      graficoPeso.push({ data: 'Inicial', peso: pesoAnamnese });
    }

    if (pesosAluno.length > 0) {
      pesoAtual = pesosAluno[pesosAluno.length - 1].peso;
      if (pesoInicial === 0) pesoInicial = pesosAluno[0].peso;
      dataUltimoPeso = pesosAluno[pesosAluno.length - 1].data_registro;

      pesosAluno.slice(-5).forEach(p => {
        const d = new Date(p.data_registro);
        const diaMes = (!isNaN(d.getTime())) ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : 'Atual';
        graficoPeso.push({ data: diaMes, peso: p.peso });
      });
    }

    const variacaoKg = (pesoAtual && pesoInicial && pesoInicial > 0) ? Number((pesoAtual - pesoInicial).toFixed(1)) : 0;
    const variacaoPct = (pesoAtual && pesoInicial && pesoInicial > 0) ? Number(((variacaoKg / pesoInicial) * 100).toFixed(1)) : 0;

    // Status de Risco (Churn)
    let statusEngajamento = 'ENGAJADO';
    if (diasSemTreinar === null || diasSemTreinar > 7 || diasSemAcessar > 15) {
      statusEngajamento = 'RISCO_ABANDONO';
    } else if (diasSemTreinar > 3 || diasSemAcessar > 5) {
      statusEngajamento = 'ALERTA';
    }

    return {
      id,
      nome,
      email,
      telefone,
      objetivo,
      statusPlano,
      fichaStatus,
      nomeFicha,
      dataCriacao,
      ultimoAcesso: ultimoAcessoStr || dataCriacao,
      diasSemAcessar,
      ultimoTreino: ultimoTreinoData,
      diasSemTreinar,
      freqSemana,
      freqMes,
      treinosMesAtual,
      volumeMes,
      streakAtual,
      maiorStreak,
      pesoAtual,
      pesoInicial,
      variacaoKg,
      variacaoPct,
      dataUltimoPeso,
      graficoPeso,
      statusEngajamento
    };
  });

  return listaAlunos;
}

router.get('/acompanhamento-alunos', adminMiddleware, async (req, res) => {
  try {
    const listaAlunos = await gerarDadosAcompanhamento();
    res.json(listaAlunos);
  } catch (error) {
    console.error('Erro em /admin/acompanhamento-alunos:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard-gerencial', adminMiddleware, async (req, res) => {
  try {
    const listaAlunos = await gerarDadosAcompanhamento();
    
    const totalAtivos = listaAlunos.filter(a => a.statusPlano === 'ASSINANTE').length;
    const totalTrial = listaAlunos.filter(a => a.statusPlano === 'TRIAL').length;
    const ativosHoje = listaAlunos.filter(a => a.diasSemAcessar === 0).length;
    const treinaramHoje = listaAlunos.filter(a => a.diasSemTreinar === 0).length;
    
    const inativos7Dias = listaAlunos.filter(a => a.diasSemTreinar === null || a.diasSemTreinar >= 7).length;
    const semAcesso15Dias = listaAlunos.filter(a => a.diasSemAcessar >= 15).length;

    const totalAlunos = listaAlunos.length || 1;
    const mediaTreinosSemana = (listaAlunos.reduce((acc, curr) => acc + curr.freqSemana, 0) / totalAlunos).toFixed(1);
    const mediaTreinosMes = (listaAlunos.reduce((acc, curr) => acc + curr.freqMes, 0) / totalAlunos).toFixed(1);

    const alunosEngajados = listaAlunos.filter(a => a.statusEngajamento === 'ENGAJADO').length;
    const taxaFrequenciaAtiva = Math.round((alunosEngajados / totalAlunos) * 100);

    // Volume total da plataforma no mês em Toneladas (ou KG)
    const volumeTotalKg = listaAlunos.reduce((acc, curr) => acc + curr.volumeMes, 0);

    // Evolução Média de Peso
    const evolucoes = listaAlunos.filter(a => a.variacaoKg !== 0);
    const evolucaoMediaKg = evolucoes.length > 0 
      ? (evolucoes.reduce((acc, curr) => acc + curr.variacaoKg, 0) / evolucoes.length).toFixed(1)
      : '0.0';

    // Últimos alunos cadastrados (5)
    const ultimosCadastrados = [...listaAlunos].reverse().slice(0, 5).map(a => ({
      id: a.id,
      nome: a.nome,
      dataCriacao: a.dataCriacao,
      statusPlano: a.statusPlano
    }));

    // Últimos que atualizaram o peso (5)
    const ultimosAtualizaramPeso = [...listaAlunos]
      .filter(a => a.dataUltimoPeso)
      .sort((a, b) => new Date(b.dataUltimoPeso) - new Date(a.dataUltimoPeso))
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        nome: a.nome,
        pesoAtual: a.pesoAtual,
        variacaoKg: a.variacaoKg,
        variacaoPct: a.variacaoPct,
        dataUltimoPeso: a.dataUltimoPeso
      }));

    res.json({
      base: {
        totalAlunos: listaAlunos.length,
        totalAtivos,
        totalTrial,
        ativosHoje,
        ultimosCadastrados
      },
      engajamento: {
        treinaramHoje,
        inativos7Dias,
        semAcesso15Dias,
        mediaTreinosSemana,
        mediaTreinosMes,
        taxaFrequenciaAtiva
      },
      evolucao: {
        evolucaoMediaKg,
        ultimosAtualizaramPeso
      },
      comunidade: {
        volumeTotalKg
      }
    });
  } catch (error) {
    console.error('Erro em /admin/dashboard-gerencial:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
