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
      valor: Number(String(atual.get('valor') || '0').replace(',', '.')),
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
        valor: Number(String(r.get('valor') || '0').replace(',', '.')),
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
// HELPER — Gera referência no formato "Mês/Ano"
// ============================================
function gerarReferencia(date) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[date.getMonth()]}/${date.getFullYear()}`;
}

// ============================================
// HELPER — Auto-gera próxima mensalidade se a atual foi PAGA
// ============================================
async function autoGerarProximaMensalidade(userId) {
  try {
    const assinaturasRows = await getCachedRows('assinaturas', ASSINATURAS_HEADERS);
    const assinatura = assinaturasRows.find(r => r.get('user_id') === userId && r.get('status') === 'ATIVA');
    if (!assinatura) return;

    const mensalidadesRows = await getCachedRows('mensalidades', MENSALIDADES_HEADERS);
    const userMensalidades = mensalidadesRows
      .filter(r => r.get('user_id') === userId)
      .sort((a, b) => new Date(b.get('data_vencimento')) - new Date(a.get('data_vencimento')));

    if (userMensalidades.length === 0) return;

    const maisRecente = userMensalidades[0];
    
    // Se a mais recente não é PAGA, não gera nova
    if (maisRecente.get('status') !== 'PAGA') return;

    // Verifica se já existe uma mensalidade futura (evita duplicata)
    const hoje = new Date();
    const existeFutura = userMensalidades.some(r => {
      const venc = new Date(r.get('data_vencimento'));
      return venc > hoje && r.get('status') !== 'PAGA';
    });
    if (existeFutura) return;

    // Calcula próximo vencimento
    const diaVenc = Number(assinatura.get('dia_vencimento')) || hoje.getDate();
    const valorPlano = Number(String(assinatura.get('valor_personalizado') || '19.90').replace(',', '.'));
    
    let proxVenc = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVenc);
    // Se o dia de vencimento já passou neste mês e não existe cobrança pro mês atual
    if (diaVenc > hoje.getDate()) {
      proxVenc = new Date(hoje.getFullYear(), hoje.getMonth(), diaVenc);
    }

    const sheet = await getSheet('mensalidades', MENSALIDADES_HEADERS);
    await sheet.addRow({
      id: uuidv4(),
      user_id: userId,
      asaas_payment_id: '',
      valor: valorPlano,
      data_vencimento: proxVenc.toISOString().split('T')[0],
      data_pagamento: '',
      status: 'PENDENTE',
      forma_pagamento: 'PIX_MANUAL',
      referencia: gerarReferencia(proxVenc),
      pix_qrcode: '',
      pix_copia_cola: '',
      observacao: 'Gerada automaticamente',
      data_criacao: new Date().toISOString()
    });
    invalidateCache('mensalidades');
    console.log(`[AUTO] Nova mensalidade gerada para user ${userId} - venc: ${proxVenc.toISOString().split('T')[0]}`);
  } catch (err) {
    console.error('[AUTO] Erro ao gerar próxima mensalidade:', err);
  }
}

// ============================================
// POST /assinar — Ativa assinatura do aluno
// ============================================
router.post('/assinar', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verifica se já tem assinatura ATIVA
    const assinaturasRows = await getCachedRows('assinaturas', ASSINATURAS_HEADERS);
    const jaTemAtiva = assinaturasRows.find(r => r.get('user_id') === userId && r.get('status') === 'ATIVA');
    if (jaTemAtiva) {
      return res.status(400).json({ error: 'Você já possui uma assinatura ativa.' });
    }

    // Busca ou cria o plano "Plano Básico"
    let planosRows = await getCachedRows('planos', PLANOS_HEADERS);
    let planoBasico = planosRows.find(r => r.get('nome') === 'Plano Básico' && r.get('ativo') === 'true');
    
    if (!planoBasico) {
      const planosSheet = await getSheet('planos', PLANOS_HEADERS);
      const planoId = uuidv4();
      await planosSheet.addRow({
        id: planoId,
        nome: 'Plano Básico',
        valor: '19.90',
        ativo: 'true',
        data_criacao: new Date().toISOString()
      });
      invalidateCache('planos');
      planosRows = await getCachedRows('planos', PLANOS_HEADERS);
      planoBasico = planosRows.find(r => r.get('id') === planoId);
    }

    const planoId = planoBasico.get('id');
    const valorPlano = Number(String(planoBasico.get('valor') || '19.90').replace(',', '.'));
    const hoje = new Date();
    const diaVencimento = hoje.getDate();

    // Cria assinatura
    const assinaturaId = uuidv4();
    const assinaturasSheet = await getSheet('assinaturas', ASSINATURAS_HEADERS);
    await assinaturasSheet.addRow({
      id: assinaturaId,
      user_id: userId,
      plano_id: planoId,
      asaas_customer_id: '',
      valor_personalizado: valorPlano.toString(),
      dia_vencimento: diaVencimento.toString(),
      status: 'ATIVA',
      data_inicio: hoje.toISOString().split('T')[0],
      data_criacao: hoje.toISOString()
    });
    invalidateCache('assinaturas');

    // Gera primeira mensalidade (vencimento = 30 dias a partir de hoje)
    const vencimento = new Date(hoje);
    vencimento.setDate(vencimento.getDate() + 30);

    const mensalidadesSheet = await getSheet('mensalidades', MENSALIDADES_HEADERS);
    await mensalidadesSheet.addRow({
      id: uuidv4(),
      user_id: userId,
      asaas_payment_id: '',
      valor: valorPlano,
      data_vencimento: vencimento.toISOString().split('T')[0],
      data_pagamento: '',
      status: 'PENDENTE',
      forma_pagamento: 'PIX_MANUAL',
      referencia: gerarReferencia(vencimento),
      pix_qrcode: '',
      pix_copia_cola: '',
      observacao: 'Primeira mensalidade - assinatura ativada',
      data_criacao: hoje.toISOString()
    });
    invalidateCache('mensalidades');

    res.json({
      success: true,
      message: 'Assinatura ativada com sucesso!',
      assinatura: {
        id: assinaturaId,
        plano_nome: 'Plano Básico',
        valor: valorPlano,
        status: 'ATIVA',
        data_inicio: hoje.toISOString().split('T')[0],
        dia_vencimento: diaVencimento
      }
    });
  } catch (error) {
    console.error('Erro ao assinar:', error);
    res.status(500).json({ error: 'Erro ao ativar assinatura' });
  }
});

// ============================================
// GET /minha-assinatura — Retorna assinatura do aluno
// ============================================
router.get('/minha-assinatura', authMiddleware, async (req, res) => {
  try {
    const assinaturasRows = await getCachedRows('assinaturas', ASSINATURAS_HEADERS);
    const assinatura = assinaturasRows
      .filter(r => r.get('user_id') === req.user.id)
      .sort((a, b) => new Date(b.get('data_criacao')) - new Date(a.get('data_criacao')))[0];

    if (!assinatura) return res.json(null);

    // Busca nome do plano
    const planosRows = await getCachedRows('planos', PLANOS_HEADERS);
    const plano = planosRows.find(r => r.get('id') === assinatura.get('plano_id'));

    res.json({
      id: assinatura.get('id'),
      plano_nome: plano ? plano.get('nome') : 'Plano Básico',
      valor: Number(String(assinatura.get('valor_personalizado') || '19.90').replace(',', '.')),
      status: assinatura.get('status'),
      data_inicio: assinatura.get('data_inicio'),
      dia_vencimento: Number(assinatura.get('dia_vencimento'))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
});

// ============================================
// GET /minha-assinatura/resumo — Dados consolidados para a tela Financeiro
// ============================================
router.get('/minha-assinatura/resumo', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Auto-gerar próxima mensalidade se necessário
    await autoGerarProximaMensalidade(userId);

    // Buscar assinatura
    const assinaturasRows = await getCachedRows('assinaturas', ASSINATURAS_HEADERS);
    const assinaturaRow = assinaturasRows
      .filter(r => r.get('user_id') === userId)
      .sort((a, b) => new Date(b.get('data_criacao')) - new Date(a.get('data_criacao')))[0];

    let assinatura = null;
    if (assinaturaRow) {
      const planosRows = await getCachedRows('planos', PLANOS_HEADERS);
      const plano = planosRows.find(r => r.get('id') === assinaturaRow.get('plano_id'));
      assinatura = {
        id: assinaturaRow.get('id'),
        plano_nome: plano ? plano.get('nome') : 'Plano Básico',
        valor: Number(String(assinaturaRow.get('valor_personalizado') || '19.90').replace(',', '.')),
        status: assinaturaRow.get('status'),
        data_inicio: assinaturaRow.get('data_inicio'),
        dia_vencimento: Number(assinaturaRow.get('dia_vencimento'))
      };
    }

    // Buscar mensalidades
    const mensalidadesRows = await getCachedRows('mensalidades', MENSALIDADES_HEADERS);
    const userMensalidades = mensalidadesRows
      .filter(r => r.get('user_id') === userId)
      .sort((a, b) => new Date(b.get('data_vencimento')) - new Date(a.get('data_vencimento')));

    // Mensalidade atual (mais recente)
    let mensalidadeAtual = null;
    if (userMensalidades.length > 0) {
      const atual = userMensalidades[0];
      let diasAtraso = 0;
      if (atual.get('status') === 'ATRASADA') {
        const hoje = new Date();
        const vencimento = new Date(atual.get('data_vencimento'));
        diasAtraso = Math.ceil(Math.abs(hoje - vencimento) / (1000 * 60 * 60 * 24));
      }
      mensalidadeAtual = {
        id: atual.get('id'),
        valor: Number(String(atual.get('valor') || '0').replace(',', '.')),
        status: atual.get('status'),
        data_vencimento: atual.get('data_vencimento'),
        data_pagamento: atual.get('data_pagamento'),
        referencia: atual.get('referencia'),
        dias_atraso: diasAtraso
      };
    }

    // Histórico (todas exceto a atual)
    const historico = userMensalidades.slice(1).map(r => ({
      id: r.get('id'),
      valor: Number(String(r.get('valor') || '0').replace(',', '.')),
      status: r.get('status'),
      data_vencimento: r.get('data_vencimento'),
      data_pagamento: r.get('data_pagamento'),
      referencia: r.get('referencia')
    }));

    // Stats
    const totalPago = userMensalidades
      .filter(r => r.get('status') === 'PAGA')
      .reduce((sum, r) => sum + (Number(String(r.get('valor') || '0').replace(',', '.')) || 0), 0);
    
    const mesesAssinante = userMensalidades.filter(r => r.get('status') === 'PAGA').length;

    let proximoVencimento = null;
    const pendentes = userMensalidades.filter(r => r.get('status') === 'PENDENTE' || r.get('status') === 'ATRASADA');
    if (pendentes.length > 0) {
      proximoVencimento = pendentes[pendentes.length - 1].get('data_vencimento');
    } else if (assinatura && assinatura.status === 'ATIVA') {
      // Calcular próximo vencimento baseado no dia_vencimento
      const hoje = new Date();
      const diaVenc = assinatura.dia_vencimento || hoje.getDate();
      let prox = new Date(hoje.getFullYear(), hoje.getMonth(), diaVenc);
      if (prox <= hoje) prox = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVenc);
      proximoVencimento = prox.toISOString().split('T')[0];
    }

    res.json({
      assinatura,
      mensalidade_atual: mensalidadeAtual,
      historico,
      stats: {
        total_pago: totalPago,
        meses_assinante: mesesAssinante,
        proximo_vencimento: proximoVencimento
      }
    });
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({ error: 'Erro ao carregar resumo da assinatura' });
  }
});

// ============================================
// POST /cancelar-assinatura — Cancela a assinatura do aluno
// ============================================
router.post('/cancelar-assinatura', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const sheet = await getSheet('assinaturas', ASSINATURAS_HEADERS);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('user_id') === userId && r.get('status') === 'ATIVA');

    if (!row) {
      return res.status(404).json({ error: 'Nenhuma assinatura ativa encontrada.' });
    }

    row.set('status', 'CANCELADA');
    await row.save();
    invalidateCache('assinaturas');

    res.json({ success: true, message: 'Assinatura cancelada com sucesso.' });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
});

// ============================================
// ADMIN ROTAS ABAIXO
// ============================================

// ============================================
// PUT /admin/assinatura/:userId/vencimento — Admin altera dia de vencimento
// ============================================
router.put('/admin/assinatura/:userId/vencimento', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { dia_vencimento } = req.body;

    if (!dia_vencimento || dia_vencimento < 1 || dia_vencimento > 28) {
      return res.status(400).json({ error: 'Dia de vencimento deve ser entre 1 e 28.' });
    }

    const sheet = await getSheet('assinaturas', ASSINATURAS_HEADERS);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('user_id') === userId && r.get('status') === 'ATIVA');

    if (!row) {
      return res.status(404).json({ error: 'Assinatura ativa não encontrada para este aluno.' });
    }

    row.set('dia_vencimento', dia_vencimento.toString());
    await row.save();
    invalidateCache('assinaturas');

    res.json({ success: true, message: `Dia de vencimento alterado para ${dia_vencimento}.` });
  } catch (error) {
    console.error('Erro ao alterar vencimento:', error);
    res.status(500).json({ error: 'Erro ao alterar dia de vencimento' });
  }
});

// ============================================
// GET /admin/dashboard — KPIs financeiros
// ============================================
router.get('/admin/dashboard', adminMiddleware, async (req, res) => {
  try {
    const mensalidadesRows = await getCachedRows('mensalidades', MENSALIDADES_HEADERS);
    const usersRows = await getCachedRows('usuarios', ['id', 'nome', 'email', 'role']);
    
    let receitaMes = 0;
    let receitaAno = 0;
    let totalAberto = 0;
    let inadimplentes = new Set();
    
    const hoje = new Date();
    const currentMonth = hoje.getMonth();
    const currentYear = hoje.getFullYear();

    const userRoleMap = new Map();
    usersRows.forEach(r => userRoleMap.set(r.get('id'), r.get('role')));

    mensalidadesRows.forEach(r => {
      const userId = r.get('user_id');
      const role = userRoleMap.get(userId);
      
      // Ignorar administradores e usuários excluídos do cálculo do dashboard
      if (!role || role === 'admin') return;

      const status = r.get('status');
      const valor = Number(String(r.get('valor') || '0').replace(',', '.')) || 0;
      const dataPagamentoStr = r.get('data_pagamento');
      
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
    const usuariosRows = await getCachedRows('usuarios', USERS_HEADERS);
    const mensalidadesRows = await getCachedRows('mensalidades', MENSALIDADES_HEADERS);
    const assinaturasRows = await getCachedRows('assinaturas', ASSINATURAS_HEADERS);
    const planosRows = await getCachedRows('planos', PLANOS_HEADERS);
    const configRows = await getCachedRows('configuracoes', CONFIG_HEADERS);

    // Config de trial
    const trialInicioRow = configRows.find(r => r.get('chave') === 'TRIAL_INICIO');
    const trialDiasRow = configRows.find(r => r.get('chave') === 'TRIAL_DIAS');
    const trialDias = trialDiasRow ? Number(trialDiasRow.get('valor')) : 30;
    const trialInicio = trialInicioRow ? new Date(trialInicioRow.get('valor')) : null;
    const hoje = new Date();

    // Map de planos por ID
    const planosMap = new Map();
    planosRows.forEach(r => planosMap.set(r.get('id'), { nome: r.get('nome'), valor: r.get('valor') }));

    // Pegar apenas usuários com role 'user'
    const alunos = usuariosRows.filter(r => r.get('role') !== 'admin').map(r => ({
      id: r.get('id'),
      nome: r.get('nome'),
      email: r.get('email'),
      data_criacao: r.get('data_criacao'),
      trial_expira: r.get('trial_expira')
    }));

    // Anexar status financeiro + trial + assinatura
    const result = alunos.map(aluno => {
      // --- Mensalidade ---
      const alunoMensalidades = mensalidadesRows
        .filter(r => r.get('user_id') === aluno.id)
        .sort((a, b) => new Date(b.get('data_vencimento')) - new Date(a.get('data_vencimento')));
      const atual = alunoMensalidades.length > 0 ? alunoMensalidades[0] : null;

      // --- Assinatura ---
      const assinatura = assinaturasRows.find(r => r.get('user_id') === aluno.id && r.get('status') === 'ATIVA');
      let statusAssinatura = 'SEM';
      let planoNome = '';
      let planoValor = '';
      let diaVencimento = '';
      if (assinatura) {
        statusAssinatura = 'ATIVA';
        const plano = planosMap.get(assinatura.get('plano_id'));
        planoNome = plano ? plano.nome : 'Plano Básico';
        planoValor = assinatura.get('valor_personalizado') || (plano ? plano.valor : '19.90');
        diaVencimento = assinatura.get('dia_vencimento') || '';
      }

      // --- Trial ---
      let trialAtivo = false;
      let diasRestantesTrial = 0;
      let dataExpiracaoTrial = '';
      if (statusAssinatura !== 'ATIVA') {
        let dataExpiracao;
        if (aluno.trial_expira) {
          dataExpiracao = new Date(aluno.trial_expira);
        } else {
          const dataCriacao = parseData(aluno.data_criacao);
          const dataBase = (trialInicio && dataCriacao < trialInicio) ? trialInicio : dataCriacao;
          dataExpiracao = new Date(dataBase);
          dataExpiracao.setDate(dataExpiracao.getDate() + trialDias);
        }
        const diffMs = dataExpiracao - hoje;
        diasRestantesTrial = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        trialAtivo = diasRestantesTrial > 0;
        dataExpiracaoTrial = dataExpiracao.toISOString().split('T')[0];
      }

      return {
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email,
        data_criacao: aluno.data_criacao,
        status_mensalidade: atual ? atual.get('status') : 'SEM_COBRANCA',
        ultima_mensalidade: atual ? {
          id: atual.get('id'),
          valor: Number(String(atual.get('valor') || '0').replace(',', '.')),
          vencimento: atual.get('data_vencimento'),
          referencia: atual.get('referencia')
        } : null,
        status_assinatura: statusAssinatura,
        plano_nome: planoNome,
        plano_valor: planoValor,
        dia_vencimento: diaVencimento,
        trial_ativo: trialAtivo,
        dias_restantes_trial: diasRestantesTrial,
        data_expiracao_trial: dataExpiracaoTrial
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

// ============================================
// Constantes auxiliares para Trial
// ============================================
const USERS_HEADERS = ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role', 'trial_expira'];
const CONFIG_HEADERS = ['chave', 'valor'];
const SOLICITACOES_HEADERS = ['id', 'aluno_id', 'aluno_nome', 'tipo', 'mensagem', 'status', 'data_criacao', 'data_resolucao', 'observacao_admin'];

// ============================================
// Função auxiliar para interpretar data no formato brasileiro (DD/MM/YYYY, HH:MM:SS) ou ISO
// ============================================
function parseData(dataStr) {
  if (!dataStr) return new Date();
  if (dataStr.includes('/')) {
    const [dataParte] = dataStr.split(',');
    const [dia, mes, ano] = dataParte.trim().split('/');
    return new Date(`${ano}-${mes}-${dia}T00:00:00`);
  }
  return new Date(dataStr);
}

// ============================================
// GET /trial-status — Verifica status do período gratuito
// ============================================
router.get('/trial-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // Admins nunca são bloqueados
    if (role === 'admin') {
      return res.json({ temAssinatura: true, trialAtivo: false, diasRestantes: 0, dataExpiracao: '' });
    }

    // 1. Verificar se já tem assinatura ativa
    const assinaturasRows = await getCachedRows('assinaturas', ASSINATURAS_HEADERS);
    const assinaturaAtiva = assinaturasRows.find(
      r => r.get('user_id') === userId && r.get('status') === 'ATIVA'
    );

    if (assinaturaAtiva) {
      return res.json({ temAssinatura: true, trialAtivo: false, diasRestantes: 0, dataExpiracao: '' });
    }

    // 2. Buscar dados do usuário
    const usersRows = await getCachedRows('usuarios', USERS_HEADERS);
    const userRow = usersRows.find(r => r.get('id') === userId);
    if (!userRow) return res.status(404).json({ error: 'Usuário não encontrado' });

    // 3. Verificar se tem trial_expira personalizado (admin estendeu)
    const trialExpiraCustom = userRow.get('trial_expira');
    
    let dataExpiracao;
    
    if (trialExpiraCustom) {
      // Usar data de expiração personalizada
      dataExpiracao = new Date(trialExpiraCustom);
    } else {
      // Calcular baseado na data de criação
      const dataCriacao = parseData(userRow.get('data_criacao'));
      
      // Buscar configurações de trial
      const configRows = await getCachedRows('configuracoes', CONFIG_HEADERS);
      const trialInicioRow = configRows.find(r => r.get('chave') === 'TRIAL_INICIO');
      const trialDiasRow = configRows.find(r => r.get('chave') === 'TRIAL_DIAS');
      
      const trialDias = trialDiasRow ? Number(trialDiasRow.get('valor')) : 30;
      const trialInicio = trialInicioRow ? new Date(trialInicioRow.get('valor')) : null;
      
      // Para alunos existentes (criados antes do deploy), usar a data de deploy
      const dataBase = (trialInicio && dataCriacao < trialInicio) ? trialInicio : dataCriacao;
      
      dataExpiracao = new Date(dataBase);
      dataExpiracao.setDate(dataExpiracao.getDate() + trialDias);
    }

    const hoje = new Date();
    const diffMs = dataExpiracao - hoje;
    const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const trialAtivo = diasRestantes > 0;

    res.json({
      temAssinatura: false,
      trialAtivo,
      diasRestantes,
      dataExpiracao: dataExpiracao.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Erro ao verificar trial:', error);
    res.status(500).json({ error: 'Erro ao verificar status do trial' });
  }
});

// ============================================
// POST /notificar-pagamento — Aluno informa que realizou pagamento
// ============================================
router.post('/notificar-pagamento', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar nome do aluno
    const usersRows = await getCachedRows('usuarios', USERS_HEADERS);
    const userRow = usersRows.find(r => r.get('id') === userId);
    if (!userRow) return res.status(404).json({ error: 'Usuário não encontrado' });

    const alunoNome = userRow.get('nome');

    // Verificar se já tem uma notificação pendente recente (evitar spam)
    const solicitacoesRows = await getCachedRows('solicitacoes', SOLICITACOES_HEADERS);
    const pendente = solicitacoesRows.find(
      r => r.get('aluno_id') === userId && r.get('tipo') === 'PAGAMENTO_REALIZADO' && r.get('status') === 'PENDENTE'
    );

    if (pendente) {
      return res.json({ success: true, message: 'Notificação já enviada. Aguarde a confirmação do administrador.' });
    }

    // Criar solicitação
    const solicitacoesSheet = await getSheet('solicitacoes', SOLICITACOES_HEADERS);
    await solicitacoesSheet.addRow({
      id: uuidv4(),
      aluno_id: userId,
      aluno_nome: alunoNome,
      tipo: 'PAGAMENTO_REALIZADO',
      mensagem: `${alunoNome} informou que realizou o pagamento via PIX.`,
      status: 'PENDENTE',
      data_criacao: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      data_resolucao: '',
      observacao_admin: ''
    });

    invalidateCache('solicitacoes');

    res.json({ success: true, message: 'Notificação enviada com sucesso!' });
  } catch (error) {
    console.error('Erro ao notificar pagamento:', error);
    res.status(500).json({ error: 'Erro ao enviar notificação de pagamento' });
  }
});

// ============================================
// PUT /admin/trial/estender — Admin estende período gratuito de um aluno
// ============================================
router.put('/admin/trial/estender', adminMiddleware, async (req, res) => {
  try {
    const { userId, diasExtras } = req.body;

    if (!userId || !diasExtras || diasExtras <= 0) {
      return res.status(400).json({ error: 'userId e diasExtras (positivo) são obrigatórios.' });
    }

    // Buscar o usuário
    const usersSheet = await getSheet('usuarios', USERS_HEADERS);
    const usersRows = await usersSheet.getRows();
    const userRow = usersRows.find(r => r.get('id') === userId);
    
    if (!userRow) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Calcular nova data de expiração
    const trialExpiraAtual = userRow.get('trial_expira');
    let baseDate;

    if (trialExpiraAtual) {
      // Se já tem uma data personalizada, estender a partir dela
      baseDate = new Date(trialExpiraAtual);
    } else {
      // Calcular a data de expiração padrão (data_criacao + 30 dias)
      const dataCriacao = parseData(userRow.get('data_criacao'));
      const configRows = await getCachedRows('configuracoes', CONFIG_HEADERS);
      const trialInicioRow = configRows.find(r => r.get('chave') === 'TRIAL_INICIO');
      const trialDiasRow = configRows.find(r => r.get('chave') === 'TRIAL_DIAS');
      
      const trialDias = trialDiasRow ? Number(trialDiasRow.get('valor')) : 30;
      const trialInicio = trialInicioRow ? new Date(trialInicioRow.get('valor')) : null;
      
      const dataBase = (trialInicio && dataCriacao < trialInicio) ? trialInicio : dataCriacao;
      baseDate = new Date(dataBase);
      baseDate.setDate(baseDate.getDate() + trialDias);
    }

    // Se a data base já passou, estender a partir de hoje
    const hoje = new Date();
    if (baseDate < hoje) {
      baseDate = hoje;
    }

    baseDate.setDate(baseDate.getDate() + Number(diasExtras));
    const novaExpiracao = baseDate.toISOString().split('T')[0];

    // Salvar no Google Sheets
    userRow.set('trial_expira', novaExpiracao);
    await userRow.save();
    invalidateCache('usuarios');

    res.json({ 
      success: true, 
      novaDataExpiracao: novaExpiracao,
      message: `Trial estendido com sucesso até ${novaExpiracao}`
    });
  } catch (error) {
    console.error('Erro ao estender trial:', error);
    res.status(500).json({ error: 'Erro ao estender período gratuito' });
  }
});

module.exports = router;
