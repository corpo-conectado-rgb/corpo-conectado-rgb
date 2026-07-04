const { getSheet, getDoc } = require('./services/googleSheets');

async function setup() {
  try {
    console.log("Conectando ao Google Sheets e inicializando...");
    await getDoc();

    console.log("Verificando aba 'usuarios'...");
    await getSheet('usuarios', ['id', 'nome', 'email', 'senha_hash', 'data_criacao']);
    
    console.log("Verificando aba 'treinos'...");
    await getSheet('treinos', ['id', 'user_id', 'status', 'data_inicio', 'data_fim']);

    console.log("Verificando aba 'exercicios'...");
    await getSheet('exercicios', ['id', 'treino_id', 'nome_exercicio', 'grupo_muscular', 'dia_treino', 'series', 'repeticoes', 'link_video', 'observacoes']);

    console.log("Verificando abas do Financeiro...");
    await getSheet('planos', ['id', 'nome', 'valor', 'ativo', 'data_criacao']);
    await getSheet('assinatura_alunos', ['id', 'user_id', 'plano_id', 'asaas_customer_id', 'valor_personalizado', 'dia_vencimento', 'status', 'data_inicio', 'data_criacao']);
    await getSheet('mensalidades', ['id', 'user_id', 'asaas_payment_id', 'valor', 'data_vencimento', 'data_pagamento', 'status', 'forma_pagamento', 'referencia', 'pix_qrcode', 'pix_copia_cola', 'observacao', 'data_criacao']);


    console.log("\n✅ Tudo pronto! Acesse a sua planilha no Google Drive para comprovar. As abas e colunas foram configuradas com sucesso.");
    process.exit(0);
  } catch (error) {
    console.error("Erro durante a configuração:", error);
    process.exit(1);
  }
}

setup();
