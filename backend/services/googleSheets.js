const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

// Ensure these exist in the environment variables
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

// Initialize the JWT auth client
// A variável GOOGLE_PRIVATE_KEY costuma ter os "\n" não formatados adequadamente via .env, 
// então garantimos que seja feito o replace
const jwtInfo = {
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  scopes: SCOPES
};

let doc;
let isInitialized = false;

/**
 * Initializes the Google Spreadsheet connection
 * Retorna o documento (Spreadsheet) global instanciado
 */
async function getDoc() {
  if (isInitialized && doc) return doc;

  if (!jwtInfo.email || !jwtInfo.key || !process.env.GOOGLE_SHEET_ID) {
    throw new Error("Credenciais do Google (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID) não configuradas no .env");
  }

  const jwt = new JWT(jwtInfo);
  doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);
  
  await doc.loadInfo(); // Loads document properties and worksheets
  isInitialized = true;
  return doc;
}

/**
 * Returns a specific worksheet by title
 * Cria a aba caso ela não exista.
 * @param {string} title - Title of the worksheet (e.g. 'usuarios')
 * @param {Array<string>} headers - Headers to initialize the sheet if not exist (e.g. ['id', 'nome'])
 */
async function getSheet(title, headers = []) {
  const document = await getDoc();
  
  // Find case-insensitive sheet
  let sheet = Object.values(document.sheetsByTitle).find(s => s.title.toLowerCase() === title.toLowerCase());

  if (!sheet) {
    if (headers.length > 0) {
      sheet = await document.addSheet({ title, headerValues: headers });
    } else {
      throw new Error(`Aba "${title}" não encontrada e sem cabeçalhos definidos para cria-la.`);
    }
  } else {
    // If sheet exists but might be manually created without headers, set them
    await sheet.loadHeaderRow().catch(async () => {
        // If it fails to load header row, it means the sheet is probably empty
        if (headers.length > 0) {
           await sheet.setHeaderRow(headers);
        }
    });
  }

  return sheet;
}

module.exports = {
  getDoc,
  getSheet
};
