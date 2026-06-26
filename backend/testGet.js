require('dotenv').config();
const { getDoc } = require('./services/googleSheets');

async function testGetProfile() {
  const emailToTest = 'teste@gmail.com';
  try {
    const doc = await getDoc();
    const userSheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'usuarios');
    const userRows = await userSheet.getRows();
    const userRow = userRows.find(r => r.get('email').toLowerCase() === emailToTest);
    
    if (!userRow) return;
    const userId = userRow.get('id');
    
    const anamneseSheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'anamnese');
    const anamneseRows = await anamneseSheet.getRows();
    const anamneseRow = anamneseRows.find(r => r.get('id_usuario') === userId);
    
    console.log('Anamnese Row:', anamneseRow._rawData);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

testGetProfile();
