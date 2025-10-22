const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'seu-jwt-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware para verificar se o usuário é admin
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

/**
 * Middleware para verificar secret de cron jobs
 */
const verifyCronSecret = (req, res, next) => {
  const cronSecret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET || 'cron-secret-default';

  if (!cronSecret || cronSecret !== expectedSecret) {
    return res.status(401).json({ message: 'Cron secret inválido' });
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeAdmin,
  verifyCronSecret
};

