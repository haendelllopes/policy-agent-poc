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
    const { getTenantBySubdomain, usePostgres } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    if (await usePostgres()) {
      // PostgreSQL com JOIN para pegar nomes de cargo e departamento
      // IMPORTANTE: Se houver FK (position_id/department_id), usa SOMENTE o nome da tabela relacionada
      // NUNCA usa campos legados quando há FK definida para evitar UUIDs
      const result = await query(`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.phone, 
          u.position_id, 
          u.department_id,
          u.gestor_id, 
          u.buddy_id,
          CASE 
            -- Se tem FK, usa SOMENTE o nome da tabela relacionada
            WHEN u.position_id IS NOT NULL THEN p.name
            -- Se não tem FK e o campo legado não é UUID, usa ele
            WHEN u.position IS NOT NULL AND NOT (u.position ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
            THEN u.position
            ELSE NULL
          END as position,
          CASE 
            -- Se tem FK, usa SOMENTE o nome da tabela relacionada
            WHEN u.department_id IS NOT NULL THEN d.name
            -- Se não tem FK e o campo legado não é UUID, usa ele
            WHEN u.department IS NOT NULL AND NOT (u.department ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
            THEN u.department
            ELSE NULL
          END as department,
          u.status, 
          u.start_date,
          u.onboarding_status, 
          u.onboarding_inicio, 
          u.onboarding_fim,
          u.pontuacao_total,
          u.created_at, 
          u.updated_at
        FROM users u
        LEFT JOIN positions p ON u.position_id = p.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.tenant_id = $1 
        ORDER BY u.name
      `, [tenant.id]);
      res.json(result.rows);
    } else {
      // SQLite fallback
      const { db } = await openDatabase();
      try {
        const result = runQuery(db, `
          SELECT 
            id, name, email, phone, 
            position, department, 
            position_id, department_id,
            gestor_id, buddy_id,
            status, start_date,
            onboarding_status, onboarding_inicio, onboarding_fim,
            pontuacao_total,
            created_at, updated_at
          FROM users 
          WHERE tenant_id = ? 
          ORDER BY name
        `, [tenant.id]);
        res.json(result);
      } finally {
        closeDatabase(db);
      }
    }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

/**
 * GET /api/users/list-for-select
 * Lista usuários ativos do tenant para popular selects (gestor/buddy)
 * Retorna apenas id, name, email - otimizado para dropdowns
 * IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflito
 */
router.get('/list-for-select', async (req, res) => {
  try {
    const { getTenantBySubdomain, usePostgres } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    if (await usePostgres()) {
      // PostgreSQL
      const result = await query(`
        SELECT id, name, email, status
        FROM users
        WHERE tenant_id = $1 AND status = 'active'
        ORDER BY name ASC
      `, [tenant.id]);
      console.log(`✅ Listados ${result.rows.length} usuários para selects`);
      res.json(result.rows);
    } else {
      // SQLite fallback
      const { db } = await openDatabase();
      try {
        const result = runQuery(db, `
          SELECT id, name, email, status
          FROM users
          WHERE tenant_id = ? AND status = 'active'
          ORDER BY name ASC
        `, [tenant.id]);
        console.log(`✅ Listados ${result.length} usuários para selects`);
        res.json(result);
      } finally {
        closeDatabase(db);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/users/:id
 * Buscar usuário específico
 * IMPORTANTE: Esta rota deve vir DEPOIS de rotas específicas como /list-for-select
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
      tenant_id: user.tenant_id, // Adicionar tenant_id ao retorno
      name: user.name,
      email: user.email,
      phone: user.phone,
      position: user.position,
      department: user.department,
      position_id: user.position_id,
      department_id: user.department_id,
      gestor_id: user.gestor_id,
      buddy_id: user.buddy_id,
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
    const { getTenantBySubdomain, normalizePhone, normalizePhoneForWhatsApp, addBrazilianNinthDigit, usePostgres, openDatabase, runQuery, runExec, persistDatabase } = req.app.locals;
    
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(10).max(15).regex(/^[\+\d\s\-\(\)]+$/, 'Telefone inválido'),
      position: z.string().optional(), // DEPRECATED: manter por compatibilidade
      department: z.string().optional(), // DEPRECATED: manter por compatibilidade
      position_id: z.string().uuid().optional(), // NOVO: usar FK
      department_id: z.string().uuid().optional(), // NOVO: usar FK
      gestor_id: z.string().uuid().optional().nullable().or(z.literal('')),
      buddy_id: z.string().uuid().optional().nullable().or(z.literal('')),
      start_date: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional()
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    // Debug: log dos dados recebidos no POST
    console.log('📥 Dados recebidos no POST /users:', parse.data);
    console.log('🎯 Gestor ID recebido:', parse.data.gestor_id, 'Tipo:', typeof parse.data.gestor_id);
    console.log('🎯 Buddy ID recebido:', parse.data.buddy_id, 'Tipo:', typeof parse.data.buddy_id);
    
    // Verificar se os campos estão sendo rejeitados pela validação
    if (parse.data.gestor_id === '') {
      console.log('⚠️ Gestor ID está vazio, convertendo para null');
      parse.data.gestor_id = null;
    }
    if (parse.data.buddy_id === '') {
      console.log('⚠️ Buddy ID está vazio, convertendo para null');
      parse.data.buddy_id = null;
    }

    // Normalizar telefone e adicionar 9º dígito brasileiro se necessário
    let phoneToSave = normalizePhoneForWhatsApp(parse.data.phone); // Remove formatação
    phoneToSave = addBrazilianNinthDigit(phoneToSave); // Adiciona 9 se necessário
    
    const normalizedPhone = normalizePhone(phoneToSave);
    const whatsappPhone = normalizePhoneForWhatsApp(phoneToSave);

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
      
      console.log('🔧 Executando INSERT para userId:', userId, 'tenantId:', tenant.id);
      console.log('🔧 Valores INSERT: gestor_id =', parse.data.gestor_id, 'buddy_id =', parse.data.buddy_id);
      
      const insertResult = await query(`
        INSERT INTO users (
          id, tenant_id, name, email, phone, 
          position, department, position_id, department_id,
          gestor_id, buddy_id, start_date, status, 
          onboarding_status, onboarding_inicio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, name, gestor_id, buddy_id
      `, [
        userId, tenant.id, parse.data.name, parse.data.email, normalizedPhone,
        parse.data.position || null, parse.data.department || null, 
        parse.data.position_id || null, parse.data.department_id || null,
        parse.data.gestor_id || null, parse.data.buddy_id || null,
        onboardingInicio, parse.data.status || 'active',
        'em_andamento', onboardingInicio
      ]);
      
      console.log('✅ INSERT executado. Resultado:', insertResult.rows[0]);
      
      // Verificar se realmente foi salvo
      const verificacao = await query(`
        SELECT id, name, gestor_id, buddy_id 
        FROM users 
        WHERE id = $1
      `, [userId]);
      console.log('🔍 Verificação pós-INSERT:', verificacao.rows[0]);
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
          gestor_id, buddy_id, start_date, status,
          onboarding_status, onboarding_inicio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [userId, tenant.id, parse.data.name, parse.data.email, normalizedPhone, 
           parse.data.position || null, parse.data.department || null,
           parse.data.position_id || null, parse.data.department_id || null,
           parse.data.gestor_id || null, parse.data.buddy_id || null,
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
      gestor_id: parse.data.gestor_id,
      buddy_id: parse.data.buddy_id,
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
      gestor_id: z.string().uuid().optional().nullable().or(z.literal('')),
      buddy_id: z.string().uuid().optional().nullable().or(z.literal('')),
      start_date: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional()
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    // Converter strings vazias para null
    if (parse.data.gestor_id === '') {
      parse.data.gestor_id = null;
    }
    if (parse.data.buddy_id === '') {
      parse.data.buddy_id = null;
    }

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

      // UPDATE simples e direto
      const result = await query(`
        UPDATE users SET 
          name = $1, email = $2, phone = $3, 
          position = $4, department = $5, 
          position_id = $6, department_id = $7,
          gestor_id = $8, buddy_id = $9,
          start_date = $10, status = $11,
          updated_at = NOW()
        WHERE id = $12 AND tenant_id = $13
        RETURNING id, name, gestor_id, buddy_id
      `, [
        parse.data.name, parse.data.email, normalizedPhone, 
        parse.data.position || null, parse.data.department || null,
        parse.data.position_id || null, parse.data.department_id || null,
        parse.data.gestor_id || null, parse.data.buddy_id || null,
        parse.data.start_date || null, parse.data.status || 'active',
        userId, tenant.id
      ]);

      console.log('✅ Usuário atualizado:', result.rows[0]);
    } else {
      // SQLite fallback
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
          gestor_id = ?, buddy_id = ?,
          start_date = ?, status = ?, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND tenant_id = ?`, 
          [parse.data.name, parse.data.email, normalizedPhone, 
           parse.data.position || null, parse.data.department || null,
           parse.data.position_id || null, parse.data.department_id || null,
           parse.data.gestor_id || null, parse.data.buddy_id || null,
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
      gestor_id: parse.data.gestor_id,
      buddy_id: parse.data.buddy_id,
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
    const { getTenantBySubdomain, usePostgres, openDatabase, runQuery, runExec, closeDatabase, invalidateCache } = req.app.locals;
    const userId = req.params.id;
    
    console.log('🔍 DELETE - userId recebido:', userId);
    console.log('🔍 DELETE - tenantSubdomain:', req.tenantSubdomain);
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      console.log('❌ DELETE - Tenant não encontrado');
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }
    
    console.log('🔍 DELETE - tenant encontrado:', tenant);

    if (await usePostgres()) {
      console.log('🗑️ DELETE - Usando PostgreSQL');
      console.log('🗑️ DELETE - userId:', userId, 'tenant.id:', tenant.id);
      
      // Log da query de verificação de usuário
      console.log('🔍 DELETE - Verificando se usuário existe...');
      const existing = await query('SELECT id, name, email FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenant.id]);
      console.log('🔍 DELETE - Resultado da verificação:', existing.rows);
      
      if (existing.rows.length === 0) {
        console.log('❌ DELETE - Usuário não encontrado para deletar');
        return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
      }
      
      console.log('✅ DELETE - Usuário encontrado:', existing.rows[0]);

      // Verificar se há registros relacionados na tabela colaborador_trilhas
      console.log('🔍 DELETE - Verificando registros relacionados em colaborador_trilhas...');
      const trilhasRelacionadas = await query(`
        SELECT COUNT(*) as total FROM colaborador_trilhas 
        WHERE colaborador_id = $1
      `, [userId]);
      
      console.log('🔍 DELETE - Registros relacionados encontrados:', trilhasRelacionadas.rows[0].total);
      
      if (trilhasRelacionadas.rows[0].total > 0) {
        console.log('🗑️ DELETE - Excluindo registros relacionados em cascata...');
        
        // Excluir registros relacionados primeiro (cascata)
        await query('DELETE FROM colaborador_trilhas WHERE colaborador_id = $1', [userId]);
        console.log('✅ DELETE - Registros relacionados excluídos');
      }

      // Verificar se há usuários que dependem deste usuário como gestor ou buddy
      console.log('🔍 DELETE - Verificando dependências de gestor/buddy...');
      const dependencias = await query(`
        SELECT id, name FROM users 
        WHERE (gestor_id = $1 OR buddy_id = $1) AND tenant_id = $2
      `, [userId, tenant.id]);
      
      console.log('🔍 DELETE - Dependências encontradas:', dependencias.rows);
      
      if (dependencias.rows.length > 0) {
        console.log('⚠️ DELETE - Usuário tem dependências:', dependencias.rows);
        return res.status(400).json({ 
          error: { 
            formErrors: [`Não é possível excluir este usuário pois ele é gestor ou buddy de outros usuários: ${dependencias.rows.map(u => u.name).join(', ')}`] 
          } 
        });
      }

      console.log('✅ DELETE - Nenhuma dependência encontrada, executando DELETE...');
      console.log('🔍 DELETE - Query: DELETE FROM users WHERE id = $1 AND tenant_id = $2');
      console.log('🔍 DELETE - Parâmetros:', [userId, tenant.id]);
      
      await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenant.id]);
      console.log('✅ DELETE - Usuário deletado com sucesso');
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

    // Invalidar cache de usuários após exclusão bem-sucedida
    invalidateCache(tenant.id, 'users');
    console.log('✅ Cache de usuários invalidado após exclusão');

    res.json({ message: 'Usuário deletado com sucesso', id: userId });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

module.exports = router;






