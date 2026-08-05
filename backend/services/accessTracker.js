const { getCachedRows, invalidateCache } = require('./googleSheets');

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

  // Marca IMEDIATAMENTE no cache da memória ANTES da chamada assíncrona para blindar contra concorrência se o frontend fizer 5 chamadas em paralelo!
  userDayCache.set(userId, hojeBr);

  try {
    const rows = await getCachedRows(USERS_SHEET, HEADERS);
    const row = rows.find(r => r.get('id') === userId);
    
    if (row) {
      const valorAtual = (row.get('ultimo_acesso') || '').trim();

      // Se a célula na planilha já constar a data de hoje, já está salvo
      if (valorAtual.startsWith(hojeBr)) {
        return;
      }

      // Se a data na planilha for antiga (ontem, há 3 dias, vazio), gravamos a nova data do dia
      row.set('ultimo_acesso', hojeBr);
      await row.save();
      
      invalidateCache(USERS_SHEET);
    }
  } catch (e) {
    console.error('Erro silencioso no rastreador de acesso:', e);
    // Se falhar de fato à rede, remove do cache para poder tentar na próxima requisição
    userDayCache.delete(userId);
  }
}

module.exports = {
  updateUltimoAcesso
};

