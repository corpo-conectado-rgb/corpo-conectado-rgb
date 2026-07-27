const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const messages = [
      { role: 'user', content: 'Analise o perfil' }
    ];

    let contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents
    });

    console.log(response.text);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
