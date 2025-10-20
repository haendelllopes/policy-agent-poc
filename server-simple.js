const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Endpoint de teste simples
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Teste de deploy funcionando!',
    database: 'PostgreSQL configurado',
    timeouts: 'Otimizados'
  });
});

// Catch-all para outras rotas
app.get('*', (req, res) => {
  res.json({
    message: 'Flowly API está funcionando!',
    endpoints: [
      '/api/health',
      '/api/test'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
