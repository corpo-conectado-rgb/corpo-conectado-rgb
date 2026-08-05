const { getSheet, invalidateCache } = require('./googleSheets');

const USERS_SHEET = 'usuarios';
const HEADERS = ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role', 'trial_expira', 'ultimo_acesso'];

// Cache em memória que armazena a DATA DO DIA (ex: "04/08/2026") de cada usuário
// Isso garante NO MÁXIMO 1 gravação por dia na planilha do Google Sheets para o mesmo aluno
const userDayCache = new Map();

async function updateUltimoAcesso(userId) {
  if (!userId) return;

  // Obter a data atual no fuso horário oficial de São Paulo no formato DD/MM/AAAA
  const agoraDate = new Date();
  const hojeBr = agoraDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // Se já verificamos ou gravamos que este usuário está ativo hoje nesta instância, aborta instantaneamente (custo 0)
  if (userDayCache.get(userId) === hojeBr) {
    return;
  }

  try {
    const sheet = await getSheet(USERS_SHEET, HEADERS);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === userId);
    
    if (row) {
      const valorAtual = (row.get('ultimo_acesso') || '').trim();

      // Se a célula na planilha já constar a data de hoje, apenas abastece a RAM para proteger contra novas consultas hoje
      if (valorAtual.startsWith(hojeBr)) {
        userDayCache.set(userId, hojeBr);
        return;
      }

      // Se a data na planilha for antiga (ontem, há 3 dias, vazio), gravamos a nova data do dia
      row.set('ultimo_acesso', hojeBr);
      await row.save();
      
      userDayCache.set(userId, hojeBr);
      invalidateCache(USERS_SHEET);
    }
  } catch (e) {
    console.error('Erro silencioso no rastreador de acesso:', e);
  }
}

module.exports = {
  updateUltimoAcesso
};

