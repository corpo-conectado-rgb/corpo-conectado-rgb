const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const messages = [
      { role: 'user', content: 'Analise o perfil' }
    ];

    let geminiHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
      geminiHistory.shift();
    }

    const lastMessage = messages[messages.length - 1];
    
    console.log("History:", geminiHistory);
    console.log("Last Message:", lastMessage);

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(lastMessage.content);
    console.log(result.response.text());
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
