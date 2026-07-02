const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCachedRows, getSheet, invalidateCache } = require('../services/googleSheets');
const authMiddleware = require('../middlewares/authMiddleware');

const CONFIG_SHEET = 'configuracoes';
const CONFIG_HEADERS = ['chave', 'valor'];

const DEVICES_SHEET = 'dispositivos';
const DEVICES_HEADERS = ['id', 'user_id', 'user_nome', 'user_email', 'device_id', 'device_name', 'codigo_ativacao', 'status', 'data_solicitacao', 'data_autorizacao'];

// Seed padrão para a primeira execução
const DEFAULT_CONFIG = [
  { chave: 'REQUIRE_DEVICE_ACTIVATION', valor: 'false' }
];

/**
 * Garante que a aba de configurações exista e tenha os valores padrão.
 */
async function ensureConfigSeeded() {
  const sheet = await getSheet(CONFIG_SHEET, CONFIG_HEADERS);
  const rows = await getCachedRows(CONFIG_SHEET, CONFIG_HEADERS);

  if (rows.length === 0) {
    for (const cfg of DEFAULT_CONFIG) {
      await sheet.addRow(cfg);
    }
    invalidateCache(CONFIG_SHEET);
  }
}

// ============================================
// CONFIGURAÇÕES GLOBAIS
// ============================================

// GET / — Retorna todas as configurações como objeto chave-valor
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    }

    await ensureConfigSeeded();
    const rows = await getCachedRows(CONFIG_SHEET, CONFIG_HEADERS);

    const config = {};
    rows.forEach(r => {
      config[r.get('chave')] = r.get('valor');
    });

    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT / — Atualiza uma configuração existente { chave, valor }
router.put('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    }

    const { chave, valor } = req.body;
    if (!chave) {
      return res.status(400).json({ message: 'Campo "chave" é obrigatório.' });
    }

    await ensureConfigSeeded();
    const sheet = await getSheet(CONFIG_SHEET, CONFIG_HEADERS);
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('chave') === chave);
    if (!row) {
      return res.status(404).json({ message: `Configuração "${chave}" não encontrada.` });
    }

    row.set('valor', valor);
    await row.save();
    invalidateCache(CONFIG_SHEET);

    res.json({ message: 'Configuração atualizada com sucesso.', chave, valor });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GESTÃO DE DISPOSITIVOS / LICENÇAS
// ============================================

// GET /dispositivos — Lista todos os dispositivos, ordenados do mais recente para o mais antigo
router.get('/dispositivos', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    }

    const rows = await getCachedRows(DEVICES_SHEET, DEVICES_HEADERS);

    const dispositivos = rows.map(r => ({
      id: r.get('id'),
      user_id: r.get('user_id'),
      user_nome: r.get('user_nome'),
      user_email: r.get('user_email'),
      device_id: r.get('device_id'),
      device_name: r.get('device_name'),
      codigo_ativacao: r.get('codigo_ativacao'),
      status: r.get('status'),
      data_solicitacao: r.get('data_solicitacao'),
      data_autorizacao: r.get('data_autorizacao')
    }));

    // Ordenar por data_solicitacao mais recente primeiro
    dispositivos.sort((a, b) => {
      const dateA = a.data_solicitacao ? new Date(a.data_solicitacao.split('/').reverse().join('-')) : new Date(0);
      const dateB = b.data_solicitacao ? new Date(b.data_solicitacao.split('/').reverse().join('-')) : new Date(0);
      return dateB - dateA;
    });

    res.json(dispositivos);
  } catch (error) {
    console.error('Erro ao buscar dispositivos:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /dispositivos/:id/aprovar — Aprova um dispositivo pendente
router.put('/dispositivos/:id/aprovar', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    }

    const { id } = req.params;
    const sheet = await getSheet(DEVICES_SHEET, DEVICES_HEADERS);
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('id') === id);
    if (!row) {
      return res.status(404).json({ message: 'Dispositivo não encontrado.' });
    }

    row.set('status', 'AUTORIZADO');
    row.set('data_autorizacao', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    await row.save();
    invalidateCache(DEVICES_SHEET);

    res.json({ message: 'Dispositivo autorizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao aprovar dispositivo:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /dispositivos/:id/recusar — Recusa um dispositivo pendente
router.put('/dispositivos/:id/recusar', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    }

    const { id } = req.params;
    const sheet = await getSheet(DEVICES_SHEET, DEVICES_HEADERS);
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('id') === id);
    if (!row) {
      return res.status(404).json({ message: 'Dispositivo não encontrado.' });
    }

    row.set('status', 'RECUSADO');
    await row.save();
    invalidateCache(DEVICES_SHEET);

    res.json({ message: 'Dispositivo recusado com sucesso.' });
  } catch (error) {
    console.error('Erro ao recusar dispositivo:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /dispositivos/:id — Remove um dispositivo da planilha
router.delete('/dispositivos/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    }

    const { id } = req.params;
    const sheet = await getSheet(DEVICES_SHEET, DEVICES_HEADERS);
    const rows = await sheet.getRows();

    const row = rows.find(r => r.get('id') === id);
    if (!row) {
      return res.status(404).json({ message: 'Dispositivo não encontrado.' });
    }

    await row.delete();
    invalidateCache(DEVICES_SHEET);

    res.json({ message: 'Dispositivo removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover dispositivo:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
