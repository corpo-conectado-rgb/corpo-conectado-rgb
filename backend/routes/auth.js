const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getSheet, getCachedRows, invalidateCache } = require('../services/googleSheets');
const authMiddleware = require('../middlewares/authMiddleware');

const USERS_SHEET = 'usuarios';
const ANAMNESE_SHEET = 'anamnese';
const HEADERS = ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role'];
const ANAMNESE_HEADERS = ['id_usuario', 'idade', 'altura', 'peso', 'sexo', 'objetivo', 'nivel_fisico', 'lesoes_criticas', 'habitos_freq', 'habitos_tempo', 'habitos_local'];

// Função Helper para buscar dados completos de anamnese e impedir repetição de código
async function fetchCompleteProfile(userRowId) {
  let profileData = {};
  try {
    const anamneseRows = await getCachedRows('anamnese', ANAMNESE_HEADERS);
    const anamneseRow = anamneseRows.find(r => r.get('id_usuario') === userRowId);
    
    if (anamneseRow) {
      profileData = {
        idade: anamneseRow.get('idade'),
        altura: anamneseRow.get('altura'),
        peso: anamneseRow.get('peso'),
        sexo: anamneseRow.get('sexo'),
        objetivo: anamneseRow.get('objetivo'),
        nivel_fisico: anamneseRow.get('nivel_fisico'),
        lesoes_criticas: anamneseRow.get('lesoes_criticas'),
        habitos_freq: anamneseRow.get('habitos_freq'),
        habitos_tempo: anamneseRow.get('habitos_tempo'),
        habitos_local: anamneseRow.get('habitos_local'),
      };
    }
  } catch (err) {
    console.log('Sem dados de anamnese encontrados para o usuário falha silenciosa.');
  }
  return profileData;
}

// Rota Simples de Registro MANTIDA por retrocompatibilidade (se precisar)
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const sheet = await getSheet(USERS_SHEET, HEADERS);
    const rows = await getCachedRows(USERS_SHEET, HEADERS);

    const userExists = rows.find(r => r.get('email') === email);
    if (userExists) return res.status(400).json({ message: 'Usuário já existe' });

    const senha_hash = await bcrypt.hash(senha, 10);
    const newId = uuidv4();
    
    await sheet.addRow({
      id: newId,
      nome,
      email,
      senha_hash,
      data_criacao: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      role: 'user'
    });

    invalidateCache(USERS_SHEET);
    const token = jwt.sign({ id: newId, role: 'user' }, process.env.JWT_SECRET || 'secret_super_seguro_para_desenvolvimento', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: newId, nome, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// A Nova Super-Rota de Onboarding Completo (Relacional)
router.post('/register-full', async (req, res) => {
  try {
    const { 
      nome, email, senha, 
      idade, altura, peso, sexo, 
      objetivo, nivel, lesoes, 
      habitos_freq, habitos_tempo, habitos_local 
    } = req.body;

    const userSheet = await getSheet(USERS_SHEET, HEADERS);
    const userRows = await getCachedRows(USERS_SHEET, HEADERS);
    const userExists = userRows.find(r => r.get('email') === email);
    
    if (userExists) {
      return res.status(400).json({ message: 'E-mail já está em uso na plataforma.' });
    }

    const senha_hash = await bcrypt.hash(senha, 10);
    const newId = uuidv4();
    
    await userSheet.addRow({
      id: newId,
      nome,
      email,
      senha_hash,
      data_criacao: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      role: 'user'
    });

    invalidateCache(USERS_SHEET);
    const anamneseSheet = await getSheet(ANAMNESE_SHEET, ANAMNESE_HEADERS);
    await anamneseSheet.addRow({
      id_usuario: newId,
      idade: idade || '',
      altura: altura || '',
      peso: peso || '',
      sexo: sexo || '',
      objetivo: objetivo || '',
      nivel_fisico: nivel || '',
      lesoes_criticas: lesoes || '',
      habitos_freq: habitos_freq || '',
      habitos_tempo: habitos_tempo || '',
      habitos_local: habitos_local || ''
    });

    invalidateCache(ANAMNESE_SHEET);
    const token = jwt.sign({ id: newId, role: 'user' }, process.env.JWT_SECRET || 'secret_super_seguro_para_desenvolvimento', { expiresIn: '7d' });
    
    // Retorna o pacote FULL ja populado
    res.status(201).json({ 
      token, 
      user: { 
        id: newId, nome, email, role: 'user',
        idade, altura, peso, sexo,
        objetivo, nivel_fisico: nivel,
        lesoes_criticas: lesoes,
        habitos_freq, habitos_tempo, habitos_local
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const rows = await getCachedRows(USERS_SHEET, HEADERS);
    
    const userRow = rows.find(r => r.get('email') === email);
    if (!userRow) return res.status(401).json({ message: 'E-mail não cadastrado. Verifique a digitação ou crie uma conta.' });

    const valid = await bcrypt.compare(senha, userRow.get('senha_hash'));
    if (!valid) return res.status(401).json({ message: 'Senha incorreta. Tente novamente.' });

    const userId = userRow.get('id');
    const role = userRow.get('role') || 'user';
    const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'secret_super_seguro_para_desenvolvimento', { expiresIn: '7d' });
    
    const profileData = await fetchCompleteProfile(userId);

    res.json({ 
      token, 
      user: { 
        id: userId, 
        nome: userRow.get('nome'), 
        email: userRow.get('email'),
        role,
        ...profileData 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const rows = await getCachedRows(USERS_SHEET, HEADERS);
    
    const userRow = rows.find(r => r.get('id') === req.user.id);
    if (!userRow) return res.status(404).json({ message: 'Usuário principal não encontrado' });
    
    const profileData = await fetchCompleteProfile(userRow.get('id'));

    res.json({
      id: userRow.get('id'),
      nome: userRow.get('nome'),
      email: userRow.get('email'),
      role: userRow.get('role') || 'user',
      ...profileData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
