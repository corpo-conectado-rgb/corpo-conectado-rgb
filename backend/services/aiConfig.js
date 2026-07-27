const fetch = require('node-fetch') || global.fetch;

// Variável para armazenar o modelo descoberto em memória cache
let cachedBestModel = null;

// Ordem de preferência dos modelos. O sistema tentará usar o primeiro disponível.
const MODEL_PREFERENCES = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-1.0-pro',
  'gemini-pro'
];

/**
 * Consulta a API do Google Generative Language para descobrir os modelos
 * autorizados para a chave de API fornecida, e retorna o melhor modelo disponível
 * com base na lista de preferência.
 * 
 * @param {string} apiKey - Chave de API do Gemini
 * @returns {Promise<string>} - Nome do modelo escolhido (ex: 'gemini-1.5-flash')
 */
async function getBestAvailableModel(apiKey) {
  // Retorna do cache se já foi descoberto anteriormente
  if (cachedBestModel) {
    return cachedBestModel;
  }

  if (!apiKey) {
    throw new Error('API Key ausente. Não é possível descobrir modelos.');
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData?.error?.message || response.statusText;
      throw new Error(`Falha ao consultar modelos (HTTP ${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    const availableModels = data.models || [];
    
    // Filtramos os modelos para pegar apenas os que suportam 'generateContent'
    const generateContentModels = availableModels.filter(model => 
      model.supportedGenerationMethods && 
      model.supportedGenerationMethods.includes('generateContent')
    );

    // Extraímos apenas os nomes dos modelos, removendo o prefixo "models/" se existir
    const availableModelNames = generateContentModels.map(model => 
      model.name.replace('models/', '')
    );

    // Procuramos o primeiro modelo da nossa lista de preferência que esteja disponível
    let chosenModel = null;
    for (const pref of MODEL_PREFERENCES) {
      if (availableModelNames.includes(pref)) {
        chosenModel = pref;
        break;
      }
    }

    // Se nenhum modelo preferido for encontrado, usamos o primeiro disponível como fallback de emergência
    if (!chosenModel && availableModelNames.length > 0) {
      chosenModel = availableModelNames[0];
      console.warn(`[AI Config] Nenhum dos modelos preferidos foi encontrado. Usando fallback de emergência: ${chosenModel}`);
    } else if (!chosenModel) {
      throw new Error('Nenhum modelo compatível com generateContent foi encontrado para esta chave de API.');
    }

    console.log(`[AI Config] Modelo descoberto e configurado com sucesso: ${chosenModel}`);
    
    // Salvar no cache
    cachedBestModel = chosenModel;
    return cachedBestModel;

  } catch (error) {
    console.error('[AI Config] Erro ao autodescobrir modelos:', error.message);
    throw error;
  }
}

module.exports = {
  getBestAvailableModel
};
