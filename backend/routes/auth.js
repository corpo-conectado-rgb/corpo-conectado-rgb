const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getSheet, getCachedRows, invalidateCache } = require('../services/googleSheets');
const authMiddleware = require('../middlewares/authMiddleware');
const { calcularIdade } = require('../utils/dateUtils');

const USERS_SHEET = 'usuarios';
const ANAMNESE_SHEET = 'anamnese';
const HEADERS = ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role'];
const ANAMNESE_HEADERS = ['id_usuario', 'idade', 'altura', 'peso', 'sexo', 'objetivo', 'nivel_fisico', 'lesoes_criticas', 'habitos_freq', 'habitos_tempo', 'habitos_local', 'data_nascimento', 'telefone'];
const DISPOSITIVOS_SHEET = 'dispositivos';
const DISPOSITIVOS_HEADERS = ['id', 'user_id', 'user_nome', 'user_email', 'device_id', 'device_name', 'codigo_ativacao', 'status', 'data_solicitacao', 'data_autorizacao'];
const CONFIG_SHEET = 'configuracoes';
const CONFIG_HEADERS = ['chave', 'valor'];

// Função Helper para buscar dados completos de anamnese e impedir repetição de código
async function fetchCompleteProfile(userRowId) {
  let profileData = {};
  try {
    const anamneseRows = await getCachedRows('anamnese', ANAMNESE_HEADERS);
    const anamneseRow = anamneseRows.find(r => r.get('id_usuario') === userRowId);
    
    if (anamneseRow) {
      const dataNascimento = anamneseRow.get('data_nascimento');
      const idadeFixa = anamneseRow.get('idade');
      
      profileData = {
        data_nascimento: dataNascimento,
        idade: dataNascimento ? calcularIdade(dataNascimento) : idadeFixa,
        altura: anamneseRow.get('altura'),
        peso: anamneseRow.get('peso'),
        sexo: anamneseRow.get('sexo'),
        objetivo: anamneseRow.get('objetivo'),
        nivel_fisico: anamneseRow.get('nivel_fisico'),
        lesoes_criticas: anamneseRow.get('lesoes_criticas'),
        habitos_freq: anamneseRow.get('habitos_freq'),
        habitos_tempo: anamneseRow.get('habitos_tempo'),
        habitos_local: anamneseRow.get('habitos_local'),
        telefone: anamneseRow.get('telefone') || '',
      };
    }
  } catch (err) {
    console.log('Sem dados de anamnese encontrados para o usuário falha silenciosa.');
  }
  return profileData;
}

function generateActivationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

async function isDeviceActivationRequired() {
  try {
    const configRows = await getCachedRows(CONFIG_SHEET, CONFIG_HEADERS);
    const row = configRows.find(r => r.get('chave') === 'REQUIRE_DEVICE_ACTIVATION');
    return row && row.get('valor') === 'true';
  } catch {
    return false;
  }
}

// Rota Simples de Registro MANTIDA por retrocompatibilidade (se precisar)
router.post('/register', async (req, res) => {
  try {
    let { nome, email, senha } = req.body;
    email = (email || '').toLowerCase().trim();
    const sheet = await getSheet(USERS_SHEET, HEADERS);
    const rows = await getCachedRows(USERS_SHEET, HEADERS);

    const userExists = rows.find(r => (r.get('email') || '').toLowerCase().trim() === email);
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
    
    res.status(201).json({ message: 'Usuário registrado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// A Nova Super-Rota de Onboarding Completo (Relacional)
router.post('/register-full', async (req, res) => {
  try {
    let { 
      nome, email, senha, 
      data_nascimento, altura, peso, sexo, 
      objetivo, nivel, lesoes, 
      habitos_freq, habitos_tempo, habitos_local 
    } = req.body;

    email = (email || '').toLowerCase().trim();

    const idade = data_nascimento ? calcularIdade(data_nascimento) : '';

    const userSheet = await getSheet(USERS_SHEET, HEADERS);
    const userRows = await getCachedRows(USERS_SHEET, HEADERS);
    const userExists = userRows.find(r => (r.get('email') || '').toLowerCase().trim() === email);
    
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
      habitos_local: habitos_local || '',
      data_nascimento: data_nascimento || ''
    });

    invalidateCache(ANAMNESE_SHEET);
    invalidateCache(ANAMNESE_SHEET);
    
    res.status(201).json({ message: 'Conta criada com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, senha } = req.body;
    email = (email || '').toLowerCase().trim();
    const rows = await getCachedRows(USERS_SHEET, HEADERS);
    
    const userRow = rows.find(r => (r.get('email') || '').toLowerCase().trim() === email);
    if (!userRow) return res.status(401).json({ message: 'E-mail não cadastrado. Verifique a digitação ou crie uma conta.' });

    const valid = await bcrypt.compare(senha, userRow.get('senha_hash'));
    if (!valid) return res.status(401).json({ message: 'Senha incorreta. Tente novamente.' });

    const userId = userRow.get('id');
    const role = userRow.get('role') || 'user';

    // --- Device Activation Check ---
    const deviceId = req.body.deviceId;
    const deviceName = req.body.deviceName || 'Navegador desconhecido';
    
    if (await isDeviceActivationRequired() && role !== 'admin') {
      if (deviceId) {
        const dispRows = await getCachedRows(DISPOSITIVOS_SHEET, DISPOSITIVOS_HEADERS);
        const existingDevice = dispRows.find(r => r.get('user_id') === userId && r.get('device_id') === deviceId);
        
        if (existingDevice) {
          const status = existingDevice.get('status');
          if (status === 'RECUSADO') {
            return res.status(403).json({ 
              requiresActivation: true, 
              activationDenied: true,
              message: 'Este dispositivo foi recusado pelo administrador.' 
            });
          }
          if (status === 'PENDENTE') {
            return res.status(403).json({ 
              requiresActivation: true, 
              activationCode: existingDevice.get('codigo_ativacao'),
              message: 'Aguardando aprovação do administrador.' 
            });
          }
          // status === 'AUTORIZADO' -> continue login normally
        } else {
          // New device - create activation request
          const codigo = generateActivationCode();
          const dispSheet = await getSheet(DISPOSITIVOS_SHEET, DISPOSITIVOS_HEADERS);
          await dispSheet.addRow({
            id: uuidv4(),
            user_id: userId,
            user_nome: userRow.get('nome'),
            user_email: userRow.get('email'),
            device_id: deviceId,
            device_name: deviceName,
            codigo_ativacao: codigo,
            status: 'PENDENTE',
            data_solicitacao: new Date().toISOString(),
            data_autorizacao: ''
          });
          invalidateCache(DISPOSITIVOS_SHEET);
          
          return res.status(403).json({ 
            requiresActivation: true, 
            activationCode: codigo,
            message: 'Dispositivo não reconhecido. Informe o código ao administrador.' 
          });
        }
      } else {
        // No deviceId sent - generate one for legacy clients
        return res.status(403).json({ 
          requiresActivation: true, 
          message: 'Atualização necessária. Recarregue a página.' 
        });
      }
    }
    // --- End Device Activation Check ---

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

// POST /login/status-aparelho - Aluno verifica se seu dispositivo foi aprovado
router.post('/login/status-aparelho', async (req, res) => {
  try {
    let { email, senha, deviceId } = req.body;
    email = (email || '').toLowerCase().trim();
    
    if (!email || !senha || !deviceId) {
      return res.status(400).json({ message: 'Dados incompletos.' });
    }
    
    // Re-validate credentials
    const rows = await getCachedRows(USERS_SHEET, HEADERS);
    const userRow = rows.find(r => (r.get('email') || '').toLowerCase().trim() === email);
    if (!userRow) return res.status(401).json({ message: 'Credenciais inválidas.' });
    
    const valid = await bcrypt.compare(senha, userRow.get('senha_hash'));
    if (!valid) return res.status(401).json({ message: 'Credenciais inválidas.' });
    
    const userId = userRow.get('id');
    const dispRows = await getCachedRows(DISPOSITIVOS_SHEET, DISPOSITIVOS_HEADERS);
    const device = dispRows.find(r => r.get('user_id') === userId && r.get('device_id') === deviceId);
    
    if (!device) {
      return res.status(404).json({ approved: false, message: 'Dispositivo não encontrado.' });
    }
    
    const status = device.get('status');
    
    if (status === 'AUTORIZADO') {
      const role = userRow.get('role') || 'user';
      const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'secret_super_seguro_para_desenvolvimento', { expiresIn: '7d' });
      const profileData = await fetchCompleteProfile(userId);
      
      return res.json({ 
        approved: true, 
        token, 
        user: { 
          id: userId, 
          nome: userRow.get('nome'), 
          email: userRow.get('email'),
          role,
          ...profileData 
        } 
      });
    }
    
    if (status === 'RECUSADO') {
      return res.json({ approved: false, denied: true, message: 'Dispositivo recusado pelo administrador.' });
    }
    
    // Still PENDENTE
    return res.json({ approved: false, message: 'Aguardando aprovação.' });
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

// PUT /profile - Aluno atualiza campos de edição direta (telefone e local de treino)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { telefone, habitos_local, nome } = req.body;

    // Campos controlados que NÃO podem ser alterados diretamente
    const camposControlados = ['peso', 'altura', 'objetivo', 'nivel_fisico', 'habitos_freq', 'lesoes_criticas', 'sexo', 'data_nascimento', 'idade'];
    const tentouAlterarControlado = camposControlados.some(campo => req.body[campo] !== undefined);
    if (tentouAlterarControlado) {
      return res.status(403).json({ error: 'Campos controlados só podem ser alterados via solicitação ao administrador.' });
    }

    const anamneseSheet = await getSheet(ANAMNESE_SHEET, ANAMNESE_HEADERS);
    const anamneseRows = await anamneseSheet.getRows();
    const anamneseRow = anamneseRows.find(r => r.get('id_usuario') === userId);

    if (!anamneseRow) {
      return res.status(404).json({ error: 'Perfil de anamnese não encontrado.' });
    }

    // Atualizar campos diretos na anamnese
    if (telefone !== undefined) anamneseRow.set('telefone', telefone.trim());
    if (habitos_local !== undefined) anamneseRow.set('habitos_local', habitos_local.trim());
    await anamneseRow.save();
    invalidateCache(ANAMNESE_SHEET);

    // Se o nome foi alterado, atualizar também na tabela de usuários
    // NOTA: Nome requer aprovação, mas mantemos a lógica aqui para uso interno pelo admin
    // O frontend NÃO enviará 'nome' diretamente — isso só será usado pelo fluxo de aprovação

    // Retornar perfil atualizado
    const profileData = await fetchCompleteProfile(userId);
    const userRows = await getCachedRows(USERS_SHEET, HEADERS);
    const userRow = userRows.find(r => r.get('id') === userId);

    res.json({
      id: userId,
      nome: userRow?.get('nome'),
      email: userRow?.get('email'),
      role: userRow?.get('role') || 'user',
      ...profileData
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

module.exports = router;
