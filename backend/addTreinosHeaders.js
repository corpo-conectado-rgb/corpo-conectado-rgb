const { getDoc } = require('./services/googleSheets');

async function updateHeaders() {
  try {
    const doc = await getDoc();
    const treinosSheet = Object.values(doc.sheetsByTitle).find(s => s.title.toLowerCase() === 'treinos');
    
    if (treinosSheet) {
      await treinosSheet.loadHeaderRow().catch(() => {});
      const headers = treinosSheet.headerValues || [];
      const requiredHeaders = ['id', 'user_id', 'nome_ficha', 'tipo_divisao', 'objetivo', 'duracao_dias', 'data_termino', 'status', 'created_at'];
      
      const newHeaders = [...headers];
      let updated = false;
      
      for (const h of requiredHeaders) {
        if (!newHeaders.includes(h)) {
          newHeaders.push(h);
          updated = true;
        }
      }
      
      if (updated) {
        await treinosSheet.setHeaderRow(newHeaders);
        console.log("Cabeçalhos da aba 'treinos' atualizados para:", newHeaders);
      } else {
        console.log("Os cabeçalhos já estavam atualizados:", headers);
      }
    } else {
      console.log("Aba 'treinos' não encontrada!");
    }
    process.exit(0);
  } catch (err) {
    console.error("Erro ao atualizar cabeçalhos:", err);
    process.exit(1);
  }
}

updateHeaders();
