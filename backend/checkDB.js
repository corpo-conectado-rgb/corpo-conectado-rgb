const { getCachedRows } = require('./services/googleSheets');
const HISTORICO_HEADERS = [
  'id', 'user_id', 'dia_treino_id', 'treino_id', 'letra',
  'nome_dia', 'data', 'hora_inicio', 'hora_fim', 'duracao_seg',
  'volume_total', 'exercicios_feitos', 'exercicios_total', 'detalhes'
];

async function run() {
  const rows = await getCachedRows('historico_treinos', HISTORICO_HEADERS, true);
  // User teste is the one with 'teste' in email or name? I'll just print the last 5 rows.
  const lastRows = rows.slice(-5).map(r => ({
    user_id: r.get('user_id'),
    data: r.get('data'),
    hora_inicio: r.get('hora_inicio')
  }));
  console.log("LAST ROWS:", lastRows);
}
run();
