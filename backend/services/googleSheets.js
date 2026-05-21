const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

// Ensure these exist in the environment variables
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

// Initialize the JWT auth client
const jwtInfo = {
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  scopes: SCOPES
};

let doc;
let isInitialized = false;

// ============================================
// CACHE EM MEMÓRIA
// Reduz drasticamente as chamadas à API do Google Sheets
// evitando o erro 429 (Quota exceeded)
// ============================================
const CACHE_TTL_MS = 30000; // 30 segundos de cache
const rowsCache = new Map(); // Map<sheetTitle, { data, timestamp }>
const sheetCache = new Map(); // Map<sheetTitle, sheet>

/**
 * Initializes the Google Spreadsheet connection
 */
async function getDoc() {
  if (isInitialized && doc) return doc;

  if (!jwtInfo.email || !jwtInfo.key || !process.env.GOOGLE_SHEET_ID) {
    throw new Error("Credenciais do Google (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID) não configuradas no .env");
  }

  const jwt = new JWT(jwtInfo);
  doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);
  
  await doc.loadInfo();
  isInitialized = true;
  return doc;
}

/**
 * Returns a specific worksheet by title
 * Cria a aba caso ela não exista.
 */
async function getSheet(title, headers = []) {
  // Verifica cache de sheet
  if (sheetCache.has(title.toLowerCase())) {
    return sheetCache.get(title.toLowerCase());
  }

  const document = await getDoc();
  
  let sheet = Object.values(document.sheetsByTitle).find(s => s.title.toLowerCase() === title.toLowerCase());

  if (!sheet) {
    if (headers.length > 0) {
      sheet = await document.addSheet({ title, headerValues: headers });
    } else {
      throw new Error(`Aba "${title}" não encontrada e sem cabeçalhos definidos para cria-la.`);
    }
  } else {
    await sheet.loadHeaderRow().catch(async () => {
        if (headers.length > 0) {
           await sheet.setHeaderRow(headers);
        }
    });
  }

  // Cacheia o objeto sheet
  sheetCache.set(title.toLowerCase(), sheet);
  return sheet;
}

/**
 * Busca as linhas de uma aba COM CACHE.
 * Se os dados foram buscados há menos de CACHE_TTL_MS, retorna do cache.
 * @param {string} title - Nome da aba
 * @param {Array<string>} headers - Headers para criar a aba se não existir
 * @returns {Array} rows
 */
async function getCachedRows(title, headers = []) {
  const key = title.toLowerCase();
  const cached = rowsCache.get(key);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  const sheet = await getSheet(title, headers);
  const rows = await sheet.getRows();
  
  rowsCache.set(key, { data: rows, timestamp: Date.now() });
  return rows;
}

/**
 * Invalida o cache de uma aba específica.
 * Deve ser chamado após operações de escrita (addRow, save, delete).
 */
function invalidateCache(title) {
  if (title) {
    rowsCache.delete(title.toLowerCase());
  } else {
    // Invalida tudo
    rowsCache.clear();
  }
}

module.exports = {
  getDoc,
  getSheet,
  getCachedRows,
  invalidateCache
};
