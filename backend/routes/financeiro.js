const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { getCachedRows, getSheet, invalidateCache } = require('../services/googleSheets');

const MENSALIDADES_HEADERS = ['id', 'user_id', 'asaas_payment_id', 'valor', 'data_vencimento', 'data_pagamento', 'status', 'forma_pagamento', 'referencia', 'pix_qrcode', 'pix_copia_cola', 'observacao', 'data_criacao'];
const PLANOS_HEADERS = ['id', 'nome', 'valor', 'ativo', 'data_criacao'];
const ASSINATURAS_HEADERS = ['id', 'user_id', 'plano_id', 'asaas_customer_id', 'valor_personalizado', 'dia_vencimento', 'status', 'data_inicio', 'data_criacao'];

// ============================================
// GET /minha-mensalidade — Retorna mensalidade atual do aluno logado
// ============================================
router.get('/minha-mensalidade', authMiddleware, async (req, res) => {
  try {
    const mensalidadesRows = await getCachedRows('mensalidades', MENSALIDADES_HEADERS);
    // Filtrar mensalidades do usuário ordenadas por data de vencimento decrescente
    const userMensalidades = mensalidadesRows
      .filter(r => r.get('user_id') === req.user.id)
      .sort((a, b) => new Date(b.get('data_vencimento')) - new Date(a.get('data_vencimento')));

    if (userMensalidades.length === 0) {
      return res.json(null);
    }

    // Retorna a mensalidade mais recente/atual (a primeira)
    const atual = userMensalidades[0];
    
    let diasAtraso = 0;
    if (atual.get('status') === 'ATRASADA') {
      const hoje = new Date();
      const vencimento = new Date(atual.get('data_vencimento'));
      const diffTime = Math.abs(hoje - vencimento);
      diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    res.json({
      id: atual.get('id'),
      valor: Number(atual.get('valor')),
      data_vencimento: atual.get('data_vencimento'),
      data_pagamento: atual.get('data_pagamento'),
      status: atual.get('status'),
      referencia: atual.get('referencia'),
      pix_qrcode: atual.get('pix_qrcode'),
      pix_copia_cola: atual.get('pix_copia_cola'),
      dias_atraso: diasAtraso
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar mensalidade' });
  }
});

// ============================================
// GET /historico — Histórico financeiro do aluno
// ============================================
router.get('/historico', authMiddleware, async (req, res) => {
  try {
    const mensalidadesRows = await getCachedRows('mensalidades', MENSALIDADES_HEADERS);
    const userMensalidades = mensalidadesRows
      .filter(r => r.get('user_id') === req.user.id)
      .map(r => ({
        id: r.get('id'),
        valor: Number(r.get('valor')),
        data_vencimento: r.get('data_vencimento'),
        data_pagamento: r.get('data_pagamento'),
        status: r.get('status'),
        referencia: r.get('referencia')
      }))
      .sort((a, b) => new Date(b.get('data_vencimento')) - new Date(a.get('data_vencimento')));

    res.json(userMensalidades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// ============================================
// WEBHOOK /webhook — Recebe notificações do Asaas
// ============================================
router.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  try {
    // OBS: Em produção, devemos validar o token recebido no Header (asaas-access-token)
    const { event, payment } = req.body;
    
    console.log(`[ASAAS WEBHOOK] Recebido evento: ${event} para o pagamento ${payment?.id}`);

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const paymentId = payment.id;
      
      const sheet = await getSheet('mensalidades', MENSALIDADES_HEADERS);
      const rows = await sheet.getRows();
      
      const row = rows.find(r => r.get('asaas_payment_id') === paymentId);
      
      if (row) {
        row.set('status', 'PAGA');
        row.set('data_pagamento', payment.paymentDate || new Date().toISOString().split('T')[0]);
        await row.save();
        invalidateCache('mensalidades');
        console.log(`[ASAAS WEBHOOK] Mensalidade ${row.get('id')} atualizada para PAGA`);
      }
    } else if (event === 'PAYMENT_OVERDUE') {
      const paymentId = payment.id;
      const sheet = await getSheet('mensalidades', MENSALIDADES_HEADERS);
      const rows = await sheet.getRows();
      
      const row = rows.find(r => r.get('asaas_payment_id') === paymentId);
      if (row && row.get('status') !== 'PAGA') {
        row.set('status', 'ATRASADA');
        await row.save();
        invalidateCache('mensalidades');
        console.log(`[ASAAS WEBHOOK] Mensalidade ${row.get('id')} atualizada para ATRASADA`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(200).json({ error: error.message });
  }
});

// ============================================
// ADMIN ROTAS ABAIXO
// ============================================

// ============================================
// GET /admin/dashboard — KPIs financeiros
// ============================================
router.get('/admin/dashboard', adminMiddleware, async (req, res) => {
  try {
    const mensalidadesRows = await getCachedRows('mensalidades', MENSALIDADES_HEADERS);
    
    let receitaMes = 0;
    let receitaAno = 0;
    let totalAberto = 0;
    let inadimplentes = new Set();
    
    const hoje = new Date();
    const currentMonth = hoje.getMonth();
    const currentYear = hoje.getFullYear();

    mensalidadesRows.forEach(r => {
      const status = r.get('status');
      const valor = Number(r.get('valor')) || 0;
      const dataPagamentoStr = r.get('data_pagamento');
      const userId = r.get('user_id');
      
      if (status === 'PAGA' && dataPagamentoStr) {
        const d = new Date(dataPagamentoStr);
        if (d.getFullYear() === currentYear) {
          receitaAno += valor;
          if (d.getMonth() === currentMonth) {
            receitaMes += valor;
          }
        }
      }
      
      if (status === 'PENDENTE' || status === 'ATRASADA') {
        totalAberto += valor;
      }
      
      if (status === 'ATRASADA') {
        inadimplentes.add(userId);
      }
    });

    res.json({
      receitaMes,
      receitaAno,
      totalAberto,
      qtdInadimplentes: inadimplentes.size
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar dashboard financeiro' });
  }
});

// ============================================
// GET /admin/alunos — Lista alunos e status financeiro
// ============================================
router.get('/admin/alunos', adminMiddleware, async (req, res) => {
  try {
    const usuariosRows = await getCachedRows('usuarios', ['id', 'nome', 'email', 'role']);
    const mensalidadesRows = await getCachedRows('mensalidades', MENSALIDADES_HEADERS);
    
    // Pegar apenas usuários com role 'user'
    const alunos = usuariosRows.filter(r => r.get('role') !== 'admin').map(r => ({
      id: r.get('id'),
      nome: r.get('nome'),
      email: r.get('email')
    }));

    // Anexar status financeiro atual de cada aluno
    const result = alunos.map(aluno => {
      const alunoMensalidades = mensalidadesRows
        .filter(r => r.get('user_id') === aluno.id)
        .sort((a, b) => new Date(b.get('data_vencimento')) - new Date(a.get('data_vencimento')));

      const atual = alunoMensalidades.length > 0 ? alunoMensalidades[0] : null;
      
      return {
        ...aluno,
        status_mensalidade: atual ? atual.get('status') : 'SEM_COBRANCA',
        ultima_mensalidade: atual ? {
          id: atual.get('id'),
          valor: Number(atual.get('valor')),
          vencimento: atual.get('data_vencimento'),
          referencia: atual.get('referencia')
        } : null
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar alunos no financeiro' });
  }
});

// ============================================
// POST /admin/cobranca — Gera cobrança avulsa manual
// ============================================
router.post('/admin/cobranca', adminMiddleware, async (req, res) => {
  try {
    const { user_id, valor, data_vencimento, referencia } = req.body;
    
    const usuariosRows = await getCachedRows('usuarios', ['id', 'nome', 'email']);
    const aluno = usuariosRows.find(r => r.get('id') === user_id);
    
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    
    // Salva no banco (Google Sheets) diretamente
    const sheet = await getSheet('mensalidades', MENSALIDADES_HEADERS);
    await sheet.addRow({
      id: uuidv4(),
      user_id: user_id,
      asaas_payment_id: '', // sem gateway
      valor: valor,
      data_vencimento: data_vencimento,
      data_pagamento: '',
      status: 'PENDENTE',
      forma_pagamento: 'PIX_MANUAL',
      referencia: referencia,
      pix_qrcode: '', // sem qr code dinamico
      pix_copia_cola: '',
      observacao: 'Cobrança manual gerada',
      data_criacao: new Date().toISOString()
    });
    
    invalidateCache('mensalidades');
    
    res.json({ success: true, message: 'Cobrança gerada com sucesso' });
  } catch (error) {
    console.error('Erro ao gerar cobrança:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao gerar cobrança' });
  }
});

// ============================================
// PUT /admin/cobranca/:id/pagar — Marca cobrança como PAGA manualmente
// ============================================
router.put('/admin/cobranca/:id/pagar', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const sheet = await getSheet('mensalidades', MENSALIDADES_HEADERS);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === id);
    
    if (!row) return res.status(404).json({ error: 'Cobrança não encontrada' });
    
    row.set('status', 'PAGA');
    row.set('data_pagamento', new Date().toISOString().split('T')[0]);
    await row.save();
    
    invalidateCache('mensalidades');
    
    res.json({ success: true, message: 'Cobrança marcada como paga!' });
  } catch (error) {
    console.error('Erro ao marcar como paga:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar cobrança' });
  }
});

module.exports = router;
