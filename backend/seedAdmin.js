require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getDoc } = require('./services/googleSheets');

async function seedAdminAndResetDb() {
  try {
    console.log("🔥 INICIANDO RESET GERAL DO BANCO DE DADOS (GOOGLE SHEETS) 🔥");
    const doc = await getDoc();

    const tabsToCreate = {
      'usuarios': ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role'],
      'anamnese': ['id_usuario', 'idade', 'altura', 'peso', 'sexo', 'objetivo', 'nivel_fisico', 'lesoes_criticas', 'habitos_freq', 'habitos_tempo', 'habitos_local', 'data_nascimento', 'telefone'],
      'treinos': ['id', 'user_id', 'nome_ficha', 'tipo_divisao', 'objetivo', 'status', 'created_at'],
      'dias_treino': ['id', 'treino_id', 'letra_dia', 'foco_muscular'],
      'exercicios': ['id', 'dia_treino_id', 'ordem', 'nome', 'series', 'repeticoes', 'carga', 'descanso', 'observacoes'],
      'logs': ['id', 'usuario', 'acao', 'data']
    };

    // Build a case-insensitive map
    const existingSheetsLower = {};
    for (const title in doc.sheetsByTitle) {
      existingSheetsLower[title.toLowerCase()] = doc.sheetsByTitle[title];
    }

    // 1. CLEAR EXISTING SHEETS
    for (const [title, headers] of Object.entries(tabsToCreate)) {
      const sheet = existingSheetsLower[title];
      if (sheet) {
        console.log(`Limpando aba: ${sheet.title}`);
        await sheet.clear();
        await sheet.setHeaderRow(headers);
      } else {
        console.log(`Criando nova aba: ${title}`);
        await doc.addSheet({ title, headerValues: headers });
      }
    }

    // reload doc to get fresh references
    await doc.loadInfo();

    // 3. SEED THE DEFAULT ADMIN
    console.log("\n🌱 Semeando Administrador Mestre...");
    // Find the users sheet again
    const usersSheetTitle = Object.keys(doc.sheetsByTitle).find(t => t.toLowerCase() === 'usuarios');
    const userSheet = doc.sheetsByTitle[usersSheetTitle];
    
    const adminEmail = 'kevinhenrique10@gmail.com';
    const adminPassword = 'Kvbe1023@';
    const senha_hash = await bcrypt.hash(adminPassword, 10);
    const adminId = uuidv4();

    await userSheet.addRow({
      id: adminId,
      nome: 'Kevin Henrique (Admin)',
      email: adminEmail,
      senha_hash: senha_hash,
      data_criacao: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      role: 'admin'
    });

    console.log(`✅ Super Admin criado com sucesso!
      Email: ${adminEmail}
      Senha: ${adminPassword}
      Role: admin`);

    console.log("\n🎉 RESET E SEEDING COMPLETOS COM SUCESSO!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro catastrófico ao semear admin: ", error);
    process.exit(1);
  }
}

seedAdminAndResetDb();
