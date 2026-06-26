require('dotenv').config();
const { getDoc } = require('./services/googleSheets');

async function check() {
  try {
    const doc = await getDoc();
    const sheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'anamnese');
    if (sheet) {
      await sheet.loadHeaderRow();
      console.log('Headers atuais da anamnese:', sheet.headerValues);
      
      const rows = await sheet.getRows();
      console.log('Primeira row:', rows[0]?.toRawObject());
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
