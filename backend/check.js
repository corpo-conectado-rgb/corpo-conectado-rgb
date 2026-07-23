const { getSheet } = require('./services/googleSheets.js');

async function run() {
  const usersSheet = await getSheet('usuarios', ['id', 'nome']);
  const uRows = await usersSheet.getRows();
  const validUsers = uRows.map(r => ({ id: r.get('id'), nome: r.get('nome') }));
  console.log('Valid Users:', validUsers.map(u => u.nome).join(', '));
  
  const mSheet = await getSheet('mensalidades', ['id', 'user_id', 'status', 'valor']);
  const mRows = await mSheet.getRows();
  console.log('\nMensalidades:');
  mRows.forEach(r => {
    const u = validUsers.find(v => v.id === r.get('user_id'));
    console.log('- ' + (u ? u.nome : 'ORPHAN') + ' | ' + r.get('status') + ' | R$ ' + r.get('valor'));
  });
  
  const aSheet = await getSheet('assinaturas', ['id', 'user_id', 'status']);
  const aRows = await aSheet.getRows();
  console.log('\nAssinaturas:');
  aRows.forEach(r => {
    const u = validUsers.find(v => v.id === r.get('user_id'));
    console.log('- ' + (u ? u.nome : 'ORPHAN') + ' | ' + r.get('status'));
  });
}
run();
