require('dotenv').config();
const { getDoc } = require('./services/googleSheets');

async function testPutProfile() {
  const emailToTest = 'teste@gmail.com';
  try {
    const doc = await getDoc();
    
    // find user
    const userSheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'usuarios');
    const userRows = await userSheet.getRows();
    const userRow = userRows.find(r => r.get('email').toLowerCase() === emailToTest);
    
    if (!userRow) {
      console.log('User not found');
      return;
    }
    
    const userId = userRow.get('id');
    console.log('User ID:', userId);
    
    const anamneseSheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'anamnese');
    const anamneseRows = await anamneseSheet.getRows();
    const anamneseRow = anamneseRows.find(r => r.get('id_usuario') === userId);
    
    if (!anamneseRow) {
      console.log('Anamnese not found');
      return;
    }
    
    console.log('Current telefone:', anamneseRow.get('telefone'));
    
    console.log('Setting telefone to 123456789...');
    anamneseRow.set('telefone', '123456789');
    await anamneseRow.save();
    
    console.log('Saved! Re-fetching to check...');
    const reFetchedRows = await anamneseSheet.getRows();
    const reFetchedRow = reFetchedRows.find(r => r.get('id_usuario') === userId);
    console.log('New telefone:', reFetchedRow.get('telefone'));

  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

testPutProfile();
