const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middlewares/authMiddleware');
const { getCachedRows, getSheet, invalidateCache } = require('../services/googleSheets');

// Headers da aba historico_treinos
const HISTORICO_HEADERS = [
  'id', 'user_id', 'treino_id', 'dia_treino_id', 'letra', 'nome_dia',
  'data', 'hora_inicio', 'hora_fim', 'duracao_seg', 'volume_total',
  'exercicios_feitos', 'exercicios_total', 'detalhes'
];

// Headers da anamnese (mesmo padrão do auth.js)
const ANAMNESE_HEADERS = [
  'id_usuario', 'idade', 'altura', 'peso', 'sexo', 'objetivo',
  'nivel_fisico', 'lesoes_criticas', 'habitos_freq', 'habitos_tempo', 'habitos_local', 'data_nascimento'
];

// Dias da semana em português
const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

/**
 * Calcula a próxima letra do treino baseado na letra atual e nos dias disponíveis.
 */
function calcularProximaLetra(diasDoTreino, letraAtual) {
  if (!diasDoTreino || diasDoTreino.length === 0) return null;

  const letras = diasDoTreino.map(d => d.get('letra_dia'));
  const idxAtual = letras.indexOf(letraAtual);

  if (idxAtual === -1) return letras[0];
  return letras[(idxAtual + 1) % letras.length];
}

/**
 * Extrai o valor MÁXIMO de frequência semanal a partir da string habitos_freq.
 * Exemplos: '3 a 4 dias' → 4, '5 ou mais' → 5, '1 a 2' → 2
 */
function parseMetaSemanal(habitosFreq) {
  if (!habitosFreq) return 3; // Padrão seguro

  const numeros = habitosFreq.match(/\d+/g);
  if (!numeros || numeros.length === 0) return 3;

  return Math.max(...numeros.map(Number));
}

/**
 * Calcula a sequência (streak) inteligente do usuário.
 */
function calcularSequencia(sessoes, metaObjetivo) {
  if (!sessoes || sessoes.length === 0) return 0;

  const intervaloEsperado = 7 / metaObjetivo;
  const maxGap = Math.max(3, Math.ceil(intervaloEsperado * 2.5));

  // Ordenar por data+hora DESC para garantir ordem cronológica correta
  const sorted = [...sessoes].sort((a, b) => {
    const dtA = new Date(`${a.data}T${a.hora_inicio || '00:00'}`);
    const dtB = new Date(`${b.data}T${b.hora_inicio || '00:00'}`);
    return dtB - dtA;
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const ultimaData = new Date(sorted[0].data);
  ultimaData.setHours(0, 0, 0, 0);

  const diffHoje = Math.floor((hoje - ultimaData) / (1000 * 60 * 60 * 24));
  if (diffHoje > maxGap) return 0;

  let contagem = 1;

  for (let i = 0; i < sorted.length - 1; i++) {
    const dataAtual = new Date(sorted[i].data);
    const dataAnterior = new Date(sorted[i + 1].data);
    dataAtual.setHours(0, 0, 0, 0);
    dataAnterior.setHours(0, 0, 0, 0);

    const gap = Math.floor((dataAtual - dataAnterior) / (1000 * 60 * 60 * 24));

    // Pular sessões no mesmo dia
    if (gap === 0) continue;

    if (gap > maxGap) break;

    contagem++;
  }

  return contagem;
}

// ============================================
// GET /my-sheet — Ficha de treino do usuário
// ============================================
router.get('/my-sheet', authMiddleware, async (req, res) => {
  try {
    const treinosRows = await getCachedRows('treinos', []);
    const activeTreino = treinosRows.find(
      r => r.get('user_id') === req.user.id && (r.get('status') === 'ativo' || r.get('status') === 'ativa')
    );

    if (!activeTreino) {
      return res.json([]); // Se não tiver ficha montada, devolve um array vazio
    }

    const treinoId = activeTreino.get('id');
    const objetivo = activeTreino.get('objetivo');
    const dataTermino = activeTreino.get('data_termino');

    const diasRows = await getCachedRows('dias_treino', []);
    const diasParaTreino = diasRows.filter(r => r.get('treino_id') === treinoId);

    const exerciciosRows = await getCachedRows('exercicios', []);

    // Calcular média real de duração por letra a partir do histórico
    const histRows = await getCachedRows('historico_treinos', HISTORICO_HEADERS);
    const userHist = histRows.filter(r => r.get('user_id') === req.user.id);
    const mediasPorLetra = {};
    userHist.forEach(r => {
      const letra = r.get('letra');
      const seg = Number(r.get('duracao_seg')) || 0;
      if (!mediasPorLetra[letra]) mediasPorLetra[letra] = { soma: 0, qtd: 0 };
      mediasPorLetra[letra].soma += seg;
      mediasPorLetra[letra].qtd += 1;
    });

    const fichasFrontend = diasParaTreino.map((dia, idx) => {
      const diaId = dia.get('id');
      const exsOfDia = exerciciosRows.filter(r => r.get('dia_treino_id') === diaId);
      const letraDia = dia.get('letra_dia');
      const stats = mediasPorLetra[letraDia];
      const duracaoStr = (stats && stats.qtd > 0)
        ? `${Math.round(stats.soma / stats.qtd / 60)} min`
        : '-- min';

      return {
        treino_id: treinoId,
        id: diaId,
        letra: letraDia,
        nome: dia.get('foco_muscular'),
        objetivo: objetivo || 'Hipertrofia',
        data_termino: dataTermino || '',
        duracao: duracaoStr, // Média real do histórico do aluno
        ativa: idx === 0, // Inicia a Letra "A" como standard ativo na visualizacao
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
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// POST /complete — Registrar sessão de treino concluída
// ============================================
router.post('/complete', authMiddleware, async (req, res) => {
  try {
    const {
      dia_treino_id, treino_id, letra, nome_dia,
      duracao_seg, hora_inicio, hora_fim, exercicios
    } = req.body;

    // Calcular volume total (soma de carga * reps das séries concluídas)
    let volumeTotal = 0;
    let exerciciosFeitos = 0;
    const exerciciosTotal = exercicios ? exercicios.length : 0;

    if (exercicios && exercicios.length > 0) {
      for (const ex of exercicios) {
        let temSerieConcluida = false;
        if (ex.series && ex.series.length > 0) {
          for (const serie of ex.series) {
            if (serie.concluida === true) {
              volumeTotal += (Number(serie.carga) || 0) * (Number(serie.reps) || 0);
              temSerieConcluida = true;
            }
          }
        }
        if (temSerieConcluida) exerciciosFeitos++;
      }
    }

    // Data de hoje no fuso horário do Brasil (UTC-3)
    const data = new Date();
    data.setHours(data.getHours() - 3);
    const dataHoje = data.toISOString().split('T')[0];

    const sessaoId = uuidv4();

    // Gravar na aba historico_treinos
    const sheet = await getSheet('historico_treinos', HISTORICO_HEADERS);
    await sheet.addRow({
      id: sessaoId,
      user_id: req.user.id,
      treino_id: treino_id,
      dia_treino_id: dia_treino_id,
      letra: letra,
      nome_dia: nome_dia,
      data: dataHoje,
      hora_inicio: hora_inicio,
      hora_fim: hora_fim,
      duracao_seg: duracao_seg,
      volume_total: volumeTotal,
      exercicios_feitos: exerciciosFeitos,
      exercicios_total: exerciciosTotal,
      detalhes: JSON.stringify(exercicios)
    });

    invalidateCache('historico_treinos');

    // Calcular próxima letra
    const diasRows = await getCachedRows('dias_treino', []);
    const diasDoTreino = diasRows.filter(r => r.get('treino_id') === treino_id);
    const proximaLetra = calcularProximaLetra(diasDoTreino, letra);

    res.json({
      success: true,
      sessao_id: sessaoId,
      proxima_letra: proximaLetra
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /history — Histórico de treinos do usuário
// ============================================
router.get('/history', authMiddleware, async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 30;
    if (limit > 90) limit = 90;

    const rows = await getCachedRows('historico_treinos', HISTORICO_HEADERS);
    const userRows = rows.filter(r => r.get('user_id') === req.user.id);

    // Mapear para objetos e ordenar por data DESC
    const historico = userRows
      .map(r => ({
        id: r.get('id'),
        treino_id: r.get('treino_id'),
        dia_treino_id: r.get('dia_treino_id'),
        letra: r.get('letra'),
        nome_dia: r.get('nome_dia'),
        data: r.get('data'),
        hora_inicio: r.get('hora_inicio'),
        hora_fim: r.get('hora_fim'),
        duracao_seg: Number(r.get('duracao_seg')) || 0,
        volume_total: Number(r.get('volume_total')) || 0,
        exercicios_feitos: Number(r.get('exercicios_feitos')) || 0,
        exercicios_total: Number(r.get('exercicios_total')) || 0
      }))
      .sort((a, b) => {
        const dtA = new Date(`${a.data}T${a.hora_inicio || '00:00'}`);
        const dtB = new Date(`${b.data}T${b.hora_inicio || '00:00'}`);
        return dtB - dtA;
      })
      .slice(0, limit)
      .map(item => {
        // Adicionar dia da semana em português
        const dataObj = new Date(item.data + 'T12:00:00'); // Meio-dia para evitar problemas de timezone
        item.dia_semana = DIAS_SEMANA[dataObj.getDay()];
        return item;
      });

    res.json(historico);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /stats — Estatísticas do usuário
// ============================================
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Buscar histórico do usuário
    const rows = await getCachedRows('historico_treinos', HISTORICO_HEADERS);
    const userRows = rows.filter(r => r.get('user_id') === req.user.id);

    const sessoes = userRows.map(r => ({
      id: r.get('id'),
      treino_id: r.get('treino_id'),
      dia_treino_id: r.get('dia_treino_id'),
      letra: r.get('letra'),
      nome_dia: r.get('nome_dia'),
      data: r.get('data'),
      hora_inicio: r.get('hora_inicio'),
      duracao_seg: Number(r.get('duracao_seg')) || 0,
      exercicios_feitos: Number(r.get('exercicios_feitos')) || 0,
      exercicios_total: Number(r.get('exercicios_total')) || 0
    }));

    // Ordenar por data+hora DESC
    sessoes.sort((a, b) => {
      const dtA = new Date(`${a.data}T${a.hora_inicio || '00:00'}`);
      const dtB = new Date(`${b.data}T${b.hora_inicio || '00:00'}`);
      return dtB - dtA;
    });

    // Buscar meta semanal da anamnese
    const anamneseRows = await getCachedRows('anamnese', ANAMNESE_HEADERS);
    const anamneseRow = anamneseRows.find(r => r.get('id_usuario') === req.user.id);
    const habitosFreq = anamneseRow ? anamneseRow.get('habitos_freq') : '';
    const metaObjetivo = parseMetaSemanal(habitosFreq);

    // Datas de referência
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    // Sessões nos últimos 7 dias
    const sessoesUlt7 = sessoes.filter(s => {
      const d = new Date(s.data);
      d.setHours(0, 0, 0, 0);
      return d >= seteDiasAtras;
    });

    // Sessões nos últimos 30 dias
    const sessoesUlt30 = sessoes.filter(s => {
      const d = new Date(s.data);
      d.setHours(0, 0, 0, 0);
      return d >= trintaDiasAtras;
    });

    const diasTreinadosMes = sessoesUlt30.length;

    // Eficiência da semana (Média das porcentagens de conclusão)
    let eficienciaSemana = 0;
    if (sessoesUlt7.length > 0) {
      const sumEficiencia = sessoesUlt7.reduce((sum, s) => {
        const perc = (s.exercicios_feitos / Math.max(1, s.exercicios_total)) * 100;
        return sum + Math.min(100, perc); // Cap at 100% per session just in case
      }, 0);
      eficienciaSemana = Math.round(sumEficiencia / sessoesUlt7.length);
    }

    // Exercícios do mês
    const exerciciosMes = sessoesUlt30.reduce((sum, s) => sum + s.exercicios_feitos, 0);

    // Tempo médio das últimas 10 sessões (em minutos, arredondado)
    const ultimas10 = sessoes.slice(0, 10);
    const tempoMedio = ultimas10.length > 0
      ? Math.round(ultimas10.reduce((sum, s) => sum + s.duracao_seg, 0) / ultimas10.length / 60)
      : 0;

    // Frequência semanal
    const frequenciaSemanal = Number((diasTreinadosMes / 4.3).toFixed(1));

    // Sequência inteligente (smart streak)
    const sequenciaAtual = calcularSequencia(sessoes, metaObjetivo);

    // Próxima letra (baseada na última sessão)
    let proximaLetra = null;
    if (sessoes.length > 0) {
      const ultimaSessao = sessoes[0];
      const diasRows = await getCachedRows('dias_treino', []);
      const diasDoTreino = diasRows.filter(r => r.get('treino_id') === ultimaSessao.treino_id);
      proximaLetra = calcularProximaLetra(diasDoTreino, ultimaSessao.letra);
    }

    // Último treino
    let ultimoTreino = null;
    if (sessoes.length > 0) {
      const ultimo = sessoes[0];
      const dataObj = new Date(ultimo.data + 'T12:00:00');
      ultimoTreino = {
        letra: ultimo.letra,
        data: ultimo.data,
        dia_semana: DIAS_SEMANA[dataObj.getDay()]
      };
    }

    res.json({
      dias_treinados_mes: diasTreinadosMes,
      sequencia_atual: sequenciaAtual,
      meta_semanal: {
        feitos: sessoesUlt7.length,
        objetivo: metaObjetivo
      },
      eficiencia_semana: eficienciaSemana,
      exercicios_mes: exerciciosMes,
      tempo_medio_min: tempoMedio,
      frequencia_semanal: frequenciaSemanal,
      proxima_letra: proximaLetra,
      ultimo_treino: ultimoTreino
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET /last-loads/:dia_treino_id — Últimas cargas de um dia de treino
// ============================================
router.get('/last-loads/:dia_treino_id', authMiddleware, async (req, res) => {
  try {
    const { dia_treino_id } = req.params;

    const rows = await getCachedRows('historico_treinos', HISTORICO_HEADERS);
    const userRows = rows.filter(
      r => r.get('user_id') === req.user.id && r.get('dia_treino_id') === dia_treino_id
    );

    // Ordenar por data+hora DESC para pegar a mais recente
    userRows.sort((a, b) => {
      const dtA = new Date(`${a.get('data')}T${a.get('hora_inicio') || '00:00'}`);
      const dtB = new Date(`${b.get('data')}T${b.get('hora_inicio') || '00:00'}`);
      return dtB - dtA;
    });

    if (userRows.length === 0) {
      return res.json([]);
    }

    const ultimaSessao = userRows[0];
    const detalhesRaw = ultimaSessao.get('detalhes');

    if (!detalhesRaw) {
      return res.json([]);
    }

    const detalhes = JSON.parse(detalhesRaw);
    res.json(detalhes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
