const { getDoc } = require('./services/googleSheets');

async function fixExerciciosHeaders() {
  try {
    const doc = await getDoc();
    const sheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'exercicios');
    
    if (sheet) {
      await sheet.loadHeaderRow().catch(() => {});
      const headers = sheet.headerValues || [];
      const requiredHeaders = ['id', 'dia_treino_id', 'treino_id', 'ordem', 'nome', 'nome_exercicio', 'grupo_muscular', 'dia_treino', 'series', 'repeticoes', 'carga', 'descanso', 'link_video', 'observacoes'];
      
      const newHeaders = [...headers];
      let updated = false;
      
      for (const h of requiredHeaders) {
        if (!newHeaders.includes(h)) {
          newHeaders.push(h);
          updated = true;
        }
      }
      
      if (updated) {
        await sheet.setHeaderRow(newHeaders);
        console.log("Cabeçalhos da aba 'exercicios' atualizados para:", newHeaders);
      } else {
        console.log("Os cabeçalhos já estavam atualizados:", headers);
      }
    } else {
      console.log("Aba 'exercicios' não encontrada!");
    }
    process.exit(0);
  } catch (err) {
    console.error("Erro ao atualizar cabeçalhos:", err);
    process.exit(1);
  }
}

fixExerciciosHeaders();
