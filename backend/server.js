const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// --- CORS Configuration ---
// Em produção, aceita apenas o domínio do frontend na Vercel.
// Em desenvolvimento, aceita localhost.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
];

// Adiciona a URL de produção do frontend se definida
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sem origin (ex: mobile apps, Postman, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || origin === allowed)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// --- Health Check ---
// Endpoint para verificar se o backend está ativo (usado pelo Render para manter o serviço)
app.use('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- Rotas ---
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const exerciseRoutes = require('./routes/exercises');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const dashboardRoutes = require('./routes/dashboard');
const solicitacoesRoutes = require('./routes/solicitacoes');

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Corpo Conectado Backend rodando na porta ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
