const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getSheet } = require('../services/googleSheets');

// Endpoint opcional para listar catálogo se o usuário desejar gerenciar através de outra aba "catalogo_exercicios"
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Para simplificar, poderíamos buscar de uma aba fixa de catálogo
    res.json({ message: 'A API de catálogo de exercícios pode ser conectada a uma aba separada se desejar.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
