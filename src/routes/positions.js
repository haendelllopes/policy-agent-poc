const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

/**
 * GET /api/positions
 * Listar cargos do tenant
 */
router.get('/', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT id, name, description, created_at
      FROM positions
      WHERE tenant_id = $1
      ORDER BY name
    `, [tenant.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar cargos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/positions/:id
 * Buscar cargo específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const positionId = req.params.id;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT id, name, description, created_at
      FROM positions
      WHERE id = $1 AND tenant_id = $2
    `, [positionId, tenant.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;



