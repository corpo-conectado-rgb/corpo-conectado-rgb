const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getCachedRows } = require('../services/googleSheets');

const HISTORICO_HEADERS = [
  'id', 'user_id', 'treino_id', 'dia_treino_id', 'letra', 'nome_dia',
  'data', 'hora_inicio', 'hora_fim', 'duracao_seg', 'volume_total',
  'exercicios_feitos', 'exercicios_total', 'detalhes'
];

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar histórico do aluno
    const histRows = await getCachedRows('historico_treinos', HISTORICO_HEADERS);
    const userHist = histRows
      .filter(r => r.get('user_id') === userId)
      .map(r => ({
        data: r.get('data'),
        volume_total: Number(r.get('volume_total')) || 0,
        detalhes: r.get('detalhes')
      }))
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    // Cálculos de Volume Mensal Real (Últimos 30 dias)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    const treinosUltimos30Dias = userHist.filter(t => new Date(t.data) >= trintaDiasAtras);
    const volumeMensal = treinosUltimos30Dias.reduce((acc, curr) => acc + curr.volume_total, 0);

    // Calcular "Semanas Ativas Consecutivas" (Streak)
    let streakSemanas = 0;
    if (userHist.length > 0) {
      // Agrupar treinos por semana do ano
      const weekSet = new Set();
      userHist.forEach(t => {
        const d = new Date(t.data);
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        weekSet.add(`${d.getFullYear()}-${weekNum}`);
      });

      const weeksArray = Array.from(weekSet).sort().reverse();
      
      const currentWeekD = new Date();
      const firstDayOfCurrentYear = new Date(currentWeekD.getFullYear(), 0, 1);
      const pastDaysOfCurrentYear = (currentWeekD - firstDayOfCurrentYear) / 86400000;
      const currentWeekNum = Math.ceil((pastDaysOfCurrentYear + firstDayOfCurrentYear.getDay() + 1) / 7);
      const currentWeekStr = `${currentWeekD.getFullYear()}-${currentWeekNum}`;

      let checkWeek = currentWeekStr;
      let checkDate = new Date(currentWeekD);

      while (weekSet.has(checkWeek)) {
        streakSemanas++;
        // Retroceder uma semana
        checkDate.setDate(checkDate.getDate() - 7);
        const fd = new Date(checkDate.getFullYear(), 0, 1);
        const pd = (checkDate - fd) / 86400000;
        const wn = Math.ceil((pd + fd.getDay() + 1) / 7);
        checkWeek = `${checkDate.getFullYear()}-${wn}`;
      }
      
      // Se a semana atual não tem treino, tentar a anterior (se ele treinou na semana passada, streak ainda conta)
      if (streakSemanas === 0) {
         let prevCheckDate = new Date(currentWeekD);
         prevCheckDate.setDate(prevCheckDate.getDate() - 7);
         const fd = new Date(prevCheckDate.getFullYear(), 0, 1);
         const pd = (prevCheckDate - fd) / 86400000;
         const wn = Math.ceil((pd + fd.getDay() + 1) / 7);
         let prevWeekStr = `${prevCheckDate.getFullYear()}-${wn}`;
         
         while (weekSet.has(prevWeekStr)) {
            streakSemanas++;
            prevCheckDate.setDate(prevCheckDate.getDate() - 7);
            const fd2 = new Date(prevCheckDate.getFullYear(), 0, 1);
            const pd2 = (prevCheckDate - fd2) / 86400000;
            const wn2 = Math.ceil((pd2 + fd2.getDay() + 1) / 7);
            prevWeekStr = `${prevCheckDate.getFullYear()}-${wn2}`;
         }
      }
    }

    // Evolução de Treinos por Mês
    const barData = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('pt-BR', { month: 'short' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const treinosMes = userHist.filter(t => {
        const dt = new Date(t.data);
        return dt >= monthStart && dt <= monthEnd;
      });

      const qtdTreinos = treinosMes.length;
      barData.push({ name: monthStr.charAt(0).toUpperCase() + monthStr.slice(1), treinos: qtdTreinos });
    }

    // Pegar o último treino para mensagem
    const diasDesdeUltimoTreino = userHist.length > 0 ? Math.floor((new Date() - new Date(userHist[0].data)) / (1000 * 60 * 60 * 24)) : null;

    res.json({
      streakSemanas,
      volumeMensal,
      barData,
      diasDesdeUltimoTreino,
      totalSessoes: userHist.length
    });

  } catch (error) {
    console.error("Erro no Dashboard:", error);
    res.status(500).json({ error: 'Falha ao buscar dados do Dashboard' });
  }
});

module.exports = router;
