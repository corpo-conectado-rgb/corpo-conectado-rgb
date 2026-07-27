const { GoogleGenAI } = require('@google/genai');
const fetch = require('node-fetch') || global.fetch;

// Variáveis em memória
let cachedBestModel = null;
let aiClientInstance = null;

// Ordem de preferência (atualizado para os novos padrões da Google AI)
const MODEL_PREFERENCES = [
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
  'gemini-pro'
];

/**
 * Retorna a instância do cliente da nova API @google/genai.
 * Garante que a chave de API seja carregada.
 */
function getClient() {
  if (!aiClientInstance) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY ausente nas variáveis de ambiente.");
    }
    aiClientInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClientInstance;
}

/**
 * Consulta a API do Google Generative Language para descobrir os modelos
 * autorizados para a chave de API fornecida e retorna o melhor modelo disponível.
 */
async function getBestAvailableModel(apiKey) {
  if (cachedBestModel) return cachedBestModel;
  if (!apiKey) throw new Error('API Key ausente.');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData?.error?.message || response.statusText;
      throw new Error(`Falha ao consultar modelos (HTTP ${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    const availableModels = data.models || [];
    
    const generateContentModels = availableModels.filter(model => 
      model.supportedGenerationMethods && 
      model.supportedGenerationMethods.includes('generateContent')
    );

    const availableModelNames = generateContentModels.map(model => 
      model.name.replace('models/', '')
    );

    let chosenModel = null;
    for (const pref of MODEL_PREFERENCES) {
      if (availableModelNames.includes(pref)) {
        chosenModel = pref;
        break;
      }
    }

    if (!chosenModel && availableModelNames.length > 0) {
      chosenModel = availableModelNames[0];
      console.warn(`[AI Config] Fallback de emergência: ${chosenModel}`);
    } else if (!chosenModel) {
      throw new Error('Nenhum modelo compatível encontrado.');
    }

    console.log(`[AI Config] Modelo autodescoberto: ${chosenModel}`);
    cachedBestModel = chosenModel;
    return cachedBestModel;

  } catch (error) {
    console.error('[AI Config] Erro na autodescoberta:', error.message);
    throw error;
  }
}

module.exports = {
  getClient,
  getBestAvailableModel
};
