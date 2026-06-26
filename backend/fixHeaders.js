require('dotenv').config();
const { getDoc } = require('./services/googleSheets');

const ANAMNESE_HEADERS = ['id_usuario', 'idade', 'altura', 'peso', 'sexo', 'objetivo', 'nivel_fisico', 'lesoes_criticas', 'habitos_freq', 'habitos_tempo', 'habitos_local', 'data_nascimento', 'telefone'];

async function fix() {
  try {
    const doc = await getDoc();
    const sheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'anamnese');
    if (sheet) {
      console.log('Atualizando headers da aba anamnese...');
      await sheet.setHeaderRow(ANAMNESE_HEADERS);
      console.log('Sucesso!');
    } else {
      console.log('Aba anamnese nao encontrada.');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

fix();
