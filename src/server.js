require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { openDatabase, migrate, persistDatabase, runExec, runQuery } = require('./db');
const { initializePool, query, migrate: migratePG, getTenantBySubdomain: getTenantBySubdomainPG, getUsersByTenant, getDocumentsByTenant, getChunksByDocument, closePool, getPool } = require('./db-pg');
const { z } = require('zod');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

// Middleware para extrair tenant do subdomínio
app.use((req, res, next) => {
  const host = req.get('host') || '';
  const subdomain = host.split('.')[0];
  
  // Se não for localhost, extrair subdomínio
  if (!host.includes('localhost') && !host.includes('onrender.com')) {
    req.tenantSubdomain = subdomain;
  } else {
    // Para desenvolvimento, usar subdomain padrão
    req.tenantSubdomain = req.query.tenant || 'demo';
  }
  
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
  // Tentar PostgreSQL primeiro
  if (process.env.DATABASE_URL) {
    try {
      return await getTenantBySubdomainPG(subdomain);
    } catch (error) {
      console.error('Erro ao buscar tenant no PostgreSQL:', error);
      // Fallback para SQLite
    }
  }
  
  // Fallback para SQLite
  const { db } = await openDatabase();
  try {
    const tenants = runQuery(db, 'SELECT * FROM tenants WHERE subdomain = ?', [subdomain]);
    return tenants[0] || null;
  } finally {
    db.close();
  }
}

app.get('/tenants', async (_req, res) => {
  try {
    // Tentar PostgreSQL primeiro
    if (process.env.DATABASE_URL) {
      try {
        const result = await query('SELECT id, name, subdomain FROM tenants ORDER BY name');
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

app.post('/tenants', async (req, res) => {
  const schema = z.object({ 
    name: z.string().min(1),
    subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Subdomain deve conter apenas letras minúsculas, números e hífens')
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  try {
    // Use PostgreSQL if available, otherwise SQLite
    if (process.env.DATABASE_URL) {
      // PostgreSQL
      const existing = await query('SELECT id FROM tenants WHERE subdomain = $1', [parse.data.subdomain]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: { formErrors: ['Subdomain já existe'] } });
      }

      const id = uuidv4();
      await query('INSERT INTO tenants (id, name, subdomain) VALUES ($1, $2, $3)', [id, parse.data.name, parse.data.subdomain]);
      res.status(201).json({ id, name: parse.data.name, subdomain: parse.data.subdomain });
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
app.post('/users', async (req, res) => {
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

  const { db, SQL } = await openDatabase();
  try {
    // Verificar se email já existe no tenant
    const existing = runQuery(db, 'SELECT id FROM users WHERE tenant_id = ? AND email = ?', [tenant.id, parse.data.email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
    }

    const userId = uuidv4();
    runExec(db, 'INSERT INTO users (id, tenant_id, name, email, phone, position, department, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [userId, tenant.id, parse.data.name, parse.data.email, normalizedPhone, parse.data.position, parse.data.department || null, parse.data.start_date || null]);
    
    persistDatabase(SQL, db);
    
    // Disparar webhook para n8n
    try {
      const webhookData = {
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
  } finally {
    db.close();
  }
});

// Endpoint para excluir usuário
app.delete('/users/:id', async (req, res) => {
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
    if (process.env.DATABASE_URL) {
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

    if (process.env.DATABASE_URL) {
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
app.get('/users', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const { db } = await openDatabase();
    try {
      const users = runQuery(db, 'SELECT id, name, email, phone, position, department, start_date, status, created_at FROM users WHERE tenant_id = ? ORDER BY name', [tenant.id]);
      res.json(users);
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/documents/upload', upload.single('file'), async (req, res) => {
  const schema = z.object({ tenantId: z.string().uuid(), title: z.string().min(1), category: z.string().optional(), version: z.string().optional() });
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  if (!req.file) return res.status(400).json({ error: 'Arquivo ausente' });

  const text = req.file.buffer.toString('utf8');
  const chunks = simpleChunk(text);
  const embeddings = await Promise.all(chunks.map(embed));

  const documentId = uuidv4();
  const createdAt = new Date().toISOString();
  const { db, SQL } = await openDatabase();
  try {
    runExec(db, 'INSERT INTO documents (id, tenant_id, title, category, version, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      documentId,
      body.data.tenantId,
      body.data.title,
      body.data.category ?? null,
      body.data.version ?? 'v1',
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
    res.status(201).json({ documentId, chunks: chunks.length });
  } finally {
    db.close();
  }
});

app.post('/search/policy', async (req, res) => {
  const schema = z.object({ tenantId: z.string().uuid(), query: z.string().min(1), top_k: z.number().min(1).max(10).default(3) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { tenantId, query, top_k } = parse.data;

  const qEmbed = await embed(query);
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
});

async function bootstrap() {
  try {
    console.log('Inicializando servidor...');
    
    // Tentar inicializar PostgreSQL primeiro
    if (process.env.DATABASE_URL) {
      try {
        console.log('Inicializando PostgreSQL...');
        initializePool();
        await migratePG();
        console.log('PostgreSQL inicializado com sucesso!');
      } catch (error) {
        console.error('Erro ao inicializar PostgreSQL:', error);
        console.log('Usando SQLite como fallback...');
      }
    }
    
    // Sempre inicializar SQLite como fallback
    console.log('Inicializando SQLite...');
    const { db, SQL } = await openDatabase();
    migrate(db);
    persistDatabase(SQL, db);
    db.close();
    console.log('SQLite inicializado com sucesso!');
    
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

bootstrap();
