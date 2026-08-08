const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getCachedRows, getSheet, invalidateCache } = require('../services/googleSheets');

// GET: Retorna o catálogo central de exercícios
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rows = await getCachedRows('catalogo_exercicios');
    const catalog = rows.map(r => ({
      codigo: r.get('codigo'),
      nome: r.get('nome'),
      link_video: r.get('link_video') || ''
    }));
    // Sort by code
    catalog.sort((a, b) => parseInt(a.codigo) - parseInt(b.codigo));
    res.json(catalog);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar catálogo: ' + error.message });
  }
});

// POST: Cria um novo exercício no catálogo (se o nome não existir)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nome, link_video } = req.body;
    
    if (!nome || typeof nome !== 'string') {
      return res.status(400).json({ error: 'Nome do exercício é obrigatório.' });
    }
    
    const cleanName = nome.trim();
    
    const sheet = await getSheet('catalogo_exercicios', ['codigo', 'nome', 'link_video']);
    const rows = await getCachedRows('catalogo_exercicios');
    
    // Verifica duplicidade por nome (case insensitive)
    const exists = rows.find(r => r.get('nome').trim().toLowerCase() === cleanName.toLowerCase());
    
    if (exists) {
      return res.status(409).json({ 
        error: 'Este exercício já está cadastrado. Utilize o exercício existente para evitar duplicidade.' 
      });
    }
    
    let nextCode = 1;
    if (rows.length > 0) {
      nextCode = Math.max(...rows.map(r => parseInt(r.get('codigo') || 0))) + 1;
    }
    
    await sheet.addRow({
      codigo: String(nextCode),
      nome: cleanName,
      link_video: link_video || ''
    });
    
    invalidateCache('catalogo_exercicios');
    
    res.status(201).json({
      message: 'Exercício cadastrado com sucesso!',
      exercicio: { codigo: String(nextCode), nome: cleanName, link_video: link_video || '' }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar exercício: ' + error.message });
  }
});

// PUT: Atualiza um exercício existente (geralmente o link_video ou o nome)
router.put('/:codigo', authMiddleware, async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nome, link_video } = req.body;
    
    const rows = await getCachedRows('catalogo_exercicios');
    const exRow = rows.find(r => r.get('codigo') === codigo);
    
    if (!exRow) {
      return res.status(404).json({ error: 'Exercício não encontrado no catálogo.' });
    }
    
    if (nome) {
      // Verifica se o novo nome já existe em OUTRO exercício
      const exists = rows.find(r => 
        r.get('codigo') !== codigo && 
        r.get('nome').trim().toLowerCase() === nome.trim().toLowerCase()
      );
      
      if (exists) {
        return res.status(409).json({ 
          error: 'Já existe outro exercício cadastrado com esse nome.' 
        });
      }
      exRow.set('nome', nome.trim());
    }
    
    if (link_video !== undefined) {
      exRow.set('link_video', link_video);
    }
    
    await exRow.save();
    invalidateCache('catalogo_exercicios');
    
    res.json({
      message: 'Exercício atualizado com sucesso!',
      exercicio: {
        codigo,
        nome: exRow.get('nome'),
        link_video: exRow.get('link_video')
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar exercício: ' + error.message });
  }
});

module.exports = router;
