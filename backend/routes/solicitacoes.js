const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middlewares/authMiddleware');
const { getCachedRows, getSheet, invalidateCache } = require('../services/googleSheets');

const SOLICITACOES_HEADERS = [
  'id', 'aluno_id', 'aluno_nome', 'tipo', 'mensagem', 'status', 'data_criacao', 'data_resolucao', 'observacao_admin'
];

// POST / - Aluno cria uma nova solicitação
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tipo, mensagem, aluno_nome } = req.body;
    
    if (!tipo || !mensagem) {
      return res.status(400).json({ error: 'Tipo e mensagem são obrigatórios.' });
    }

    const aluno_id = req.user.id;

    // Buscar nome do aluno na planilha de usuários (JWT não contém nome)
    let nomeAluno = aluno_nome;
    if (!nomeAluno) {
      try {
        const usuariosRows = await getCachedRows('usuarios', ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role']);
        const alunoRow = usuariosRows.find(r => r.get('id') === aluno_id);
        nomeAluno = alunoRow ? alunoRow.get('nome') : 'Aluno(a)';
      } catch {
        nomeAluno = 'Aluno(a)';
      }
    }

    const sheet = await getSheet('solicitacoes', SOLICITACOES_HEADERS);
    
    const novaSolicitacao = {
      id: uuidv4(),
      aluno_id,
      aluno_nome: nomeAluno,
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
      data_resolucao: row.get('data_resolucao'),
      observacao_admin: row.get('observacao_admin') || ''
    }));

    // Ordenar por data de criação desc (mais recentes primeiro)
    solicitacoes.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));

    res.json(solicitacoes);
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ error: 'Erro ao listar solicitações.' });
  }
});

// PUT /admin/:id/aprovar - Admin aprova a solicitação com observação
router.put('/admin/:id/aprovar', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });

    const { observacao } = req.body;
    const solicitacaoId = req.params.id;
    const sheet = await getSheet('solicitacoes', SOLICITACOES_HEADERS);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === solicitacaoId);
    
    if (!row) return res.status(404).json({ error: 'Solicitação não encontrada.' });

    row.set('status', 'APROVADA');
    row.set('data_resolucao', new Date().toISOString());
    row.set('observacao_admin', observacao || '');
    await row.save();
    invalidateCache('solicitacoes');

    res.json({ message: 'Solicitação aprovada com sucesso.' });
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    res.status(500).json({ error: 'Erro ao aprovar solicitação.' });
  }
});

// PUT /admin/:id/recusar - Admin recusa a solicitação com observação
router.put('/admin/:id/recusar', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });

    const { observacao } = req.body;
    const solicitacaoId = req.params.id;
    const sheet = await getSheet('solicitacoes', SOLICITACOES_HEADERS);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === solicitacaoId);
    
    if (!row) return res.status(404).json({ error: 'Solicitação não encontrada.' });

    row.set('status', 'RECUSADA');
    row.set('data_resolucao', new Date().toISOString());
    row.set('observacao_admin', observacao || '');
    await row.save();
    invalidateCache('solicitacoes');

    res.json({ message: 'Solicitação recusada com sucesso.' });
  } catch (error) {
    console.error('Erro ao recusar solicitação:', error);
    res.status(500).json({ error: 'Erro ao recusar solicitação.' });
  }
});

// DELETE /admin/:id - Admin exclui permanentemente a solicitação
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });

    const solicitacaoId = req.params.id;
    const sheet = await getSheet('solicitacoes', SOLICITACOES_HEADERS);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === solicitacaoId);
    
    if (!row) return res.status(404).json({ error: 'Solicitação não encontrada.' });

    await row.delete();
    invalidateCache('solicitacoes');

    res.json({ message: 'Solicitação excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir solicitação:', error);
    res.status(500).json({ error: 'Erro ao excluir solicitação.' });
  }
});

// GET /aluno/notificacoes - Retorna as notificações mais recentes para o aluno
router.get('/aluno/notificacoes', authMiddleware, async (req, res) => {
  try {
    const aluno_id = req.user.id;
    const rows = await getCachedRows('solicitacoes', SOLICITACOES_HEADERS);
    
    const notificacoes = rows
      .filter(row => row.get('aluno_id') === aluno_id && ['APROVADA', 'RECUSADA'].includes(row.get('status')))
      .map(row => ({
        id: row.get('id'),
        tipo: row.get('tipo'),
        mensagem_aluno: row.get('mensagem'),
        status: row.get('status'),
        data_resolucao: row.get('data_resolucao'),
        observacao_admin: row.get('observacao_admin') || ''
      }))
      .sort((a, b) => new Date(b.data_resolucao) - new Date(a.data_resolucao));

    res.json(notificacoes.slice(0, 5)); // Retorna apenas as 5 mais recentes
  } catch (error) {
    console.error('Erro ao listar notificações do aluno:', error);
    res.status(500).json({ error: 'Erro ao listar notificações.' });
  }
});

module.exports = router;
