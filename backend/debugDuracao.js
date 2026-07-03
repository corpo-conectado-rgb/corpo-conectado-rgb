const { getCachedRows } = require('./services/googleSheets');
const HISTORICO_HEADERS = [
  'id', 'user_id', 'treino_id', 'dia_treino_id', 'letra', 'nome_dia',
  'data', 'hora_inicio', 'hora_fim', 'duracao_seg', 'volume_total',
  'exercicios_feitos', 'exercicios_total', 'detalhes'
];

async function run() {
  const userId = '13e45fd6-a60f-48d9-ad5e-d97bdbe52050';

  // 1. Get active treino
  const treinosRows = await getCachedRows('treinos', []);
  const activeTreino = treinosRows.find(
    r => r.get('user_id') === userId && (r.get('status') === 'ativo' || r.get('status') === 'ativa')
  );
  console.log('Active treino_id:', activeTreino?.get('id'));

  // 2. Get history
  const histRows = await getCachedRows('historico_treinos', HISTORICO_HEADERS, true);
  const userHist = histRows.filter(r => r.get('user_id') === userId);
  
  console.log('\nAll user history:');
  userHist.forEach(r => {
    console.log({
      treino_id: r.get('treino_id'),
      letra: r.get('letra'),
      duracao_seg: r.get('duracao_seg'),
      data: r.get('data')
    });
  });

  // 3. Filter by active treino_id
  const treinoId = activeTreino?.get('id');
  const filtered = userHist.filter(r => r.get('treino_id') === treinoId);
  console.log('\nFiltered by active treino_id:', filtered.length, 'rows');
}
run();
