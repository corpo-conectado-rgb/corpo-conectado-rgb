const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { getCachedRows } = require('../services/googleSheets');

// Headers das abas do Google Sheets
const HISTORICO_HEADERS = [
  'id', 'user_id', 'treino_id', 'dia_treino_id', 'letra', 'nome_dia',
  'data', 'hora_inicio', 'hora_fim', 'duracao_seg', 'volume_total',
  'exercicios_feitos', 'exercicios_total', 'detalhes'
];
const ANAMNESE_HEADERS = [
  'id_usuario', 'idade', 'altura', 'peso', 'sexo', 'objetivo',
  'nivel_fisico', 'lesoes_criticas', 'habitos_freq', 'habitos_tempo', 'habitos_local'
];

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

/**
 * Consolida TODOS os dados disponíveis sobre um aluno num único bloco de contexto.
 */
async function buildStudentContext(userId) {
  const ctx = {};

  // 1. Anamnese
  try {
    const anamneseRows = await getCachedRows('anamnese', ANAMNESE_HEADERS);
    const row = anamneseRows.find(r => r.get('id_usuario') === userId);
    if (row) {
      ctx.anamnese = {
        idade: row.get('idade'),
        altura: row.get('altura'),
        peso: row.get('peso'),
        sexo: row.get('sexo'),
        objetivo: row.get('objetivo'),
        nivel_fisico: row.get('nivel_fisico'),
        lesoes_criticas: row.get('lesoes_criticas'),
        habitos_freq: row.get('habitos_freq'),
        habitos_tempo: row.get('habitos_tempo'),
        habitos_local: row.get('habitos_local'),
      };
      // Calcular IMC
      if (ctx.anamnese.peso && ctx.anamnese.altura) {
        const peso = parseFloat(ctx.anamnese.peso);
        const altura = parseFloat(ctx.anamnese.altura);
        if (altura > 0) {
          ctx.anamnese.imc = (peso / (altura * altura)).toFixed(1);
        }
      }
    }
  } catch (e) { /* falha silenciosa */ }

  // 2. Ficha Ativa
  try {
    const treinosRows = await getCachedRows('treinos', []);
    const activeTreino = treinosRows.find(
      r => r.get('user_id') === userId && (r.get('status') === 'ativo' || r.get('status') === 'ativa')
    );

    if (activeTreino) {
      const treinoId = activeTreino.get('id');
      const diasRows = await getCachedRows('dias_treino', []);
      const diasParaTreino = diasRows.filter(r => r.get('treino_id') === treinoId);
      const exerciciosRows = await getCachedRows('exercicios', []);

      ctx.ficha_ativa = {
        nome_ficha: activeTreino.get('nome_ficha'),
        tipo_divisao: activeTreino.get('tipo_divisao'),
        objetivo: activeTreino.get('objetivo'),
        duracao_dias: activeTreino.get('duracao_dias'),
        data_termino: activeTreino.get('data_termino'),
        dias: diasParaTreino.map(dia => {
          const diaId = dia.get('id');
          const exs = exerciciosRows.filter(r => r.get('dia_treino_id') === diaId);
          return {
            letra: dia.get('letra_dia'),
            foco_muscular: dia.get('foco_muscular'),
            exercicios: exs.map(ex => ({
              nome: ex.get('nome'),
              series: ex.get('series'),
              repeticoes: ex.get('repeticoes'),
              descanso: ex.get('descanso'),
              observacoes: ex.get('observacoes')
            }))
          };
        })
      };
    }
  } catch (e) { /* falha silenciosa */ }

  // 3. Histórico de Treinos (últimos 30)
  try {
    const histRows = await getCachedRows('historico_treinos', HISTORICO_HEADERS);
    const userHist = histRows
      .filter(r => r.get('user_id') === userId)
      .map(r => ({
        letra: r.get('letra'),
        nome_dia: r.get('nome_dia'),
        data: r.get('data'),
        duracao_min: Math.round((Number(r.get('duracao_seg')) || 0) / 60),
        volume_total: Number(r.get('volume_total')) || 0,
        exercicios_feitos: Number(r.get('exercicios_feitos')) || 0,
        exercicios_total: Number(r.get('exercicios_total')) || 0,
      }))
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 30);

    ctx.historico = userHist;

    // Estatísticas computadas
    if (userHist.length > 0) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const seteDias = new Date(hoje); seteDias.setDate(seteDias.getDate() - 7);
      const trintaDias = new Date(hoje); trintaDias.setDate(trintaDias.getDate() - 30);

      const ult7 = userHist.filter(s => new Date(s.data) >= seteDias);
      const ult30 = userHist.filter(s => new Date(s.data) >= trintaDias);

      ctx.stats = {
        treinos_ultimos_7_dias: ult7.length,
        treinos_ultimos_30_dias: ult30.length,
        volume_semanal_kg: ult7.reduce((s, h) => s + h.volume_total, 0),
        volume_mensal_kg: ult30.reduce((s, h) => s + h.volume_total, 0),
        tempo_medio_min: ult30.length > 0
          ? Math.round(ult30.reduce((s, h) => s + h.duracao_min, 0) / ult30.length)
          : 0,
        ultimo_treino: userHist[0]
          ? `${userHist[0].letra} (${userHist[0].nome_dia}) em ${userHist[0].data}`
          : 'Nenhum'
      };
    }
  } catch (e) { /* falha silenciosa */ }

  // 4. Últimas cargas registradas (para progressão)
  try {
    const histRows = await getCachedRows('historico_treinos', HISTORICO_HEADERS);
    const userHist = histRows
      .filter(r => r.get('user_id') === userId && r.get('detalhes'))
      .sort((a, b) => new Date(b.get('data')) - new Date(a.get('data')))
      .slice(0, 5); // Últimas 5 sessões

    const cargasRecentes = [];
    for (const sessao of userHist) {
      try {
        const detalhes = JSON.parse(sessao.get('detalhes'));
        if (detalhes && detalhes.length > 0) {
          cargasRecentes.push({
            letra: sessao.get('letra'),
            data: sessao.get('data'),
            exercicios: detalhes.map(ex => ({
              nome: ex.nome || ex.exercicio_id,
              series: (ex.series || []).map(s => ({
                carga: s.carga,
                reps: s.reps,
                concluida: s.concluida
              }))
            }))
          });
        }
      } catch (e) { /* JSON inválido, ignora */ }
    }

    if (cargasRecentes.length > 0) {
      ctx.cargas_recentes = cargasRecentes;
    }
  } catch (e) { /* falha silenciosa */ }

  return ctx;
}

// ============================================
// POST /api/ai/chat — Assistente IA Conversacional
// ============================================
router.post('/chat', adminMiddleware, async (req, res) => {
  try {
    const { user_id, messages } = req.body;

    if (!user_id || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Campos user_id e messages[] são obrigatórios.' });
    }

    // Buscar nome do aluno
    let nomeAluno = 'Aluno';
    try {
      const usuarios = await getCachedRows('usuarios', []);
      const userRow = usuarios.find(r => r.get('id') === user_id);
      if (userRow) nomeAluno = userRow.get('nome');
    } catch (e) { /* */ }

    // Consolidar contexto completo do aluno
    const ctx = await buildStudentContext(user_id);

    // System Instruction rica com todo o contexto
    const systemInstruction = `Você é o **Copiloto Inteligente** do sistema Corpo Conectado — um assistente de Educação Física com raciocínio clínico avançado.

Você está assessorando um Personal Trainer que está analisando ou montando a ficha de treino de um aluno chamado **${nomeAluno}**.

## Seu Papel
- Você é um CONSULTOR TÉCNICO, não um gerador automático.
- Analise dados, fundamente recomendações, alerte sobre riscos.
- Seja direto, objetivo e profissional.
- Use terminologia da musculação quando apropriado.
- Responda SEMPRE em Português Brasileiro.

## Dados Completos do Aluno
${JSON.stringify(ctx, null, 2)}

## Capacidades Especiais
Quando o professor pedir para GERAR exercícios ou uma ficha, você DEVE retornar um bloco JSON especial DENTRO da sua resposta, delimitado por marcadores %%ACAO_INICIO%% e %%ACAO_FIM%%. O JSON deve seguir este formato:

%%ACAO_INICIO%%
{
  "tipo": "gerar_exercicios",
  "dias": [
    {
      "letra_dia": "A",
      "foco_muscular": "Peito, Tríceps",
      "exercicios": [
        { "nome": "Supino Reto com Barra", "series": 4, "repeticoes": "8-12", "descanso": 90, "observacoes": "" }
      ]
    }
  ]
}
%%ACAO_FIM%%

Inclua este bloco JSON APENAS quando o professor explicitamente pedir para gerar ou montar exercícios/fichas. Nas demais conversas (análises, dúvidas, recomendações), responda apenas em texto.

## Regras Críticas
1. SEMPRE considere as lesões do aluno. Nunca sugira exercícios que possam agravar condições ortopédicas relatadas.
2. Adapte o volume e intensidade ao nível físico (Iniciante = volume baixo, mais máquinas).
3. Quando analisar progressão, use os dados de cargas_recentes para fundamentar.
4. Seja honesto: se não há dados suficientes para uma análise, diga isso.
5. Formate suas respostas com clareza (use negrito, listas, emojis moderados).`;

    if (!process.env.GEMINI_API_KEY) {
      // Mock para desenvolvimento
      return res.json({
        response: `Olá! Sou o Copiloto Inteligente do Corpo Conectado. 🧠\n\nEstou analisando o perfil de **${nomeAluno}**.\n\n⚠️ *Modo de demonstração ativo — configure a GEMINI_API_KEY para ativar a IA real.*\n\nDados que tenho acesso:\n- **Anamnese**: ${ctx.anamnese ? '✅ Disponível' : '❌ Não encontrada'}\n- **Ficha Ativa**: ${ctx.ficha_ativa ? '✅ ' + ctx.ficha_ativa.nome_ficha : '❌ Sem ficha'}\n- **Histórico**: ${ctx.historico ? ctx.historico.length + ' sessões' : '❌ Sem histórico'}\n- **Cargas**: ${ctx.cargas_recentes ? '✅ ' + ctx.cargas_recentes.length + ' sessões com dados' : '❌ Sem dados de carga'}`,
        action: null
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction
    });

    // Converter mensagens para o formato do Gemini (multi-turn)
    const geminiHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(lastMessage.content);
    let responseText = result.response.text();

    // Extrair ação se houver (bloco JSON delimitado)
    let action = null;
    const acaoMatch = responseText.match(/%%ACAO_INICIO%%([\s\S]*?)%%ACAO_FIM%%/);
    if (acaoMatch) {
      try {
        action = JSON.parse(acaoMatch[1].trim());
        // Limpar os marcadores da resposta visível
        responseText = responseText
          .replace(/%%ACAO_INICIO%%[\s\S]*?%%ACAO_FIM%%/, '')
          .trim();
      } catch (e) {
        console.error("Erro ao parsear ação da IA:", e);
      }
    }

    res.json({
      response: responseText,
      action: action
    });

  } catch (error) {
    console.error("Erro no Assistente IA:", error);
    res.status(500).json({ error: 'Falha na comunicação com o Assistente Inteligente.' });
  }
});

module.exports = router;
