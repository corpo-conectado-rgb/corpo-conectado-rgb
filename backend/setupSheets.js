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

    console.log("\n✅ Tudo pronto! Acesse a sua planilha no Google Drive para comprovar. As abas e colunas foram configuradas com sucesso.");
    process.exit(0);
  } catch (error) {
    console.error("Erro durante a configuração:", error);
    process.exit(1);
  }
}

setup();
