require('dotenv').config();
const { getDoc } = require('./services/googleSheets');

async function testSolic() {
  try {
    const doc = await getDoc();
    const sheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'solicitacoes');
    if (sheet) {
      const rows = await sheet.getRows();
      console.log('Solicitacoes:', rows.map(r => ({ id: r.get('id'), tipo: r.get('tipo'), status: r.get('status') })));
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

testSolic();
