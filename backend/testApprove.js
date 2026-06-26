require('dotenv').config();
const { getDoc, getSheet } = require('./services/googleSheets');

async function testApprove() {
  try {
    const doc = await getDoc();
    const sheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'solicitacoes');
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === '7fb3ebaf-dca9-4663-b8d4-ce13b613bae5'); // the approved one
    
    if (!row) return console.log('not found');
    
    const mensagemJSON = JSON.parse(row.get('mensagem'));
    const alteracoes = mensagemJSON.alteracoes || [];
    const alunoId = row.get('aluno_id');
    console.log('Aluno ID:', alunoId);
    console.log('Alteracoes:', alteracoes);

    const ANAMNESE_HEADERS = ['id_usuario', 'idade', 'altura', 'peso', 'sexo', 'objetivo', 'nivel_fisico', 'lesoes_criticas', 'habitos_freq', 'habitos_tempo', 'habitos_local', 'data_nascimento', 'telefone'];
    const anamneseSheet = await getSheet('anamnese', ANAMNESE_HEADERS);
    const anamneseRows = await anamneseSheet.getRows();
    const anamneseRow = anamneseRows.find(r => r.get('id_usuario') === alunoId);
    console.log('Found anamneseRow?', !!anamneseRow);

    const camposAnamnese = ['peso', 'altura', 'objetivo', 'nivel_fisico', 'habitos_freq', 'lesoes_criticas', 'telefone', 'habitos_local', 'habitos_tempo'];

    for (const alt of alteracoes) {
      if (camposAnamnese.includes(alt.campo) && anamneseRow) {
        console.log(`Setting ${alt.campo} to ${alt.para}`);
        anamneseRow.set(alt.campo, alt.para);
      }
    }

    if (anamneseRow) {
      console.log('Saving...');
      await anamneseRow.save();
      console.log('Saved successfully');
    }
  } catch (err) {
    console.error('Error occurred:', err);
  }
  process.exit(0);
}

testApprove();
