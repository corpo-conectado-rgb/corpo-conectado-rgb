require('dotenv').config({ path: './.env' });
const { getCachedRows } = require('./services/googleSheets.js');
async function test() {
  const users = await getCachedRows('usuarios', []);
  const geovana = users.find(u => u.get('nome').includes('Geovana Latalisa'));
  if (geovana) {
    console.log('Geovana trial_expira:', geovana.get('trial_expira'));
    console.log('Geovana email:', geovana.get('email'));
    console.log('Geovana data_criacao:', geovana.get('data_criacao'));
  } else {
    console.log('Not found');
  }
}
test();
