const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { getSheet, getCachedRows, invalidateCache } = require('../services/googleSheets');
const adminMiddleware = require('../middlewares/adminMiddleware');

// E-mail fixo para a conta de demonstração
const DEMO_EMAIL = 'demo@corpoconectado.com';
const DEMO_NAME = 'João Atleta';
const DEMO_PASSWORD = 'demo'; // A senha será hasheada. O ideal é ser simples de digitar numa apresentação.

// ============================================
// POST /admin/demo/reset — Reseta e recria o ambiente de demonstração
// ============================================
router.post('/reset', adminMiddleware, async (req, res) => {
  try {
    const hoje = new Date();
    const dataCriacaoIso = hoje.toISOString();
    const dataCriacaoPtBr = hoje.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    console.log('[DEMO] Iniciando restauração do ambiente de demonstração...');

    // 1. Limpeza
    const usersSheet = await getSheet('usuarios', ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role', 'trial_expira']);
    const uRows = await usersSheet.getRows();
    const demoUsers = uRows.filter(r => (r.get('email') || '').toLowerCase() === DEMO_EMAIL.toLowerCase());
    
    const oldDemoIds = demoUsers.map(r => r.get('id'));
    
    // Deleta o usuário demo existente
    for (const u of demoUsers) {
      await u.delete();
    }

    if (oldDemoIds.length > 0) {
      const sheetsToClean = [
        { name: 'anamnese', userCol: 'id_usuario' },
        { name: 'treinos', userCol: 'user_id' },
        { name: 'exercicios_treino', userCol: 'user_id' }, // Se existir user_id na exercicios_treino, ou precisamos filtrar pelos treinos_id. (Melhor ignorar limpeza profunda de exercícios, apenas recriar treinos)
        { name: 'treinos_concluidos', userCol: 'user_id' },
        { name: 'mensalidades', userCol: 'user_id' },
        { name: 'assinaturas', userCol: 'user_id' },
        { name: 'solicitacoes', userCol: 'aluno_id' },
        { name: 'dispositivos', userCol: 'user_id' },
        { name: 'evolucoes', userCol: 'id_usuario' }, // assumindo que pode haver
      ];
      
      for (const s of sheetsToClean) {
        try {
          const sh = await getSheet(s.name, [s.userCol]);
          const shRows = await sh.getRows();
          const toDelete = shRows.filter(r => oldDemoIds.includes(r.get(s.userCol)));
          for (const r of toDelete) await r.delete();
        } catch(e) {}
      }
    }

    // 2. Recriação do Usuário Demo
    const newId = uuidv4();
    const senhaHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    
    await usersSheet.addRow({
      id: newId,
      nome: DEMO_NAME,
      email: DEMO_EMAIL,
      senha_hash: senhaHash,
      data_criacao: dataCriacaoPtBr,
      role: 'user',
      trial_expira: ''
    });

    // 3. Anamnese Completa
    const anamneseSheet = await getSheet('anamnese', ['id_usuario', 'idade', 'altura', 'peso', 'sexo', 'objetivo', 'nivel_fisico', 'lesoes_criticas', 'habitos_freq', 'habitos_tempo', 'habitos_local', 'data_nascimento']);
    await anamneseSheet.addRow({
      id_usuario: newId,
      idade: '28',
      altura: '180',
      peso: '82',
      sexo: 'Masculino',
      objetivo: 'Hipertrofia e definição muscular',
      nivel_fisico: 'Avançado',
      lesoes_criticas: 'Leve desconforto no ombro esquerdo',
      habitos_freq: '4 a 5 vezes por semana',
      habitos_tempo: '60 a 90 minutos',
      habitos_local: 'Academia',
      data_nascimento: '1995-05-15'
    });

    // 4. Criação da Ficha de Treino
    const treinoIdA = uuidv4();
    const treinoIdB = uuidv4();
    const treinosSheet = await getSheet('treinos', ['id', 'user_id', 'nome_ficha', 'status', 'data_inicio', 'data_termino', 'foco', 'criado_em']);
    
    await treinosSheet.addRow({
      id: treinoIdA,
      user_id: newId,
      nome_ficha: 'Treino A',
      status: 'ativo',
      data_inicio: new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Começou há 30 dias
      data_termino: new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mais 30 dias
      foco: 'Peito, Ombro e Tríceps',
      criado_em: dataCriacaoIso
    });

    await treinosSheet.addRow({
      id: treinoIdB,
      user_id: newId,
      nome_ficha: 'Treino B',
      status: 'ativo',
      data_inicio: new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_termino: new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      foco: 'Costas, Bíceps e Pernas',
      criado_em: dataCriacaoIso
    });

    // Exercícios dos Treinos (A e B)
    const exSheet = await getSheet('exercicios_treino', ['id', 'treino_id', 'nome_exercicio', 'series', 'repeticoes', 'carga', 'descanso', 'observacoes', 'video_url', 'ordem']);
    
    // Treino A
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdA, nome_exercicio: 'Supino Reto com Barra', series: '4', repeticoes: '10 a 12', carga: '80kg', descanso: '90s', observacoes: 'Cadência 3010', video_url: '', ordem: '1' });
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdA, nome_exercicio: 'Crucifixo Inclinado com Halteres', series: '3', repeticoes: '12 a 15', carga: '20kg', descanso: '60s', observacoes: 'Focar no alongamento', video_url: '', ordem: '2' });
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdA, nome_exercicio: 'Desenvolvimento Militar', series: '4', repeticoes: '10 a 12', carga: '40kg', descanso: '90s', observacoes: 'Costas bem apoiadas', video_url: '', ordem: '3' });
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdA, nome_exercicio: 'Elevação Lateral', series: '4', repeticoes: '15', carga: '12kg', descanso: '45s', observacoes: 'Bi-set com próximo', video_url: '', ordem: '4' });
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdA, nome_exercicio: 'Tríceps Corda', series: '4', repeticoes: '12 a 15', carga: '45kg', descanso: '60s', observacoes: '', video_url: '', ordem: '5' });

    // Treino B
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdB, nome_exercicio: 'Agachamento Livre', series: '4', repeticoes: '10', carga: '100kg', descanso: '120s', observacoes: 'Amplitude máxima', video_url: '', ordem: '1' });
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdB, nome_exercicio: 'Leg Press 45º', series: '4', repeticoes: '12', carga: '200kg', descanso: '90s', observacoes: 'Pés na largura dos ombros', video_url: '', ordem: '2' });
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdB, nome_exercicio: 'Puxada Frente', series: '4', repeticoes: '12', carga: '65kg', descanso: '60s', observacoes: 'Manter escápulas aduzidas', video_url: '', ordem: '3' });
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdB, nome_exercicio: 'Remada Curvada', series: '4', repeticoes: '10 a 12', carga: '70kg', descanso: '90s', observacoes: '', video_url: '', ordem: '4' });
    await exSheet.addRow({ id: uuidv4(), treino_id: treinoIdB, nome_exercicio: 'Rosca Direta', series: '4', repeticoes: '12', carga: '30kg', descanso: '60s', observacoes: '', video_url: '', ordem: '5' });

    // 5. Histórico Falso (Últimos 14 dias para gráficos bonitos)
    const concSheet = await getSheet('treinos_concluidos', ['id', 'user_id', 'treino_id', 'data_conclusao', 'duracao_minutos', 'volume_carga_kg']);
    
    let diasAtras = 14;
    while(diasAtras > 0) {
      // Treina sim, treina não, ou algo regular (A, B, descanso)
      if (diasAtras % 7 !== 0) { // descansa 1 dia na semana
        const tData = new Date(hoje.getTime() - diasAtras * 24 * 60 * 60 * 1000);
        const tIso = tData.toISOString().split('T')[0];
        const isA = diasAtras % 2 === 0;
        
        await concSheet.addRow({
          id: uuidv4(),
          user_id: newId,
          treino_id: isA ? treinoIdA : treinoIdB,
          data_conclusao: tIso,
          duracao_minutos: Math.floor(Math.random() * 20) + 50, // 50 a 70 mins
          volume_carga_kg: Math.floor(Math.random() * 2000) + 5000 // 5k a 7k kg
        });
      }
      diasAtras--;
    }
    
    // Treino finalizado "hoje"
    await concSheet.addRow({
      id: uuidv4(),
      user_id: newId,
      treino_id: treinoIdA,
      data_conclusao: hoje.toISOString().split('T')[0],
      duracao_minutos: 65,
      volume_carga_kg: 6200
    });

    // 6. Financeiro: Assinatura e Pagamentos
    const assSheet = await getSheet('assinaturas', ['id', 'user_id', 'plano_id', 'asaas_customer_id', 'valor_personalizado', 'dia_vencimento', 'status', 'data_inicio', 'data_criacao']);
    const assId = uuidv4();
    await assSheet.addRow({
      id: assId,
      user_id: newId,
      plano_id: 'plano-basico', // fallback genérico
      asaas_customer_id: '',
      valor_personalizado: '39.90',
      dia_vencimento: hoje.getDate().toString(),
      status: 'ATIVA',
      data_inicio: new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 meses atrás
      data_criacao: dataCriacaoIso
    });

    const mensalSheet = await getSheet('mensalidades', ['id', 'user_id', 'asaas_payment_id', 'valor', 'data_vencimento', 'data_pagamento', 'status', 'forma_pagamento', 'referencia', 'pix_qrcode', 'pix_copia_cola', 'observacao', 'data_criacao']);
    
    // Mês passado pago
    await mensalSheet.addRow({
      id: uuidv4(),
      user_id: newId,
      asaas_payment_id: '',
      valor: '39.90',
      data_vencimento: new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_pagamento: new Date(hoje.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'PAGA',
      forma_pagamento: 'PIX',
      referencia: 'DEMO-123',
      pix_qrcode: '',
      pix_copia_cola: '',
      observacao: 'Mensalidade paga',
      data_criacao: dataCriacaoIso
    });

    // Mês atual pendente (vence daqui a 5 dias)
    await mensalSheet.addRow({
      id: uuidv4(),
      user_id: newId,
      asaas_payment_id: '',
      valor: '39.90',
      data_vencimento: new Date(hoje.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_pagamento: '',
      status: 'PENDENTE',
      forma_pagamento: 'PIX_MANUAL',
      referencia: 'DEMO-PENDING',
      pix_qrcode: 'qrcodemock',
      pix_copia_cola: '00020101021126580014br.gov.bcb.pix...',
      observacao: 'Fatura de demonstração',
      data_criacao: dataCriacaoIso
    });

    // 7. Solicitação de Ajuste de Treino Pendente
    const solSheet = await getSheet('solicitacoes', ['id', 'aluno_id', 'aluno_nome', 'tipo', 'mensagem', 'status', 'data_criacao', 'data_resolucao', 'observacao_admin']);
    await solSheet.addRow({
      id: uuidv4(),
      aluno_id: newId,
      aluno_nome: DEMO_NAME,
      tipo: 'AJUSTE',
      mensagem: 'Mestre, sinto um leve desconforto no ombro durante a Elevação Lateral. Podemos trocar esse exercício?',
      status: 'PENDENTE',
      data_criacao: dataCriacaoPtBr,
      data_resolucao: '',
      observacao_admin: ''
    });

    // Invalida todos os caches modificados
    invalidateCache('usuarios');
    invalidateCache('anamnese');
    invalidateCache('treinos');
    invalidateCache('exercicios_treino');
    invalidateCache('treinos_concluidos');
    invalidateCache('assinaturas');
    invalidateCache('mensalidades');
    invalidateCache('solicitacoes');

    console.log('[DEMO] Ambiente restaurado com sucesso!');
    res.json({ success: true, message: 'Usuário de demonstração resetado com sucesso!' });
  } catch (error) {
    console.error('[DEMO] Erro ao resetar ambiente:', error);
    res.status(500).json({ error: 'Falha ao restaurar o ambiente de demonstração.', details: error.message });
  }
});

module.exports = router;
