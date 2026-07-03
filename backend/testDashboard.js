const dashboardRouter = require('./routes/dashboard');
const { getCachedRows } = require('./services/googleSheets');
const HISTORICO_HEADERS = [
  'id', 'user_id', 'dia_treino_id', 'treino_id', 'letra',
  'nome_dia', 'data', 'hora_inicio', 'hora_fim', 'duracao_seg',
  'volume_total', 'exercicios_feitos', 'exercicios_total', 'detalhes'
];

async function run() {
  const userId = '13e45fd6-a60f-48d9-ad5e-d97bdbe52050';
  const histRows = await getCachedRows('historico_treinos', HISTORICO_HEADERS, true);
  const userHist = histRows
    .filter(r => r.get('user_id') === userId)
    .map(r => ({
      data: r.get('data'),
      hora_inicio: r.get('hora_inicio')
    }))
    .sort((a, b) => {
      const dtA = new Date(`${a.data}T${a.hora_inicio || '00:00'}`);
      const dtB = new Date(`${b.data}T${b.hora_inicio || '00:00'}`);
      return dtB - dtA;
    });

  let diasDesdeUltimoTreino = null;
  if (userHist.length > 0) {
    const d = new Date(userHist[0].data + 'T12:00:00');
    
    const agora = new Date();
    agora.setHours(agora.getHours() - 3); // UTC-3 (Brasil)
    const dataHojeStr = agora.toISOString().split('T')[0];
    const hoje = new Date(dataHojeStr + 'T12:00:00');
    
    diasDesdeUltimoTreino = Math.floor((hoje - d) / (1000 * 60 * 60 * 24));
    console.log("userHist[0]:", userHist[0]);
    console.log("diasDesdeUltimoTreino:", diasDesdeUltimoTreino);
    console.log("agora:", agora.toISOString());
    console.log("dataHojeStr:", dataHojeStr);
  }
}
run();
