const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/ai/suggest-workout
router.post('/suggest-workout', async (req, res) => {
  try {
    const { aluno, focos, nomeFicha, tipoDivisao, objetivo } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Retorno Mockado caso não tenha a chave ainda (Para não travar o desenvolvimento)
      console.warn("GEMINI_API_KEY não encontrada no .env. Retornando dados mockados do Copiloto.");
      
      // Delay artificial
      await new Promise(r => setTimeout(r, 2000));
      
      return res.json({
        exercicios: [
          { nome: 'Supino Reto (Mock AI)', series: 3, repeticoes: '10-12', descanso: 60, observacoes: 'Sugerido pela IA' },
          { nome: 'Crucifixo Máquina (Mock AI)', series: 3, repeticoes: '12-15', descanso: 45, observacoes: 'Foco em estabilidade' },
          { nome: 'Desenvolvimento (Mock AI)', series: 3, repeticoes: '12', descanso: 60, observacoes: '' },
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Você é um Especialista em Educação Física (Copiloto Inteligente Corpo Conectado).
Sua missão é sugerir exercícios para UM ÚNICO DIA de treino com base nas características do aluno.

Perfil do Aluno:
- Objetivo Geral: ${objetivo || aluno.objetivo || 'Não informado'}
- Nível Físico: ${aluno.nivel_fisico || 'Não informado'}
- Frequência Semanal: ${aluno.habitos_freq || 'Não informado'}
- Idade: ${aluno.idade || 'Não informada'}
- Peso: ${aluno.peso ? aluno.peso + 'kg' : 'Não informado'}
- Lesões/Restrições: ${aluno.lesoes_criticas || 'Nenhuma restrição relatada'}

Configuração do Treino Atual:
- Nome da Ficha: ${nomeFicha}
- Tipo de Divisão: ${tipoDivisao}
- FOCOS MUSCULARES SELECIONADOS PARA ESTE DIA: ${focos.join(', ')}

Regras Críticas:
1. Respeite as lesões. Adapte os exercícios para preservar articulações relatadas com problema.
2. Seja coerente com o nível físico (Iniciante = mais máquinas/segurança).
3. Retorne EXATAMENTE um JSON válido, sem formatação markdown ou crases (\`\`\`).
4. Retorne APENAS um array de objetos JSON chamado "exercicios", onde cada objeto tem:
   - "nome" (string)
   - "series" (numero)
   - "repeticoes" (string, ex: "10-12")
   - "descanso" (numero em segundos, ex: 60)
   - "observacoes" (string curta com técnica ou cuidado, ex: "Amplitude máxima", ou "")

Exemplo de Saída Esperada:
{
  "exercicios": [
    {
      "nome": "Supino Inclinado com Halteres",
      "series": 4,
      "repeticoes": "10-12",
      "descanso": 60,
      "observacoes": "Controle na descida"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Limpar formatação markdown (```json ... ```) se houver
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    res.json(parsed);

  } catch (error) {
    console.error("Erro na rota de IA:", error);
    res.status(500).json({ error: 'Falha ao gerar treino com Inteligência Artificial.' });
  }
});

module.exports = router;
