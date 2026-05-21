const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getCachedRows } = require('../services/googleSheets');

// Transforma o treino master, seus dias e exercicios no formato que o Frontend espera.
router.get('/my-sheet', authMiddleware, async (req, res) => {
  try {
    const treinosRows = await getCachedRows('treinos', []);
    const activeTreino = treinosRows.find(
      r => r.get('user_id') === req.user.id && (r.get('status') === 'ativo' || r.get('status') === 'ativa')
    );

    if (!activeTreino) {
      return res.json([]); // Se não tiver ficha montada, devolve um array vazio
    }

    const treinoId = activeTreino.get('id');
    const objetivo = activeTreino.get('objetivo');

    const diasRows = await getCachedRows('dias_treino', []);
    const diasParaTreino = diasRows.filter(r => r.get('treino_id') === treinoId);

    const exerciciosRows = await getCachedRows('exercicios', []);

    const fichasFrontend = diasParaTreino.map((dia, idx) => {
      const diaId = dia.get('id');
      const exsOfDia = exerciciosRows.filter(r => r.get('dia_treino_id') === diaId);

      return {
        id: diaId,
        letra: dia.get('letra_dia'),
        nome: dia.get('foco_muscular'),
        objetivo: objetivo || 'Hipertrofia',
        duracao: `${45 + (exsOfDia.length * 5)} min`, // Duração dinâmica
        ativa: idx === 0, // Inicia a Letra "A" como standard ativo na visualizacao
        grupoPrimario: dia.get('foco_muscular') ? dia.get('foco_muscular').split(',')[0] : 'Geral',
        exercicios: exsOfDia.map((ex, i) => ({
          id: ex.get('id') || i.toString(),
          nome: ex.get('nome'),
          series: Number(ex.get('series')) || 3,
          reps: ex.get('repeticoes') || '10-12',
          descanso: Number(ex.get('descanso')) || 60,
          grupomuscular: dia.get('foco_muscular') || 'Geral'
        }))
      };
    });

    res.json(fichasFrontend);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
