require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
// pdf-parse não funciona no Vercel (requer @napi-rs/canvas)
// const pdfParse = require('pdf-parse');
const { openDatabase, migrate, persistDatabase, runExec, runQuery } = require('./db');
const { initializePool, query, migrate: migratePG, getTenantBySubdomain: getTenantBySubdomainPG, getUsersByTenant, getDocumentsByTenant, getChunksByDocument, closePool, getPool } = require('./db-pg');
const { z } = require('zod');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

// Rota específica para dashboard-onboardflow
app.get('/dashboard-onboardflow', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/dashboard-onboardflow.html'));
});

// Rota específica para dashboard simples
app.get('/dashboard-simple-onboardflow', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/dashboard-simple-onboardflow.html'));
});

// Rota específica para dashboard teste simples
app.get('/dashboard-test-simple', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/dashboard-test-simple.html'));
});

// Rota específica para dashboard teste simples com .html
app.get('/dashboard-test-simple.html', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/dashboard-test-simple.html'));
});

// Novo dashboard melhorado
app.get('/dashboard-new', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/dashboard-new.html'));
});

// Página inicial do dashboard (nova rota principal)
app.get('/inicio', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/inicio.html'));
});

// Nova landing page melhorada
app.get('/landing-new', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/landing-new.html'));
});

// Middleware para extrair tenant do subdomínio (apenas para rotas da API)
app.use('/api', (req, res, next) => {
  const host = req.get('host') || '';
  const subdomain = host.split('.')[0];

  // 1) Se o tenant vier via querystring, priorizar
  if (req.query && req.query.tenant) {
    req.tenantSubdomain = String(req.query.tenant);
    return next();
  }
  
  // 2) Em ambientes locais ou hosts sem subdomínio real, usar default
  const isLocalLike = host.includes('localhost') || host.includes('onrender.com') || host.includes('vercel.app');
  if (isLocalLike) {
    req.tenantSubdomain = 'demo';
    return next();
  }
  
  // 3) Caso contrário, usar subdomínio do host
  req.tenantSubdomain = subdomain;
  next();
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function simpleChunk(text, size = 1000, overlap = 200) {
  if (text.length === 0) return [];
  if (size <= 0) size = 500;
  if (overlap < 0) overlap = 0;
  if (overlap >= size) overlap = Math.floor(size / 3);
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    const nextStart = end - overlap;
    if (nextStart <= start) {
      start = end;
    } else {
      start = nextStart;
    }
  }
  return chunks;
}

async function embed(text) {
  const vecSize = 128;
  const vector = new Array(vecSize).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    vector[code % vecSize] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Serve landing page as default
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

// Serve dashboard
app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Função auxiliar para buscar tenant por subdomain
async function getTenantBySubdomain(subdomain) {
  // Priorizar PostgreSQL (via pool detectado)
  if (usePostgres()) {
    try {
      return await getTenantBySubdomainPG(subdomain);
    } catch (error) {
      console.error('Erro ao buscar tenant no PostgreSQL:', error);
      // Não cair automaticamente para SQLite no Vercel
      if (process.env.VERCEL) {
        console.log('Vercel detectado, usando dados demo para tenant:', subdomain);
        return getTenantFromDemoData(subdomain);
      }
    }
  }
  
  // Usar dados demo no Vercel
  if (process.env.VERCEL) {
    console.log('Vercel detectado, usando dados demo para tenant:', subdomain);
    return getTenantFromDemoData(subdomain);
  }
  
  // Fallback para SQLite apenas fora do Vercel
  const { db } = await openDatabase();
  try {
    const tenants = runQuery(db, 'SELECT * FROM tenants WHERE subdomain = ?', [subdomain]);
    return tenants[0] || null;
  } finally {
    db.close();
  }
}

// Helper para decidir se PostgreSQL está disponível (via DATABASE_URL ou PG*)
function usePostgres() {
  try {
    if (!getPool()) {
      initializePool();
    }
    return Boolean(getPool());
  } catch (_e) {
    console.log('PostgreSQL não disponível, usando dados demo');
    return false;
  }
}

// Função helper para buscar tenant nos dados demo
function getTenantFromDemoData(subdomain) {
  const demoData = getDemoData();
  const tenant = demoData.tenants.find(t => t.subdomain === subdomain);
  return tenant || null;
}

// Função helper para dados demo
function getDemoData() {
  return {
    tenants: [
      { id: 'demo-tenant-1', name: 'Empresa Demo', subdomain: 'demo' },
      { id: 'demo-tenant-2', name: 'TechCorp', subdomain: 'techcorp' }
    ],
    users: [
      {
        id: 'demo-user-1',
        tenant_id: 'demo-tenant-1',
        name: 'João Silva',
        email: 'joao@empresademo.com',
        phone: '(11) 99999-9999',
        position: 'Desenvolvedor',
        department: 'Tecnologia',
        start_date: '2024-01-15',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'demo-user-2',
        tenant_id: 'demo-tenant-1',
        name: 'Maria Santos',
        email: 'maria@empresademo.com',
        phone: '(11) 88888-8888',
        position: 'Analista',
        department: 'RH',
        start_date: '2024-02-01',
        status: 'active',
        created_at: '2024-02-01T10:00:00Z'
      },
      {
        id: 'demo-user-3',
        tenant_id: 'demo-tenant-1',
        name: 'Pedro Costa',
        email: 'pedro@empresademo.com',
        phone: '(11) 77777-7777',
        position: 'Gerente',
        department: 'Vendas',
        start_date: '2024-01-01',
        status: 'active',
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 'demo-user-4',
        tenant_id: 'demo-tenant-1',
        name: 'Ana Oliveira',
        email: 'ana@empresademo.com',
        phone: '(11) 66666-6666',
        position: 'Assistente',
        department: 'Administração',
        start_date: '2024-03-01',
        status: 'inactive',
        created_at: '2024-03-01T10:00:00Z'
      }
    ],
    documents: [
      {
        id: 'demo-doc-1',
        tenant_id: 'demo-tenant-1',
        name: 'Contrato de Trabalho - João Silva',
        type: 'contrato',
        status: 'processado',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'demo-doc-2',
        tenant_id: 'demo-tenant-1',
        name: 'Ficha de Admissão - Maria Santos',
        type: 'admissao',
        status: 'pendente',
        created_at: '2024-02-01T10:00:00Z'
      },
      {
        id: 'demo-doc-3',
        tenant_id: 'demo-tenant-1',
        name: 'Avaliação de Desempenho - Pedro Costa',
        type: 'avaliacao',
        status: 'processado',
        created_at: '2024-01-01T10:00:00Z'
      }
    ],
    departments: [
      { id: 'demo-dept-1', tenant_id: 'demo-tenant-1', name: 'Tecnologia' },
      { id: 'demo-dept-2', tenant_id: 'demo-tenant-1', name: 'RH' },
      { id: 'demo-dept-3', tenant_id: 'demo-tenant-1', name: 'Vendas' },
      { id: 'demo-dept-4', tenant_id: 'demo-tenant-1', name: 'Administração' }
    ]
  };
}

app.get('/api/tenants', async (_req, res) => {
  try {
    // Tentar PostgreSQL primeiro
    if (usePostgres()) {
      try {
        // Garantir que o pool está inicializado
        if (!getPool()) {
          console.log('Inicializando pool PostgreSQL...');
          initializePool();
        }
        
        const result = await query('SELECT id, name, subdomain FROM public.tenants ORDER BY name');
        return res.json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar tenants no PostgreSQL:', error);
        // Fallback para SQLite
      }
    }
    
    // Fallback para SQLite
    const { db } = await openDatabase();
    try {
      const tenants = runQuery(db, 'SELECT id, name, subdomain FROM tenants ORDER BY name');
      res.json(tenants);
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Erro ao buscar tenants:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/api/tenants', async (req, res) => {
  const schema = z.object({ 
    name: z.string().min(1),
    subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Subdomain deve conter apenas letras minúsculas, números e hífens'),
    userName: z.string().min(1),
    userEmail: z.string().email()
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    // Use PostgreSQL if available, otherwise SQLite
    if (usePostgres()) {
      // PostgreSQL
      const existing = await query('SELECT id FROM public.tenants WHERE subdomain = $1', [parse.data.subdomain]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: { formErrors: ['Subdomain já existe. Escolha outro subdomain.'] } });
      }

      // Verificar se email já existe
      const existingEmail = await query('SELECT id FROM public.users WHERE email = $1', [parse.data.userEmail]);
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ error: { formErrors: ['Email já está em uso. Escolha outro email.'] } });
      }

      const tenantId = uuidv4();
      const userId = uuidv4();

      // Criar tenant e usuário em uma transação
      await query('BEGIN');
      
      // Criar tenant
      await query('INSERT INTO public.tenants (id, name, subdomain, created_at) VALUES ($1, $2, $3, $4)', 
        [tenantId, parse.data.name, parse.data.subdomain, new Date().toISOString()]);
      
      // Criar usuário admin para o tenant
      await query('INSERT INTO public.users (id, tenant_id, name, email, phone, position, department, start_date, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', 
        [userId, tenantId, parse.data.userName, parse.data.userEmail, 'Não informado', 'Administrador', 'Administração', new Date().toISOString().split('T')[0], 'active', new Date().toISOString()]);
      
      await query('COMMIT');

      res.status(201).json({ 
        tenant: { id: tenantId, name: parse.data.name, subdomain: parse.data.subdomain },
        user: { id: userId, name: parse.data.userName, email: parse.data.userEmail }
      });
    } else {
      // SQLite fallback
      const { db, SQL } = await openDatabase();
      try {
        const existing = runQuery(db, 'SELECT id FROM tenants WHERE subdomain = ?', [parse.data.subdomain]);
        if (existing.length > 0) {
          return res.status(400).json({ error: { formErrors: ['Subdomain já existe'] } });
        }

        const id = uuidv4();
        runExec(db, 'INSERT INTO tenants (id, name, subdomain) VALUES (?, ?, ?)', [id, parse.data.name, parse.data.subdomain]);
        persistDatabase(SQL, db);
        res.status(201).json({ id, name: parse.data.name, subdomain: parse.data.subdomain });
      } finally {
        db.close();
      }
    }
  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

// Endpoint para buscar tenant por subdomain
app.get('/api/tenants/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    // Tentar PostgreSQL primeiro
    if (usePostgres()) {
      try {
        const result = await query('SELECT id, name, subdomain FROM tenants WHERE subdomain = $1', [subdomain]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Tenant não encontrado' });
        }
        return res.json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao buscar tenant no PostgreSQL:', error);
        // Fallback para SQLite
      }
    }
    
    // Fallback para SQLite
    const { db } = await openDatabase();
    try {
      const result = runQuery(db, 'SELECT id, name, subdomain FROM tenants WHERE subdomain = ?', [subdomain]);
      if (result.length === 0) {
        return res.status(404).json({ error: 'Tenant não encontrado' });
      }
      res.json(result[0]);
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Erro ao buscar tenant:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para normalizar telefone brasileiro
function normalizePhone(phone) {
  if (!phone) return phone;
  
  // Remove espaços, parênteses e hífens
  let cleanPhone = phone.replace(/[\s\(\)\-]/g, '');
  
  // Se não começar com +, adiciona +55
  if (!cleanPhone.startsWith('+')) {
    // Se começar com 55, adiciona +
    if (cleanPhone.startsWith('55')) {
      cleanPhone = '+' + cleanPhone;
    } else {
      // Se não começar com 55, adiciona +55
      cleanPhone = '+55' + cleanPhone;
    }
  }
  
  return cleanPhone;
}

// Função para normalizar telefone para WhatsApp (sem +)
function normalizePhoneForWhatsApp(phone) {
  if (!phone) return phone;
  
  // Remove espaços, parênteses e hífens
  let cleanPhone = phone.replace(/[\s\(\)\-]/g, '');
  
  // Remove o + se existir
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  // Se não começar com 55, adiciona 55
  if (!cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone;
  }
  
  return cleanPhone;
}

// Endpoint para criar usuários (colaboradores)
app.post('/api/users', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      position: z.string().min(1),
      department: z.string().optional(),
      start_date: z.string().optional()
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    // Normalizar telefone para banco (com +)
    const normalizedPhone = normalizePhone(parse.data.phone);
    
    // Normalizar telefone para WhatsApp (sem +)
    const whatsappPhone = normalizePhoneForWhatsApp(parse.data.phone);

    // Buscar tenant pelo subdomain
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    // Use PostgreSQL if available, otherwise SQLite
    let userId;
    if (usePostgres()) {
      // PostgreSQL
      const existing = await query('SELECT id FROM users WHERE tenant_id = $1 AND email = $2', [tenant.id, parse.data.email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
      }

      userId = uuidv4();
      await query('INSERT INTO users (id, tenant_id, name, email, phone, position, department, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', 
        [userId, tenant.id, parse.data.name, parse.data.email, normalizedPhone, parse.data.position, parse.data.department || null, parse.data.start_date || null]);
    } else {
      // SQLite fallback
      const { db, SQL } = await openDatabase();
      try {
        // Verificar se email já existe no tenant
        const existing = runQuery(db, 'SELECT id FROM users WHERE tenant_id = ? AND email = ?', [tenant.id, parse.data.email]);
        if (existing.length > 0) {
          return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
        }

        userId = uuidv4();
        runExec(db, 'INSERT INTO users (id, tenant_id, name, email, phone, position, department, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
          [userId, tenant.id, parse.data.name, parse.data.email, normalizedPhone, parse.data.position, parse.data.department || null, parse.data.start_date || null]);
        
        persistDatabase(SQL, db);
      } finally {
        db.close();
      }
    }

    // Disparar webhook para n8n
    try {
      const webhookData = {
        type: 'user_created',
        tenantId: tenant.id,
        tenantName: tenant.name,
        userId: userId,
        name: parse.data.name,
        email: parse.data.email,
        phone: whatsappPhone, // Telefone sem + para WhatsApp
        position: parse.data.position,
        department: parse.data.department,
        start_date: parse.data.start_date,
        created_at: new Date().toISOString()
      };
        
      await fetch('https://hndll.app.n8n.cloud/webhook/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
    } catch (webhookError) {
      console.error('Erro ao enviar webhook:', webhookError);
      // Não falhar a criação do usuário por causa do webhook
    }
    
    res.status(201).json({ 
      id: userId, 
      name: parse.data.name, 
      email: parse.data.email,
      phone: normalizedPhone,
      position: parse.data.position,
      department: parse.data.department,
      start_date: parse.data.start_date,
      tenant: tenant.name
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

// Endpoint para excluir usuário
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('DELETE /users - userId:', userId);
    console.log('DELETE /users - tenantSubdomain:', req.tenantSubdomain);
    
    // Buscar tenant pelo subdomain
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    console.log('DELETE /users - tenant:', tenant);
    
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    // Use PostgreSQL if available, otherwise SQLite
    if (usePostgres()) {
      // PostgreSQL - usar uma única conexão para evitar problemas de conectividade
      console.log('DELETE /users - Using PostgreSQL with single connection');
      
      const pool = getPool();
      const client = await pool.connect();
      try {
        // Usar transação para garantir consistência
        await client.query('BEGIN');
        
        // Verificar se o usuário existe
        const checkUser = await client.query('SELECT id, name, tenant_id FROM users WHERE id = $1', [userId]);
        console.log('DELETE /users - Check user exists:', checkUser.rows);
        
        if (checkUser.rows.length === 0) {
          console.log('DELETE /users - User not found in database');
          await client.query('ROLLBACK');
          return res.status(404).json({ error: { formErrors: ['Usuário não encontrado no banco de dados'] } });
        }
        
        // Verificar se o usuário pertence ao tenant correto
        if (checkUser.rows[0].tenant_id !== tenant.id) {
          console.log('DELETE /users - User belongs to different tenant');
          await client.query('ROLLBACK');
          return res.status(403).json({ error: { formErrors: ['Usuário não pertence a este tenant'] } });
        }
        
        // Deletar o usuário
        const result = await client.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenant.id]);
        console.log('DELETE /users - Result rowCount:', result.rowCount);
        
        if (result.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
        }
        
        // Confirmar transação
        await client.query('COMMIT');
        console.log('DELETE /users - Transaction committed successfully');
        
      } catch (error) {
        console.error('DELETE /users - Error in transaction:', error);
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // SQLite fallback
      const { db, SQL } = await openDatabase();
      try {
        const existing = runQuery(db, 'SELECT id FROM users WHERE id = ? AND tenant_id = ?', [userId, tenant.id]);
        if (existing.length === 0) {
          return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
        }
        
        runExec(db, 'DELETE FROM users WHERE id = ? AND tenant_id = ?', [userId, tenant.id]);
        persistDatabase(SQL, db);
      } finally {
        db.close();
      }
    }

    res.status(200).json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

// Endpoint de teste para verificar consistência
app.get('/test-consistency/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    if (usePostgres()) {
      const pool = getPool();
      const client = await pool.connect();
      
      try {
        // Testar com conexão única
        const result1 = await client.query('SELECT id, name, tenant_id FROM users WHERE id = $1', [userId]);
        const result2 = await client.query('SELECT id, name FROM users WHERE tenant_id = $1', [tenant.id]);
        
        res.json({
          userId: userId,
          tenantId: tenant.id,
          userExists: result1.rows.length > 0,
          userData: result1.rows[0] || null,
          usersInTenant: result2.rows.length,
          allUsers: result2.rows
        });
      } finally {
        client.release();
      }
    } else {
      res.json({ error: 'Apenas PostgreSQL suportado para teste' });
    }
  } catch (error) {
    console.error('Erro no teste de consistência:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para listar usuários do tenant atual
app.get('/api/users', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    // Use PostgreSQL if available, otherwise demo data
    if (usePostgres()) {
      // PostgreSQL
      const users = await query('SELECT id, name, email, phone, position, department, start_date, status, created_at FROM users WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
      res.json(users.rows);
    } else {
      // Demo data fallback
      const demoData = getDemoData();
      const users = demoData.users.filter(user => user.tenant_id === tenant.id);
      res.json(users);
    }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  const schema = z.object({ 
    tenantId: z.string().uuid(), 
    title: z.string().min(1), 
    category: z.string().optional(),
    tags: z.string().optional()
  });
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  if (!req.file) return res.status(400).json({ error: 'Arquivo ausente' });

  // Extrair texto do arquivo
  let text;
  try {
    if (req.file.mimetype === 'text/plain') {
      text = req.file.buffer.toString('utf8');
    } else if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      // PDF parsing desabilitado no Vercel (requer @napi-rs/canvas)
      text = '[PDF não suportado no ambiente Vercel - use Render.com para processamento de PDF]';
      console.log('PDF não processado - ambiente Vercel');
    } else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('document') || 
               req.file.originalname.endsWith('.docx') || req.file.originalname.endsWith('.doc')) {
      // Para DOC/DOCX usando mammoth
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
      
      // Log de avisos se houver
      if (result.messages && result.messages.length > 0) {
        console.log('Avisos ao processar Word:', result.messages);
      }
    } else {
      return res.status(400).json({ error: 'Tipo de arquivo não suportado. Use TXT, PDF ou Word (DOC/DOCX).' });
    }
  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    return res.status(400).json({ error: 'Erro ao processar arquivo: ' + error.message });
  }

  // Verificar se o texto não está vazio
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'O arquivo parece estar vazio ou não contém texto válido.' });
  }

  const chunks = simpleChunk(text);
  const embeddings = await Promise.all(chunks.map(embed));

  const documentId = uuidv4();
  const createdAt = new Date().toISOString();
  
  // Use PostgreSQL if available, otherwise SQLite
  if (usePostgres()) {
    // Parse tags
    const tags = body.data.tags ? JSON.parse(body.data.tags) : [];
    
    // PostgreSQL
    await query('INSERT INTO documents (id, tenant_id, title, category, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)', [
      documentId,
      body.data.tenantId,
      body.data.title,
      body.data.category ?? null,
      'published',
      createdAt,
    ]);
    
    // Insert document tags
    for (const tagName of tags) {
      if (tagName && tagName.trim()) {
        await query('INSERT INTO document_tags (id, document_id, tag_name, created_at) VALUES ($1, $2, $3, $4)', [
          uuidv4(),
          documentId,
          tagName.trim(),
          createdAt
        ]);
      }
    }
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = uuidv4();
      await query('INSERT INTO chunks (id, document_id, section, content, embedding) VALUES ($1, $2, $3, $4, $5)', [
        chunkId,
        documentId,
        `section-${i + 1}`,
        chunks[i],
        JSON.stringify(embeddings[i]),
      ]);
    }
    
    // Enviar documento para n8n para categorização
    try {
      const webhookData = {
        type: 'document_upload',
        documentId: documentId,
        tenantId: body.data.tenantId,
        title: body.data.title,
        content: text,
        category: body.data.category,
        created_at: createdAt
      };
      
      console.log('Enviando documento para n8n para categorização:', webhookData);
      
      await fetch('https://hndll.app.n8n.cloud/webhook/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
      
      console.log('Documento enviado para n8n com sucesso');
    } catch (webhookError) {
      console.error('Erro ao enviar documento para n8n:', webhookError);
      // Não falhar o upload por causa do webhook
    }

    res.status(201).json({ 
      documentId, 
      title: body.data.title,
      category: body.data.category,
      chunks: chunks.length 
    });
  } else {
    // SQLite fallback
    const { db, SQL } = await openDatabase();
    try {
      runExec(db, 'INSERT INTO documents (id, tenant_id, title, category, status, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
        documentId,
        body.data.tenantId,
        body.data.title,
        body.data.category ?? null,
        'published',
        createdAt,
      ]);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = uuidv4();
        runExec(db, 'INSERT INTO chunks (id, document_id, section, content, embedding) VALUES (?, ?, ?, ?, ?)', [
          chunkId,
          documentId,
          `section-${i + 1}`,
          chunks[i],
          JSON.stringify(embeddings[i]),
        ]);
      }
      
      persistDatabase(SQL, db);
      
      // Enviar documento para n8n para categorização
      try {
        const webhookData = {
          type: 'document_upload',
          documentId: documentId,
          tenantId: body.data.tenantId,
          title: body.data.title,
          content: text,
          category: body.data.category,
          created_at: createdAt
        };
        
        console.log('Enviando documento para n8n para categorização:', webhookData);
        
        await fetch('https://hndll.app.n8n.cloud/webhook/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        
        console.log('Documento enviado para n8n com sucesso');
      } catch (webhookError) {
        console.error('Erro ao enviar documento para n8n:', webhookError);
        // Não falhar o upload por causa do webhook
      }

      res.status(201).json({ 
        documentId, 
        title: body.data.title,
        category: body.data.category,
        chunks: chunks.length 
      });
    } finally {
      db.close();
    }
  }
});

// Endpoint para listar documentos do tenant
app.get('/api/documents', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    // Use PostgreSQL if available, otherwise demo data
    if (usePostgres()) {
      // PostgreSQL
      const result = await query(
        'SELECT id, title, category, status, created_at FROM documents WHERE tenant_id = $1 ORDER BY created_at DESC',
        [tenant.id]
      );
      res.json(result.rows);
    } else {
      // Demo data fallback
      const demoData = getDemoData();
      const documents = demoData.documents.filter(doc => doc.tenant_id === tenant.id);
      res.json(documents);
    }
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para excluir documento
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log('DELETE /documents - documentId:', documentId);
    console.log('DELETE /documents - tenantSubdomain:', req.tenantSubdomain);

    // Buscar tenant pelo subdomain
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    console.log('DELETE /documents - tenant:', tenant);

    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    // Use PostgreSQL if available, otherwise SQLite
    if (usePostgres()) {
      // PostgreSQL - usar uma única conexão para evitar problemas de conectividade
      console.log('DELETE /documents - Using PostgreSQL with single connection');

      const pool = getPool();
      const client = await pool.connect();
      try {
        // Usar transação para garantir consistência
        await client.query('BEGIN');

        // Verificar se o documento existe
        const checkDoc = await client.query('SELECT id, title, tenant_id FROM documents WHERE id = $1', [documentId]);
        console.log('DELETE /documents - Check document exists:', checkDoc.rows);

        if (checkDoc.rows.length === 0) {
          console.log('DELETE /documents - Document not found in database');
          await client.query('ROLLBACK');
          return res.status(404).json({ error: { formErrors: ['Documento não encontrado no banco de dados'] } });
        }

        // Verificar se o documento pertence ao tenant correto
        if (checkDoc.rows[0].tenant_id !== tenant.id) {
          console.log('DELETE /documents - Document belongs to different tenant');
          await client.query('ROLLBACK');
          return res.status(403).json({ error: { formErrors: ['Documento não pertence a este tenant'] } });
        }

        // Deletar o documento (cascade vai deletar os chunks automaticamente)
        const result = await client.query('DELETE FROM documents WHERE id = $1 AND tenant_id = $2', [documentId, tenant.id]);
        console.log('DELETE /documents - Result rowCount:', result.rowCount);

        if (result.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: { formErrors: ['Documento não encontrado'] } });
        }

        // Confirmar transação
        await client.query('COMMIT');
        console.log('DELETE /documents - Transaction committed successfully');

      } catch (error) {
        console.error('DELETE /documents - Error in transaction:', error);
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // SQLite fallback
      const { db, SQL } = await openDatabase();
      try {
        const existing = runQuery(db, 'SELECT id FROM documents WHERE id = ? AND tenant_id = ?', [documentId, tenant.id]);
        if (existing.length === 0) {
          return res.status(404).json({ error: { formErrors: ['Documento não encontrado'] } });
        }

        // Deletar chunks primeiro (cascade não funciona no SQLite)
        runExec(db, 'DELETE FROM chunks WHERE document_id = ?', [documentId]);
        runExec(db, 'DELETE FROM documents WHERE id = ? AND tenant_id = ?', [documentId, tenant.id]);
        persistDatabase(SQL, db);
      } finally {
        db.close();
      }
    }

    res.status(200).json({ message: 'Documento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

// Endpoint para download de documento
app.get('/documents/:id/download', async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log('GET /documents/:id/download - documentId:', documentId);
    console.log('GET /documents/:id/download - tenantSubdomain:', req.tenantSubdomain);

    // Buscar tenant pelo subdomain
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    // Use PostgreSQL if available, otherwise SQLite
    if (usePostgres()) {
      // PostgreSQL
      const docResult = await query(
        'SELECT id, title, category, status FROM documents WHERE id = $1 AND tenant_id = $2',
        [documentId, tenant.id]
      );
      
      if (docResult.rows.length === 0) {
        return res.status(404).json({ error: { formErrors: ['Documento não encontrado'] } });
      }

      const document = docResult.rows[0];
      
      // Buscar todos os chunks do documento
      const chunksResult = await query(
        'SELECT content FROM chunks WHERE document_id = $1 ORDER BY created_at',
        [documentId]
      );
      
      // Concatenar o conteúdo
      const fullContent = chunksResult.rows.map(chunk => chunk.content).join('\n\n');
      
      // Configurar headers para download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${document.title}.txt"`);
      res.send(fullContent);
      
    } else {
      // SQLite fallback
      const { db } = await openDatabase();
      try {
        const document = runQuery(db, 'SELECT id, title, category, status FROM documents WHERE id = ? AND tenant_id = ?', [documentId, tenant.id]);
        if (document.length === 0) {
          return res.status(404).json({ error: { formErrors: ['Documento não encontrado'] } });
        }

        // Buscar todos os chunks do documento
        const chunks = runQuery(db, 'SELECT content FROM chunks WHERE document_id = ? ORDER BY created_at', [documentId]);
        
        // Concatenar o conteúdo
        const fullContent = chunks.map(chunk => chunk.content).join('\n\n');
        
        // Configurar headers para download
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${document[0].title}.txt"`);
        res.send(fullContent);
      } finally {
        db.close();
      }
    }
  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    res.status(500).json({ error: { formErrors: ['Erro interno do servidor'] } });
  }
});

// Endpoint para receber resultado da categorização do n8n
app.post('/documents/categorization-result', async (req, res) => {
  try {
    console.log('Recebido resultado de categorização do n8n:', req.body);
    
    const {
      documentId,
      tenantId,
      suggestedCategory,
      subcategories = [],
      tags = [],
      summary = '',
      confidence = 0,
      processedAt
    } = req.body;

    // Validar dados obrigatórios
    if (!documentId || !tenantId) {
      return res.status(400).json({ error: 'documentId e tenantId são obrigatórios' });
    }

    // Use PostgreSQL if available, otherwise SQLite
    if (usePostgres()) {
      // PostgreSQL - Atualizar documento com categorização
      const result = await query(
        'UPDATE documents SET category = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
        [suggestedCategory, documentId, tenantId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }

      // Inserir tags e subcategorias (vamos criar uma tabela para isso)
      // Por enquanto, vamos salvar como JSON em um campo adicional
      await query(
        'UPDATE documents SET metadata = $1 WHERE id = $2',
        [JSON.stringify({
          subcategories,
          tags,
          summary,
          confidence,
          processedAt,
          aiProcessed: true
        }), documentId]
      );

    } else {
      // SQLite fallback
      const { db, SQL } = await openDatabase();
      try {
        // Verificar se documento existe
        const existing = runQuery(db, 'SELECT id FROM documents WHERE id = ? AND tenant_id = ?', [documentId, tenantId]);
        if (existing.length === 0) {
          return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // Atualizar documento
        runExec(db, 'UPDATE documents SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?', 
          [suggestedCategory, documentId, tenantId]);

        // Salvar metadados (precisamos adicionar coluna metadata na migração)
        runExec(db, 'UPDATE documents SET metadata = ? WHERE id = ?', 
          [JSON.stringify({
            subcategories,
            tags,
            summary,
            confidence,
            processedAt,
            aiProcessed: true
          }), documentId]);

        persistDatabase(SQL, db);
      } finally {
        db.close();
      }
    }

    console.log('Categorização salva com sucesso:', {
      documentId,
      suggestedCategory,
      subcategories,
      tags,
      confidence
    });

    res.status(200).json({ 
      success: true, 
      message: 'Categorização salva com sucesso',
      documentId,
      suggestedCategory,
      subcategories,
      tags,
      confidence
    });

  } catch (error) {
    console.error('Erro ao processar categorização:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/search/policy', async (req, res) => {
  const schema = z.object({ tenantId: z.string().uuid(), query: z.string().min(1), top_k: z.number().min(1).max(10).default(3) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { tenantId, query, top_k } = parse.data;

  const qEmbed = await embed(query);
  
  // Use PostgreSQL if available, otherwise SQLite
  if (usePostgres()) {
    // PostgreSQL
    const result = await query(
      `SELECT c.id, c.content, c.embedding, c.section, d.title, d.version
       FROM chunks c JOIN documents d ON d.id = c.document_id
       WHERE d.tenant_id = $1 AND d.status = 'published'`,
      [tenantId]
    );
    
    const ranked = result.rows
      .map((r) => ({
        id: r.id,
        content: r.content,
        section: r.section,
        title: r.title,
        version: r.version,
        score: cosine(qEmbed, JSON.parse(r.embedding)),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, top_k);

    res.json({ query, results: ranked });
  } else {
    // SQLite fallback
    const { db } = await openDatabase();
    try {
      const rows = runQuery(
        db,
        `SELECT c.id, c.content, c.embedding, c.section, d.title, d.version
         FROM chunks c JOIN documents d ON d.id = c.document_id
         WHERE d.tenant_id = ? AND d.status = 'published'`,
        [tenantId]
      );
      
      const ranked = rows
        .map((r) => ({
          id: r.id,
          content: r.content,
          section: r.section,
          title: r.title,
          version: r.version,
          score: cosine(qEmbed, JSON.parse(r.embedding)),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, top_k);

      res.json({ query, results: ranked });
    } finally {
      db.close();
    }
  }
});

// ===== ENDPOINTS DE CADASTROS =====

// Departamentos
app.get('/api/departments', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Use PostgreSQL if available, otherwise demo data
    if (usePostgres()) {
      const result = await query('SELECT * FROM departments WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
      res.json(result.rows);
    } else {
      // Demo data fallback
      const demoData = getDemoData();
      const departments = demoData.departments.filter(dept => dept.tenant_id === tenant.id);
      res.json(departments);
    }
  } catch (error) {
    console.error('Erro ao obter departamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const { name } = req.body;
    const tenantSubdomain = req.tenantSubdomain;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome do departamento é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query(
      'INSERT INTO departments (id, tenant_id, name, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), tenant.id, name.trim(), new Date().toISOString()]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const tenantSubdomain = req.tenantSubdomain;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome do departamento é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query(
      'UPDATE departments SET name = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *',
      [name.trim(), new Date().toISOString(), id, tenant.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSubdomain = req.tenantSubdomain;
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    await query('DELETE FROM departments WHERE id = $1 AND tenant_id = $2', [id, tenant.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Categorias
app.get('/api/categories', async (req, res) => {
  try {
    const tenantSubdomain = req.tenantSubdomain;
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query('SELECT * FROM categories WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const tenantSubdomain = req.tenantSubdomain;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query(
      'INSERT INTO categories (id, tenant_id, name, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), tenant.id, name.trim(), new Date().toISOString()]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const tenantSubdomain = req.tenantSubdomain;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query(
      'UPDATE categories SET name = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *',
      [name.trim(), new Date().toISOString(), id, tenant.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSubdomain = req.tenantSubdomain;
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    await query('DELETE FROM categories WHERE id = $1 AND tenant_id = $2', [id, tenant.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cargos
app.get('/api/positions', async (req, res) => {
  try {
    const tenantSubdomain = req.tenantSubdomain;
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query('SELECT * FROM positions WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter cargos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/positions', async (req, res) => {
  try {
    const { name } = req.body;
    const tenantSubdomain = req.tenantSubdomain;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome do cargo é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query(
      'INSERT INTO positions (id, tenant_id, name, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), tenant.id, name.trim(), new Date().toISOString()]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const tenantSubdomain = req.tenantSubdomain;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome do cargo é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query(
      'UPDATE positions SET name = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *',
      [name.trim(), new Date().toISOString(), id, tenant.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/positions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSubdomain = req.tenantSubdomain;
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    await query('DELETE FROM positions WHERE id = $1 AND tenant_id = $2', [id, tenant.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Tags
app.get('/api/tags', async (req, res) => {
  try {
    const tenantSubdomain = req.tenantSubdomain;
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query('SELECT * FROM tags WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter tags:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/tags', async (req, res) => {
  try {
    const { name } = req.body;
    const tenantSubdomain = req.tenantSubdomain;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome da tag é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query(
      'INSERT INTO tags (id, tenant_id, name, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), tenant.id, name.trim(), new Date().toISOString()]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar tag:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const tenantSubdomain = req.tenantSubdomain;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome da tag é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const result = await query(
      'UPDATE tags SET name = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *',
      [name.trim(), new Date().toISOString(), id, tenant.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar tag:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSubdomain = req.tenantSubdomain;
    
    const tenant = await getTenantBySubdomain(tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    await query('DELETE FROM tags WHERE id = $1 AND tenant_id = $2', [id, tenant.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir tag:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

async function initializeDatabase() {
  try {
    console.log('Inicializando banco de dados...');
    
    // Tentar inicializar PostgreSQL primeiro (via DATABASE_URL ou PG*)
    try {
      console.log('Inicializando PostgreSQL...');
      initializePool();
      if (getPool()) {
        // Testar conexão com uma query simples
        await query('SELECT 1 as test');
        console.log('Conexão PostgreSQL testada com sucesso');
        
        await migratePG();
        console.log('PostgreSQL inicializado com sucesso!');
        return;
      } else {
        console.warn('Pool PostgreSQL não disponível após initializePool()');
      }
    } catch (error) {
      console.error('Erro ao inicializar PostgreSQL:', error.message);
      if (error.message.includes('db_termination') || error.message.includes('connection terminated')) {
        console.log('Erro de conexão detectado, aguardando antes de tentar novamente...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          console.log('Tentando reconectar...');
          await query('SELECT 1 as test');
          await migratePG();
          console.log('PostgreSQL reconectado com sucesso!');
          return;
        } catch (retryError) {
          console.error('Falha na reconexão:', retryError.message);
        }
      }
      console.log('Usando SQLite como fallback...');
    }
    
    // Em ambiente Vercel, evitar SQLite (filesystem é imutável)
    if (process.env.VERCEL) {
      console.warn('VERCEL detectado e PostgreSQL indisponível. Pulando SQLite. Configure PGHOST/PG* no Vercel.');
      return;
    }

    // Em ambientes fora do Vercel, inicializar SQLite como fallback
    console.log('Inicializando SQLite...');
    const { db, SQL } = await openDatabase();
    migrate(db);
    persistDatabase(SQL, db);
    db.close();
    console.log('SQLite inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

async function bootstrap() {
  try {
    await initializeDatabase();
    
    const port = Number(process.env.PORT || 3000);
    app.listen(port, () => {
      console.log(`🚀 Flowly API rodando em http://localhost:${port}`);
      console.log(`📊 Database: ${process.env.DATABASE_URL ? 'PostgreSQL (Supabase)' : 'SQLite (Local)'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Para Vercel, inicializar banco de dados e exportar o app
if (process.env.VERCEL) {
  // No Vercel, inicializar apenas o banco de dados
  initializeDatabase().catch((error) => {
    console.error('Erro ao inicializar banco no Vercel:', error);
  });
}
module.exports = app;

// Para desenvolvimento local, inicializar o servidor completo
if (require.main === module) {
  bootstrap();
}

// Healthcheck melhorado para diagnosticar ambiente e disponibilidade
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      ok: true,
      env: process.env.VERCEL ? 'vercel' : (process.env.NODE_ENV || 'development'),
      postgres: usePostgres() ? 'available' : 'unavailable',
      time: new Date().toISOString(),
      database: {
        status: 'unknown',
        connectionTime: null,
        error: null
      }
    };

    // Testar conexão com o banco se PostgreSQL estiver disponível
    if (usePostgres()) {
      try {
        const start = Date.now();
        const result = await query('SELECT 1 as test, NOW() as current_time');
        health.database.status = 'connected';
        health.database.connectionTime = Date.now() - start;
        
        // Informações do pool
        const pool = getPool();
        if (pool) {
          health.database.poolInfo = {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
          };
        }
      } catch (dbError) {
        health.database.status = 'error';
        health.database.error = dbError.message;
        health.ok = false;
        console.error('Health check database error:', dbError);
      }
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      time: new Date().toISOString()
    });
  }
});

// Endpoint para testar conexão com banco
app.get('/api/debug/connection', async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const pgHost = process.env.PGHOST;
    const pgPort = process.env.PGPORT;
    const pgDatabase = process.env.PGDATABASE;
    const pgUser = process.env.PGUSER;
    const pgPassword = process.env.PGPASSWORD;
    
    res.json({
      hasDatabaseUrl: Boolean(dbUrl),
      urlLength: dbUrl ? dbUrl.length : 0,
      urlPreview: dbUrl ? dbUrl.substring(0, 50) + '...' : null,
      urlEnd: dbUrl ? '...' + dbUrl.substring(dbUrl.length - 20) : null,
      pgVariables: {
        PGHOST: pgHost ? 'SET' : 'MISSING',
        PGPORT: pgPort ? pgPort : 'MISSING',
        PGDATABASE: pgDatabase ? 'SET' : 'MISSING',
        PGUSER: pgUser ? 'SET' : 'MISSING',
        PGPASSWORD: pgPassword ? 'SET' : 'MISSING'
      },
      pgHostPreview: pgHost ? pgHost.substring(0, 30) + '...' : null,
      pgUserPreview: pgUser ? pgUser.substring(0, 10) + '...' : null,
      message: 'Informações da conexão'
    });
  } catch (error) {
    console.error('Erro ao verificar conexão:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para verificar estrutura da tabela tenants
app.get('/api/debug/tenants', async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      // Garantir que o pool está inicializado
      if (!getPool()) {
        console.log('Inicializando pool PostgreSQL...');
        initializePool();
      }
      
      // Verificar estrutura da tabela
      const result = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tenants' 
        ORDER BY ordinal_position
      `);
      
      res.json({ 
        columns: result.rows,
        message: 'Estrutura da tabela tenants'
      });
    } else {
      res.status(500).json({ error: 'DATABASE_URL não configurada' });
    }
  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para criar tenant demo manualmente
// Endpoint para validar login (botão ENTRAR)
app.post('/api/auth/validate', async (req, res) => {
  try {
    const { companyName, email } = req.body;
    
    if (!companyName || !email) {
      return res.status(400).json({ 
        error: 'Nome da empresa e email são obrigatórios' 
      });
    }

    console.log('Validando login:', { companyName, email });

    // Tentar PostgreSQL primeiro, com fallback para SQLite
    try {
      if (usePostgres()) {
        // Buscar tenant pelo nome da empresa
        const tenantResult = await query(
          'SELECT * FROM public.tenants WHERE name = $1', 
          [companyName.trim()]
        );

        if (tenantResult.rows.length === 0) {
          return res.status(404).json({ 
            error: 'Empresa não encontrada. Verifique o nome da empresa ou entre em contato com o administrador.' 
          });
        }

        const tenant = tenantResult.rows[0];

        // Buscar usuário pelo email e tenant_id
        const userResult = await query(
          'SELECT * FROM public.users WHERE email = $1 AND tenant_id = $2', 
          [email.trim(), tenant.id]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ 
            error: 'Usuário não encontrado neste tenant. Verifique seu email ou entre em contato com o administrador.' 
          });
        }

        const user = userResult.rows[0];

        // Login válido
        return res.json({
          success: true,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain
          },
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      }
    } catch (pgError) {
      console.error('Erro no PostgreSQL, tentando SQLite:', pgError.message);
    }

    // Fallback para dados demo
    console.log('Usando dados demo para validação');
    
    const demoData = getDemoData();

    // Buscar tenant demo
    const tenant = demoData.tenants.find(t => t.name.toLowerCase() === companyName.trim().toLowerCase());
    
    if (!tenant) {
      return res.status(404).json({ 
        error: 'Empresa não encontrada. Empresas disponíveis: Empresa Demo, TechCorp' 
      });
    }

    // Buscar usuário demo
    const user = demoData.users.find(u => u.tenant_id === tenant.id && u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado neste tenant. Verifique seu email ou entre em contato com o administrador.' 
      });
    }

    // Login válido (demo)
    res.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      demo: true // Indicar que são dados demo
    });

  } catch (error) {
    console.error('Erro ao validar login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para popular dados demo no Supabase Pro
app.post('/api/demo/populate', async (req, res) => {
  try {
    if (!usePostgres()) {
      return res.status(400).json({ error: 'PostgreSQL não disponível' });
    }

    console.log('Populando dados demo no Supabase...');

    // Criar tenant demo se não existir
    const tenantCheck = await query('SELECT id FROM public.tenants WHERE subdomain = $1', ['demo']);
    
    if (tenantCheck.rows.length === 0) {
      const tenantId = uuidv4();
      await query(
        'INSERT INTO public.tenants (id, name, subdomain, created_at) VALUES ($1, $2, $3, $4)',
        [tenantId, 'Empresa Demo', 'demo', new Date().toISOString()]
      );
      console.log('Tenant demo criado:', tenantId);
    }

    // Buscar tenant demo
    const tenantResult = await query('SELECT id FROM public.tenants WHERE subdomain = $1', ['demo']);
    const tenantId = tenantResult.rows[0].id;

    // Criar usuários demo se não existirem
    const usersCheck = await query('SELECT COUNT(*) as count FROM public.users WHERE tenant_id = $1', [tenantId]);
    
    if (parseInt(usersCheck.rows[0].count) === 0) {
      const demoUsers = [
        {
          name: 'João Silva',
          email: 'joao@empresademo.com',
          phone: '(11) 99999-9999',
          position: 'Desenvolvedor',
          department: 'Tecnologia',
          status: 'active'
        },
        {
          name: 'Maria Santos',
          email: 'maria@empresademo.com',
          phone: '(11) 88888-8888',
          position: 'Analista',
          department: 'RH',
          status: 'active'
        },
        {
          name: 'Pedro Costa',
          email: 'pedro@empresademo.com',
          phone: '(11) 77777-7777',
          position: 'Gerente',
          department: 'Vendas',
          status: 'active'
        }
      ];

      for (const user of demoUsers) {
        const userId = uuidv4();
        await query(
          'INSERT INTO public.users (id, tenant_id, name, email, phone, position, department, start_date, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            userId,
            tenantId,
            user.name,
            user.email,
            user.phone,
            user.position,
            user.department,
            new Date().toISOString().split('T')[0],
            user.status,
            new Date().toISOString()
          ]
        );
      }
      console.log('Usuários demo criados');
    }

    res.json({
      success: true,
      message: 'Dados demo populados com sucesso no Supabase Pro',
      tenant: 'demo'
    });

  } catch (error) {
    console.error('Erro ao popular dados demo:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/api/tenants/demo', async (req, res) => {
  try {
    if (usePostgres()) {
      // Garantir que o pool está inicializado
      if (!getPool()) {
        console.log('Inicializando pool PostgreSQL...');
        initializePool();
      }
      
      // Verificar se já existe
      const existing = await query('SELECT id FROM public.tenants WHERE subdomain = $1', ['demo']);
      if (existing.rows.length > 0) {
        return res.json({ message: 'Tenant demo já existe', tenant: existing.rows[0] });
      }
      
      // Criar tenant demo
      const demoId = uuidv4();
      await query(
        'INSERT INTO public.tenants (id, name, subdomain, created_at) VALUES ($1, $2, $3, $4)',
        [demoId, 'Empresa Demo', 'demo', new Date().toISOString()]
      );
      
      res.json({ message: 'Tenant demo criado com sucesso', tenant: { id: demoId, name: 'Empresa Demo', subdomain: 'demo' } });
    } else {
      res.status(500).json({ error: 'PostgreSQL não configurado' });
    }
  } catch (error) {
    console.error('Erro ao criar tenant demo:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para testar conexão direta
app.post('/api/debug/test-connection', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
    // Montar DATABASE_URL das variáveis PG*
    const pgHost = process.env.PGHOST;
    const pgPort = process.env.PGPORT || '5432';
    const pgDatabase = process.env.PGDATABASE;
    const pgUser = process.env.PGUSER;
    const pgPassword = process.env.PGPASSWORD;
    
    if (!pgHost || !pgDatabase || !pgUser || !pgPassword) {
      return res.status(400).json({ error: 'Variáveis PG* incompletas' });
    }
    
    // Se for host do Supabase direto, usar session pooler (IPv4)
    let finalHost = pgHost;
    if (pgHost.includes('db.gxqwfltteimexngybwna.supabase.co')) {
      finalHost = 'aws-1-sa-east-1.pooler.supabase.com';
      console.log('Usando session pooler Supabase para IPv4:', finalHost);
    }
    
    const assembledUrl = `postgresql://${encodeURIComponent(pgUser)}:${encodeURIComponent(pgPassword)}@${finalHost}:${pgPort}/${pgDatabase}`;
    
    console.log('Testando conexão direta com:', assembledUrl.substring(0, 50) + '...');
    
    const testPool = new Pool({
      connectionString: assembledUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
      // Forçar IPv4
      family: 4
    });
    
    const client = await testPool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    await testPool.end();
    
    res.json({ 
      success: true, 
      message: 'Conexão PostgreSQL funcionando (IPv4)',
      currentTime: result.rows[0].current_time
    });
  } catch (error) {
    console.error('Erro na conexão de teste:', error);
    res.status(500).json({ error: 'Erro na conexão', details: error.message });
  }
});

// Endpoint para forçar migração
app.post('/api/debug/migrate', async (req, res) => {
  try {
    if (usePostgres()) {
      console.log('Forçando migração PostgreSQL...');
      await migratePG();
      res.json({ message: 'Migração executada com sucesso' });
    } else {
      res.status(500).json({ error: 'PostgreSQL não configurado' });
    }
  } catch (error) {
    console.error('Erro na migração forçada:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para configurar RLS no Supabase
app.post('/api/debug/setup-rls', async (req, res) => {
  try {
    if (!usePostgres()) {
      return res.status(500).json({ error: 'PostgreSQL não configurado' });
    }

    console.log('Configurando RLS no Supabase...');
    
    // Read the RLS setup SQL file
    const fs = require('fs');
    const sqlPath = path.join(__dirname, '../supabase-rls-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL script
    await query(sqlContent);
    
    console.log('RLS configurado com sucesso!');
    res.json({ 
      message: 'RLS configurado com sucesso! Todas as tabelas agora têm Row Level Security habilitado.',
      details: 'Políticas criadas para service_role e usuários autenticados'
    });
  } catch (error) {
    console.error('Erro ao configurar RLS:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para diagnóstico detalhado da conexão PostgreSQL
app.get('/api/debug/connection-details', async (req, res) => {
  try {
    const details = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
        PGHOST: process.env.PGHOST || 'NOT_SET',
        PGPORT: process.env.PGPORT || 'NOT_SET',
        PGDATABASE: process.env.PGDATABASE || 'NOT_SET',
        PGUSER: process.env.PGUSER || 'NOT_SET',
        PGPASSWORD: process.env.PGPASSWORD ? 'SET' : 'NOT_SET'
      },
      connection: {
        poolExists: Boolean(getPool()),
        poolConfig: getPool() ? {
          totalCount: getPool().totalCount,
          idleCount: getPool().idleCount,
          waitingCount: getPool().waitingCount
        } : null
      },
      timestamp: new Date().toISOString()
    };

    // Tentar uma conexão simples
    if (usePostgres()) {
      try {
        const startTime = Date.now();
        const result = await query('SELECT 1 as test, NOW() as current_time');
        const endTime = Date.now();
        
        details.connection.test = {
          success: true,
          duration: endTime - startTime,
          result: result.rows[0]
        };
      } catch (error) {
        details.connection.test = {
          success: false,
          error: error.message,
          code: error.code
        };
      }
    }

    res.json(details);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro no diagnóstico', 
      details: error.message 
    });
  }
});

