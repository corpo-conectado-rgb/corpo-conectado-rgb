const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middlewares/authMiddleware');
const { getCachedRows, getSheet, invalidateCache } = require('../services/googleSheets');

const SOLICITACOES_HEADERS = [
  'id', 'aluno_id', 'aluno_nome', 'tipo', 'mensagem', 'status', 'data_criacao', 'data_resolucao'
];

// POST / - Aluno cria uma nova solicitação
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tipo, mensagem, aluno_nome } = req.body;
    
    if (!tipo || !mensagem) {
      return res.status(400).json({ error: 'Tipo e mensagem são obrigatórios.' });
    }

    const aluno_id = req.user.id;

    const sheet = await getSheet('solicitacoes', SOLICITACOES_HEADERS);
    
    const novaSolicitacao = {
      id: uuidv4(),
      aluno_id,
      aluno_nome: aluno_nome || req.user.nome || 'Aluno(a)',
      tipo,
      mensagem,
      status: 'PENDENTE',
      data_criacao: new Date().toISOString(),
      data_resolucao: ''
    };

    await sheet.addRow(novaSolicitacao);
    invalidateCache('solicitacoes');

    res.status(201).json({ message: 'Solicitação criada com sucesso.', solicitacao: novaSolicitacao });
  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    res.status(500).json({ error: 'Erro ao criar solicitação.' });
  }
});

// GET /admin - Admin lista as solicitações
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const rows = await getCachedRows('solicitacoes', SOLICITACOES_HEADERS);
    
    const solicitacoes = rows.map(row => ({
      id: row.get('id'),
      aluno_id: row.get('aluno_id'),
      aluno_nome: row.get('aluno_nome'),
      tipo: row.get('tipo'),
      mensagem: row.get('mensagem'),
      status: row.get('status'),
      data_criacao: row.get('data_criacao'),
      data_resolucao: row.get('data_resolucao')
    }));

    // Ordenar por data de criação desc (mais recentes primeiro)
    solicitacoes.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));

    res.json(solicitacoes);
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ error: 'Erro ao listar solicitações.' });
  }
});

// PUT /admin/:id/resolver - Admin resolve a solicitação
router.put('/admin/:id/resolver', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const solicitacaoId = req.params.id;
    const sheet = await getSheet('solicitacoes', SOLICITACOES_HEADERS);
    const rows = await sheet.getRows();
    
    const row = rows.find(r => r.get('id') === solicitacaoId);
    
    if (!row) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    row.set('status', 'RESOLVIDA');
    row.set('data_resolucao', new Date().toISOString());
    await row.save();
    
    invalidateCache('solicitacoes');

    res.json({ message: 'Solicitação resolvida com sucesso.' });
  } catch (error) {
    console.error('Erro ao resolver solicitação:', error);
    res.status(500).json({ error: 'Erro ao resolver solicitação.' });
  }
});

module.exports = router;
