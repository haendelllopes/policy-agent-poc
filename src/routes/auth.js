const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

/**
 * POST /api/auth/login
 * Login simples com email (sem senha por enquanto)
 */
router.post('/login', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar usuário por email
    const result = await query(`
      SELECT 
        u.id, u.name, u.email, u.role,
        u.position_id, u.department_id,
        p.name as position_name,
        d.name as department_name,
        u.onboarding_status, u.pontuacao_total
      FROM users u
      LEFT JOIN positions p ON u.position_id = p.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.email = $1 AND u.tenant_id = $2 AND u.status = 'active'
    `, [email.toLowerCase().trim(), tenant.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado ou inativo' });
    }

    const user = result.rows[0];

    // Criar "sessão" simples (retornar dados do usuário)
    // Em produção, você usaria JWT ou express-session
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        position_name: user.position_name,
        department_name: user.department_name,
        onboarding_status: user.onboarding_status,
        pontuacao_total: user.pontuacao_total
      },
      redirect: user.role === 'admin' ? '/dashboard.html' : `/colaborador-trilhas?colaborador_id=${user.id}`,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/auth/me
 * Buscar dados do usuário logado (se houver sessão)
 */
router.get('/me', async (req, res) => {
  try {
    // Por enquanto, retorna erro (implementar quando tiver sessão real)
    res.status(401).json({ error: 'Não autenticado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;





