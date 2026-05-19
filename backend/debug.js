const { getDoc, getSheet } = require('./services/googleSheets');

async function debug() {
  try {
    const doc = await getDoc();
    const sheets = Object.values(doc.sheetsByTitle);
    
    console.log("=== Sheets and Headers ===");
    for (const sheet of sheets) {
      await sheet.loadHeaderRow().catch(() => {});
      console.log(`${sheet.title}:`, sheet.headerValues);
    }
    
    console.log("\n=== Buscando Geovana ===");
    const usersSheet = await getSheet('usuarios', []);
    const users = await usersSheet.getRows();
    const geovana = users.find(u => u.get('nome').includes('Geovana'));
    if (!geovana) {
      console.log("Geovana não encontrada.");
      return;
    }
    
    const geovanaId = geovana.get('id');
    console.log("Geovana ID:", geovanaId);
    
    const anamneseSheet = await getSheet('anamnese', []);
    const anamneseRows = await anamneseSheet.getRows();
    const anamnese = anamneseRows.find(r => r.get('id_usuario') === geovanaId);
    console.log("Anamnese existe?", !!anamnese);
    
    const treinosSheet = await getSheet('treinos', []);
    const treinosRows = await treinosSheet.getRows();
    const activeTreino = treinosRows.find(
      r => r.get('user_id') === geovanaId && (r.get('status') === 'ativo' || r.get('status') === 'ativa')
    );
    console.log("Ficha ativa:", activeTreino ? activeTreino.get('nome_ficha') : 'nenhuma');
    
    if (activeTreino) {
      const diasSheet = await getSheet('dias_treino', []);
      const diasRows = await diasSheet.getRows();
      const diasParaTreino = diasRows.filter(r => r.get('treino_id') === activeTreino.get('id'));
      console.log(`Encontrados ${diasParaTreino.length} dias para o treino.`);
      
      const exerciciosSheet = await getSheet('exercicios', []);
      const exerciciosRows = await exerciciosSheet.getRows();
      
      for (const dia of diasParaTreino) {
        const exs = exerciciosRows.filter(r => r.get('dia_treino_id') === dia.get('id'));
        console.log(`Dia ${dia.get('letra_dia')}: ${exs.length} exercicios.`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
