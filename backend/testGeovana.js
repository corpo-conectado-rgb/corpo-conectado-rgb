const express = require('express');
const { getDoc, getSheet } = require('./services/googleSheets');
require('dotenv').config();

async function testBuilder(id) {
    try {
        const treinosSheet = await getSheet('treinos', []);
        const treinosRows = await treinosSheet.getRows();
        const activeTreino = treinosRows.find(
          r => r.get('user_id') === id && (r.get('status') === 'ativo' || r.get('status') === 'ativa')
        );

        if (!activeTreino) {
          console.log("null"); return;
        }

        const treinoId = activeTreino.get('id');
        const diasSheet = await getSheet('dias_treino', []);
        const diasRows = await diasSheet.getRows();
        const diasParaTreino = diasRows.filter(r => r.get('treino_id') === treinoId);

        const exerciciosSheet = await getSheet('exercicios', []);
        const exerciciosRows = await exerciciosSheet.getRows();

        const diasMapeados = diasParaTreino.map(dia => {
          const diaId = dia.get('id');
          const exsOfDia = exerciciosRows.filter(r => r.get('dia_treino_id') === diaId);

          return {
            letra_dia: dia.get('letra_dia'),
            foco_muscular: dia.get('foco_muscular') || '',
            exercicios: exsOfDia.map(ex => ({
              nome: ex.get('nome') || '',
              series: ex.get('series') || 3,
              repeticoes: ex.get('repeticoes') || '10-12',
              descanso: ex.get('descanso') || 60,
              carga: ex.get('carga') || '',
              observacoes: ex.get('observacoes') || ''
            }))
          };
        });

        const res = {
          nome_ficha: activeTreino.get('nome_ficha') || '',
          tipo_divisao: activeTreino.get('tipo_divisao') || 'A/B/C',
          objetivo: activeTreino.get('objetivo') || '',
          duracao_dias: activeTreino.get('duracao_dias') || '',
          data_termino: activeTreino.get('data_termino') || '',
          dias: diasMapeados
        };
        console.log(JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("ERRO BUILDER:", e);
    }
}

async function testUsuario(id) {
    try {
        const usersSheet = await getSheet('usuarios', []);
        const row = (await usersSheet.getRows()).find(r => r.get('id') === id);
        if (!row) { console.log('Atleta não encontrado'); return; }

        const baseUser = { id: row.get('id'), nome: row.get('nome'), email: row.get('email') };
        
        // fetchFullUser
        let userDetails = { ...baseUser };
        const anamneseSheet = await getSheet('anamnese', []);
        const rows = await anamneseSheet.getRows();
        const aRow = rows.find(r => r.get('id_usuario') === id);
        if (aRow) {
          userDetails.idade = aRow.get('idade');
          // ...
        }
        console.log("USUARIO:", JSON.stringify(userDetails));
    } catch(e) {
        console.error("ERRO USUARIO:", e);
    }
}

testBuilder('401396f3-0523-4a04-be5d-48f037075009').then(() => testUsuario('401396f3-0523-4a04-be5d-48f037075009')).then(()=>process.exit(0));
