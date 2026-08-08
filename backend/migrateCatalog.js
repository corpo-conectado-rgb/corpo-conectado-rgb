const { getCachedRows, getSheet } = require('./services/googleSheets');
require('dotenv').config();

async function run() {
  try {
    console.log('Criando aba catalogo_exercicios...');
    const catalogSheet = await getSheet('catalogo_exercicios', ['codigo', 'nome', 'link_video']);
    
    console.log('Lendo exercicios existentes...');
    const exerciciosRows = await getCachedRows('exercicios');
    
    // Deduplicate by name (case insensitive, trimmed)
    const uniqueExercisesMap = new Map();
    
    for (const row of exerciciosRows) {
      const rawName = row.get('nome');
      if (!rawName) continue;
      
      const cleanName = rawName.trim();
      const lowerName = cleanName.toLowerCase();
      
      if (!uniqueExercisesMap.has(lowerName)) {
        // Keep the first correctly cased name and the link_video
        uniqueExercisesMap.set(lowerName, {
          nome: cleanName,
          link_video: row.get('link_video') || ''
        });
      } else {
        // If it already exists, but current row has a video, prefer it
        const existing = uniqueExercisesMap.get(lowerName);
        if (!existing.link_video && row.get('link_video')) {
          existing.link_video = row.get('link_video');
        }
      }
    }

    const uniqueExercises = Array.from(uniqueExercisesMap.values());
    console.log(`Encontrados ${uniqueExercises.length} exercicios unicos. Inserindo no catalogo...`);

    // Get current catalog to avoid inserting duplicates if rerun
    const catalogRows = await getCachedRows('catalogo_exercicios');
    const existingCatalogNames = new Set(catalogRows.map(r => r.get('nome').trim().toLowerCase()));

    let nextCode = catalogRows.length > 0 
      ? Math.max(...catalogRows.map(r => parseInt(r.get('codigo') || 0))) + 1 
      : 1;

    for (const ex of uniqueExercises) {
      if (!existingCatalogNames.has(ex.nome.toLowerCase())) {
        await catalogSheet.addRow({
          codigo: String(nextCode),
          nome: ex.nome,
          link_video: ex.link_video
        });
        console.log(`Inserido: ${ex.nome} (Cod: ${nextCode})`);
        nextCode++;
        // Small delay to prevent rate limit
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    console.log('Migracao concluida com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
  }
}

run();
