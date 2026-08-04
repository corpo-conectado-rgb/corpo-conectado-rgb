const { getSheet, invalidateCache } = require('./googleSheets');

const USERS_SHEET = 'usuarios';
const HEADERS = ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role', 'trial_expira', 'ultimo_acesso'];

// Cache em memória para evitar escritas excessivas no Google Sheets durante navegação ativa
const inMemoryThrottle = new Map();
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutos de precisão

async function updateUltimoAcesso(userId) {
  if (!userId) return;

  const agora = Date.now();
  const ultimaChamadaMemoria = inMemoryThrottle.get(userId);
  if (ultimaChamadaMemoria && (agora - ultimaChamadaMemoria) < THROTTLE_MS) {
    return; // Já registrado nos últimos 5 minutos nesta instância
  }
  inMemoryThrottle.set(userId, agora);

  try {
    const sheet = await getSheet(USERS_SHEET, HEADERS);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === userId);
    if (row) {
      const agoraDate = new Date();
      const agoraFormatado = agoraDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const valorAtual = (row.get('ultimo_acesso') || '').trim();
      
      if (valorAtual !== agoraFormatado) {
        row.set('ultimo_acesso', agoraFormatado);
        await row.save();
        invalidateCache(USERS_SHEET);
      }
    }
  } catch (e) {
    // Em caso de erro na gravação, remove da memória para permitir nova tentativa imediatamente
    inMemoryThrottle.delete(userId);
    console.error('Erro ao atualizar ultimo_acesso no tracker:', e);
  }
}

module.exports = {
  updateUltimoAcesso
};
