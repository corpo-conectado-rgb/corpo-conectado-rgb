const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const chat = model.startChat({
      history: [
        { role: 'model', parts: [{ text: 'Hello' }] }
      ]
    });
    const result = await chat.sendMessage('How are you?');
    console.log(result.response.text());
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
