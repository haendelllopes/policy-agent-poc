const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const { query } = require('../db-pg');

// Helper functions (você vai precisar importar ou mover)
// Assumindo que estão disponíveis no contexto ou serão importadas

// Middleware para extrair tenant (será passado pelo server.js)
// req.tenantSubdomain já estará disponível

/**
 * GET /api/users
 * Listar todos os usuários do tenant
 */
router.get('/', async (req, res) => {
  try {
    const { getTenantBySubdomain, getCachedData, getDemoData, usePostgres } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    try {
      const users = await getCachedData(tenant.id, 'users', async () => {
        if (await usePostgres()) {
          // PostgreSQL com JOIN para pegar nomes de cargo e departamento
          const result = await query(`
            SELECT 
              u.id, u.name, u.email, u.phone, 
              u.position, u.department, 
              u.position_id, u.department_id,
              p.name as position_name,
              d.name as department_name,
              u.status, u.start_date,
              u.onboarding_status, u.onboarding_inicio, u.onboarding_fim,
              u.pontuacao_total,
              u.created_at, u.updated_at
            FROM users u
            LEFT JOIN positions p ON u.position_id = p.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.tenant_id = $1 
            ORDER BY u.name
          `, [tenant.id]);
          return result.rows;
        } else {
          // Demo data fallback
          const demoData = getDemoData();
          return demoData.users.filter(user => user.tenant_id === tenant.id);
        }
      });
      res.json(users);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      // Fallback para dados demo em caso de erro
      const demoData = getDemoData();
      const users = demoData.users.filter(user => user.tenant_id === tenant.id);
      res.json(users);
    }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

/**
 * GET /api/users/:id
 * Buscar usuário específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { getTenantBySubdomain, usePostgres, openDatabase, runQuery, closeDatabase } = req.app.locals;
    const userId = req.params.id;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    let user;
    if (await usePostgres()) {
      const result = await query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenant.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
      }
      user = result.rows[0];
    } else {
      const { db } = await openDatabase();
      try {
        const result = runQuery(db, 'SELECT * FROM users WHERE id = ? AND tenant_id = ?', [userId, tenant.id]);
        if (result.length === 0) {
          return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
        }
        user = result[0];
      } finally {
        closeDatabase(db);
      }
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      position: user.position,
      department: user.department,
      start_date: user.start_date,
      status: user.status || 'active',
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

/**
 * POST /api/users
 * Criar novo usuário
 */
router.post('/', async (req, res) => {
  try {
    const { getTenantBySubdomain, normalizePhone, normalizePhoneForWhatsApp, usePostgres, openDatabase, runQuery, runExec, persistDatabase } = req.app.locals;
    
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      position: z.string().optional(), // DEPRECATED: manter por compatibilidade
      department: z.string().optional(), // DEPRECATED: manter por compatibilidade
      position_id: z.string().uuid().optional(), // NOVO: usar FK
      department_id: z.string().uuid().optional(), // NOVO: usar FK
      start_date: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional()
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    const normalizedPhone = normalizePhone(parse.data.phone);
    const whatsappPhone = normalizePhoneForWhatsApp(parse.data.phone);

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    let userId;
    if (await usePostgres()) {
      const existing = await query('SELECT id FROM users WHERE tenant_id = $1 AND email = $2', [tenant.id, parse.data.email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
      }

      userId = uuidv4();
      const onboardingInicio = parse.data.start_date || new Date().toISOString().split('T')[0];
      
      await query(`
        INSERT INTO users (
          id, tenant_id, name, email, phone, 
          position, department, position_id, department_id,
          start_date, status, 
          onboarding_status, onboarding_inicio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        userId, tenant.id, parse.data.name, parse.data.email, normalizedPhone,
        parse.data.position || null, parse.data.department || null, 
        parse.data.position_id || null, parse.data.department_id || null,
        onboardingInicio, parse.data.status || 'active',
        'em_andamento', onboardingInicio
      ]);
    } else {
      const { db, SQL } = await openDatabase();
      try {
        const existing = runQuery(db, 'SELECT id FROM users WHERE tenant_id = ? AND email = ?', [tenant.id, parse.data.email]);
        if (existing.length > 0) {
          return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
        }

        userId = uuidv4();
        const onboardingInicio = parse.data.start_date || new Date().toISOString().split('T')[0];
        
        runExec(db, `INSERT INTO users (
          id, tenant_id, name, email, phone, 
          position, department, position_id, department_id,
          start_date, status,
          onboarding_status, onboarding_inicio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [userId, tenant.id, parse.data.name, parse.data.email, normalizedPhone, 
           parse.data.position || null, parse.data.department || null,
           parse.data.position_id || null, parse.data.department_id || null,
           onboardingInicio, parse.data.status || 'active',
           'em_andamento', onboardingInicio]);
        
        persistDatabase(SQL, db);
      } finally {
        db.close();
      }
    }

    // Disparar webhook para n8n
    try {
      let communicationType = null;
      if (await usePostgres()) {
        try {
          const commResult = await query('SELECT setting_value FROM tenant_settings WHERE tenant_id = $1 AND setting_key = $2', [tenant.id, 'communication_type']);
          if (commResult.rows.length > 0) {
            communicationType = commResult.rows[0].setting_value;
          }
        } catch (commError) {
          console.log('Aviso: não foi possível buscar tipo de comunicação:', commError.message);
        }
      }

      const webhookData = {
        type: 'user_created',
        tenantId: tenant.id,
        tenantName: tenant.name,
        userId: userId,
        name: parse.data.name,
        email: parse.data.email,
        phone: whatsappPhone,
        position: parse.data.position,
        department: parse.data.department,
        start_date: parse.data.start_date,
        communication_type: communicationType,
        created_at: new Date().toISOString()
      };
        
      await fetch('https://hndll.app.n8n.cloud/webhook/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
    } catch (webhookError) {
      console.error('Erro ao enviar webhook:', webhookError);
    }
    
    res.status(201).json({ 
      id: userId, 
      name: parse.data.name, 
      email: parse.data.email,
      phone: normalizedPhone,
      position: parse.data.position,
      department: parse.data.department,
      position_id: parse.data.position_id,
      department_id: parse.data.department_id,
      start_date: parse.data.start_date,
      status: parse.data.status || 'active',
      onboarding_status: 'em_andamento',
      tenant: tenant.name
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

/**
 * PUT /api/users/:id
 * Atualizar usuário
 */
router.put('/:id', async (req, res) => {
  try {
    const { getTenantBySubdomain, normalizePhone, usePostgres, openDatabase, runQuery, runExec, closeDatabase } = req.app.locals;
    const userId = req.params.id;
    
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      position: z.string().optional(),
      department: z.string().optional(),
      position_id: z.string().uuid().optional(),
      department_id: z.string().uuid().optional(),
      start_date: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional()
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    const normalizedPhone = normalizePhone(parse.data.phone);
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    if (await usePostgres()) {
      const existing = await query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenant.id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
      }

      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2 AND id != $3', [parse.data.email, tenant.id, userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
      }

      await query(`
        UPDATE users SET 
          name = $1, email = $2, phone = $3, 
          position = $4, department = $5, 
          position_id = $6, department_id = $7,
          start_date = $8, status = $9,
          updated_at = NOW()
        WHERE id = $10 AND tenant_id = $11
      `, [
        parse.data.name, parse.data.email, normalizedPhone, 
        parse.data.position || null, parse.data.department || null,
        parse.data.position_id || null, parse.data.department_id || null,
        parse.data.start_date || null, parse.data.status || 'active', 
        userId, tenant.id
      ]);
    } else {
      const { db } = await openDatabase();
      try {
        const existing = runQuery(db, 'SELECT id FROM users WHERE id = ? AND tenant_id = ?', [userId, tenant.id]);
        if (existing.length === 0) {
          return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
        }

        const emailCheck = runQuery(db, 'SELECT id FROM users WHERE email = ? AND tenant_id = ? AND id != ?', [parse.data.email, tenant.id, userId]);
        if (emailCheck.length > 0) {
          return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
        }

        runExec(db, `UPDATE users SET 
          name = ?, email = ?, phone = ?, 
          position = ?, department = ?, 
          position_id = ?, department_id = ?,
          start_date = ?, status = ?, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND tenant_id = ?`, 
          [parse.data.name, parse.data.email, normalizedPhone, 
           parse.data.position || null, parse.data.department || null,
           parse.data.position_id || null, parse.data.department_id || null,
           parse.data.start_date || null, parse.data.status || 'active', 
           userId, tenant.id]);
      } finally {
        closeDatabase(db);
      }
    }

    res.json({ 
      message: 'Usuário atualizado com sucesso',
      id: userId,
      name: parse.data.name, 
      email: parse.data.email,
      phone: normalizedPhone,
      position: parse.data.position,
      department: parse.data.department,
      position_id: parse.data.position_id,
      department_id: parse.data.department_id,
      start_date: parse.data.start_date,
      status: parse.data.status || 'active',
      tenant: tenant.name
    });
  } catch (error) {
    console.error('Erro ao editar usuário:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

/**
 * DELETE /api/users/:id
 * Deletar usuário
 */
router.delete('/:id', async (req, res) => {
  try {
    const { getTenantBySubdomain, usePostgres, openDatabase, runQuery, runExec, closeDatabase } = req.app.locals;
    const userId = req.params.id;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    if (await usePostgres()) {
      const existing = await query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenant.id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
      }

      await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenant.id]);
    } else {
      const { db } = await openDatabase();
      try {
        const existing = runQuery(db, 'SELECT id FROM users WHERE id = ? AND tenant_id = ?', [userId, tenant.id]);
        if (existing.length === 0) {
          return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
        }

        runExec(db, 'DELETE FROM users WHERE id = ? AND tenant_id = ?', [userId, tenant.id]);
      } finally {
        closeDatabase(db);
      }
    }

    res.json({ message: 'Usuário deletado com sucesso', id: userId });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

module.exports = router;


