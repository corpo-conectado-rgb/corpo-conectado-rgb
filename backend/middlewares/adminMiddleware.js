const jwt = require('jsonwebtoken');
const { getSheet } = require('../services/googleSheets');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_super_seguro_para_desenvolvimento');
    
    // Quick role check if role is in JWT payload
    if (decoded.role === 'admin') {
      req.user = decoded;
      return next();
    }

    // Double check with DB in case JWT doesn't have role or was forged
    const usersSheet = await getSheet('usuarios', ['id', 'nome', 'email', 'senha_hash', 'data_criacao', 'role']);
    const userRows = await usersSheet.getRows();
    const userRow = userRows.find(r => r.get('id') === decoded.id);

    if (userRow && userRow.get('role') === 'admin') {
      req.user = { id: userRow.get('id'), role: 'admin' };
      next();
    } else {
      res.status(403).json({ message: 'Acesso bloqueado. Área reservada para administradores.' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Token inválido ou expirado.' });
  }
};
