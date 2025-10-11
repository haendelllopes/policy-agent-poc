require('dotenv').config();
const express = require('express');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
// pdf-parse não funciona no Vercel (requer @napi-rs/canvas)
// const pdfParse = require('pdf-parse');
const { openDatabase, migrate, persistDatabase, runExec, runQuery } = require('./db');
const { initializePool, query, migrate: migratePG, getTenantBySubdomain: getTenantBySubdomainPG, getUsersByTenant, getDocumentsByTenant, getChunksByDocument, closePool, getPool } = require('./db-pg');
const { analyzeDocument } = require('./document-analyzer');
const TelegramBot = require('./telegram-bot');
const QRCode = require('qrcode');

// Cache simples para dados quando PostgreSQL está instável
const dataCache = {
  users: new Map(),
  documents: new Map(),
  departments: new Map(),
  categories: new Map(),
  positions: new Map(),
  lastUpdate: new Map()
};

const CACHE_DURATION = 20000; // 20 segundos - mais responsivo
const { z } = require('zod');

// Função para verificar se o cache é válido
function isCacheValid(tenantId, dataType) {
  const lastUpdate = dataCache.lastUpdate.get(`${tenantId}-${dataType}`);
  if (!lastUpdate) return false;
  return (Date.now() - lastUpdate) < CACHE_DURATION;
}

// Função para obter dados do cache ou buscar novos
async function getCachedData(tenantId, dataType, fetchFunction) {
  // Verificar se o cache para este tipo de dados existe
  if (!dataCache[dataType]) {
    console.log(`Cache para ${dataType} não inicializado, criando...`);
    dataCache[dataType] = new Map();
  }
  
  if (isCacheValid(tenantId, dataType)) {
    console.log(`Usando cache para ${dataType} do tenant ${tenantId}`);
    return dataCache[dataType].get(tenantId);
  }
  
  try {
    console.log(`Buscando dados frescos para ${dataType} do tenant ${tenantId}`);
    const data = await fetchFunction();
    
    // Garantir que o cache existe antes de usar
    if (!dataCache[dataType]) {
      dataCache[dataType] = new Map();
    }
    if (!dataCache.lastUpdate) {
      dataCache.lastUpdate = new Map();
    }
    
    dataCache[dataType].set(tenantId, data);
    dataCache.lastUpdate.set(`${tenantId}-${dataType}`, Date.now());
    return data;
  } catch (error) {
    console.log(`Erro ao buscar ${dataType}, usando cache se disponível:`, error.message);
    
    // Verificar se o cache existe antes de tentar usar
    if (dataCache[dataType]) {
    const cachedData = dataCache[dataType].get(tenantId);
    if (cachedData) {
      console.log(`Usando dados em cache para ${dataType} do tenant ${tenantId}`);
      return cachedData;
    }
    }
    
    // Se não há cache disponível, retornar dados vazios em vez de falhar
    console.log(`Nenhum cache disponível para ${dataType}, retornando dados vazios`);
    return [];
  }
}

// Função para gerar ETag baseado no conteúdo dos dados
function generateETag(data) {
  const crypto = require('crypto');
  const content = JSON.stringify(data);
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

// Middleware para cache HTTP com ETag
function httpCacheMiddleware(req, res, next) {
  const originalJson = res.json;
  let headersSent = false;
  
  res.json = function(data) {
    // Evitar definir headers se já foram enviados
    if (headersSent) {
      return originalJson.call(this, data);
    }
    
    try {
      // Gerar ETag baseado nos dados
      const etag = generateETag(data);
      
      // Verificar se o cliente já tem a versão mais recente
      const clientETag = req.headers['if-none-match'];
      if (clientETag === etag) {
        if (!res.headersSent) {
          res.status(304).end();
          headersSent = true;
        }
        return;
      }
      
      // Definir headers de cache apenas se ainda não foram enviados
      if (!res.headersSent) {
        res.set({
          'ETag': etag,
          'Cache-Control': 'public, max-age=60', // Cache por 60 segundos
          'Last-Modified': new Date().toUTCString()
        });
      }
      
      // Enviar dados
      originalJson.call(this, data);
      headersSent = true;
    } catch (error) {
      console.error('Erro no middleware de cache:', error);
      // Fallback para resposta normal
      originalJson.call(this, data);
    }
  };
  
  next();
}

const app = express();
// Compressão gzip para respostas menores
app.use(compression({ threshold: 512 }));
// Medir tempo de resposta
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  
  // Interceptar o evento 'finish' de forma mais segura
  const originalFinish = res.emit;
  res.emit = function(event, ...args) {
    if (event === 'finish' && !res.headersSent) {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;
      try {
        res.setHeader('X-Response-Time', `${durationMs.toFixed(1)}ms`);
      } catch (error) {
        // Ignorar erro se headers já foram enviados
        console.log('Erro ao definir X-Response-Time:', error.message);
      }
    }
    return originalFinish.call(this, event, ...args);
  };
  
  next();
});
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

// Página inicial do dashboard (redireciona para dashboard.html)
app.get('/inicio', (req, res) => {
  res.redirect('/dashboard.html' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''));
});

// Página de funcionários
app.get('/funcionarios', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/funcionarios.html'));
});

// Página de trilhas (Admin)
app.get('/admin-trilhas', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/admin-trilhas.html'));
});

// Páginas do Colaborador - Portal de Trilhas
app.get('/colaborador-trilhas', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/colaborador-trilhas.html'));
});

app.get('/colaborador-trilha-detalhes', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/colaborador-trilha-detalhes.html'));
});

app.get('/colaborador-quiz', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/colaborador-quiz.html'));
});

app.get('/colaborador-ranking', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/colaborador-ranking.html'));
});

// Página de documentos
app.get('/documentos', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/documentos.html'));
});

// Página de configurador
app.get('/configurador', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/configurador.html'));
});

// Páginas de configuração
app.get('/configurador-categorias', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/configurador-categorias.html'));
});

app.get('/configurador-cargos', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/configurador-cargos.html'));
});

app.get('/configurador-departamentos', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, '../public/configurador-departamentos.html'));
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

// Aplicar cache HTTP para rotas GET da API - DESABILITADO TEMPORARIAMENTE
// app.use('/api', (req, res, next) => {
//   if (req.method === 'GET') {
//     httpCacheMiddleware(req, res, next);
//   } else {
//     next();
//   }
// });

// ============================================
// FUNÇÕES COMPARTILHADAS (precisam estar antes das rotas)
// ============================================
// Serão definidas mais abaixo, mas exportadas via app.locals

// ============================================

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
  // Sempre tentar PostgreSQL primeiro
  if (await usePostgres()) {
    try {
      const result = await query('SELECT * FROM tenants WHERE subdomain = $1', [subdomain]);
      if (result.rows.length > 0) {
        return result.rows[0];
      }
    } catch (error) {
      console.error('Erro ao buscar tenant no PostgreSQL:', error);
      // Se erro de conexão, não usar dados demo
      if (error.message.includes('Connection terminated') || error.message.includes('timeout')) {
        throw error; // Re-throw para que o endpoint retorne erro 500
      }
    }
  }
  
  // Se chegou aqui, PostgreSQL não está disponível ou não encontrou tenant
  throw new Error('PostgreSQL não disponível');
}

// Helper para decidir se PostgreSQL está disponível (via DATABASE_URL ou PG*)
async function usePostgres() {
  // Sempre tentar PostgreSQL primeiro, com fallback apenas em caso de erro
  try {
    if (!getPool()) {
      await initializePool();
    }
    
    // Testar conexão com uma query simples
    try {
      await query('SELECT 1 as test');
      return true;
    } catch (testError) {
      console.log('Teste de conexão PostgreSQL falhou:', testError.message);
      return false;
    }
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
    if (await usePostgres()) {
      try {
        // Garantir que o pool está inicializado
        if (!getPool()) {
          console.log('Inicializando pool PostgreSQL...');
          await initializePool();
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
    if (await usePostgres()) {
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
      await query(`
        INSERT INTO public.users (
          id, tenant_id, name, email, phone, 
          position, department, role,
          start_date, status, 
          onboarding_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        userId, tenantId, parse.data.userName, parse.data.userEmail, 'Não informado', 
        'Administrador', 'Administração', 'admin',
        new Date().toISOString().split('T')[0], 'active',
        'nao_iniciado', new Date().toISOString()
      ]);
      
      await query('COMMIT');

      // Disparar webhook para n8n (admin criado)
      try {
        const webhookData = {
          type: 'user_created',
          tenantId: tenantId,
          tenantName: parse.data.name,
          userId: userId,
          name: parse.data.userName,
          email: parse.data.userEmail,
          phone: 'Não informado',
          position: 'Administrador',
          department: 'Administração',
          start_date: new Date().toISOString().split('T')[0],
          communication_type: null, // Admin recém-criado, ainda não configurou
          created_at: new Date().toISOString()
        };
          
        await fetch('https://hndll.app.n8n.cloud/webhook/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook para admin:', webhookError);
        // Não falhar a criação do tenant por causa do webhook
      }

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

        const tenantId = uuidv4();
        const userId = uuidv4();
        
        // Criar tenant
        runExec(db, 'INSERT INTO tenants (id, name, subdomain) VALUES (?, ?, ?)', [tenantId, parse.data.name, parse.data.subdomain]);
        
        // Criar usuário admin
        runExec(db, `INSERT INTO users (
          id, tenant_id, name, email, phone, 
          position, department, role,
          start_date, status,
          onboarding_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [userId, tenantId, parse.data.userName, parse.data.userEmail, 'Não informado', 
           'Administrador', 'Administração', 'admin',
           new Date().toISOString().split('T')[0], 'active',
           'nao_iniciado']);
        
        persistDatabase(SQL, db);
        
        res.status(201).json({ 
          tenant: { id: tenantId, name: parse.data.name, subdomain: parse.data.subdomain },
          user: { id: userId, name: parse.data.userName, email: parse.data.userEmail }
        });
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
    if (await usePostgres()) {
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
      position: z.string().optional(), // DEPRECATED: manter por compatibilidade
      department: z.string().optional(), // DEPRECATED: manter por compatibilidade
      position_id: z.string().uuid().optional(), // NOVO: usar FK
      department_id: z.string().uuid().optional(), // NOVO: usar FK
      role: z.enum(['admin', 'colaborador']).optional().default('colaborador'), // NOVO: role do usuário
      start_date: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional()
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
    if (await usePostgres()) {
      // PostgreSQL
      const existing = await query('SELECT id FROM users WHERE tenant_id = $1 AND email = $2', [tenant.id, parse.data.email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
      }

      userId = uuidv4();
      const onboardingInicio = parse.data.start_date || new Date().toISOString().split('T')[0];
      
      await query(`
        INSERT INTO users (
          id, tenant_id, name, email, phone, 
          position, department, position_id, department_id, role,
          start_date, status, 
          onboarding_status, onboarding_inicio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        userId, tenant.id, parse.data.name, parse.data.email, normalizedPhone,
        parse.data.position || null, parse.data.department || null, 
        parse.data.position_id || null, parse.data.department_id || null,
        parse.data.role || 'colaborador',
        onboardingInicio, parse.data.status || 'active',
        'em_andamento', onboardingInicio
      ]);
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
        const onboardingInicio = parse.data.start_date || new Date().toISOString().split('T')[0];
        
        runExec(db, `INSERT INTO users (
          id, tenant_id, name, email, phone, 
          position, department, position_id, department_id, role,
          start_date, status,
          onboarding_status, onboarding_inicio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [userId, tenant.id, parse.data.name, parse.data.email, normalizedPhone, 
           parse.data.position || null, parse.data.department || null,
           parse.data.position_id || null, parse.data.department_id || null,
           parse.data.role || 'colaborador',
           onboardingInicio, parse.data.status || 'active',
           'em_andamento', onboardingInicio]);
        
        persistDatabase(SQL, db);
      } finally {
        db.close();
      }
    }

    // Disparar webhook para n8n
    try {
      // Buscar tipo de comunicação do tenant
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
        phone: whatsappPhone, // Telefone sem + para WhatsApp
        position: parse.data.position,
        department: parse.data.department,
        start_date: parse.data.start_date,
        communication_type: communicationType, // Adicionar tipo de comunicação
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
      position_id: parse.data.position_id,
      department_id: parse.data.department_id,
      role: parse.data.role || 'colaborador',
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

// Endpoint para testar conectividade PostgreSQL
app.get('/api/debug/test-pg-connection', async (req, res) => {
  try {
    console.log('Testando conectividade PostgreSQL...');
    
    if (!(await usePostgres())) {
      return res.status(500).json({ error: 'PostgreSQL não disponível' });
    }
    
    const start = Date.now();
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    const duration = Date.now() - start;
    
    res.json({
      success: true,
      message: 'Conexão PostgreSQL funcionando',
      duration: `${duration}ms`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao testar conexão PostgreSQL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      type: error.constructor.name
    });
  }
});

// Endpoint para criar tenant demo se não existir
app.post('/api/debug/create-demo-tenant', async (req, res) => {
  try {
    console.log('Criando tenant demo no PostgreSQL...');
    
    if (!(await usePostgres())) {
      return res.status(500).json({ error: 'PostgreSQL não disponível' });
    }
    
    // Verificar se tenant demo já existe
    const existing = await query('SELECT id FROM tenants WHERE subdomain = $1', ['demo']);
    if (existing.rows.length > 0) {
      return res.json({ message: 'Tenant demo já existe', tenant_id: existing.rows[0].id });
    }
    
    // Criar tenant demo
    const tenantId = uuidv4();
    await query('INSERT INTO tenants (id, name, subdomain, created_at) VALUES ($1, $2, $3, NOW())', 
      [tenantId, 'Empresa Demo', 'demo']);
    
    // Criar usuário demo
    const userId = uuidv4();
    await query('INSERT INTO users (id, tenant_id, name, email, phone, position, department, start_date, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())', 
      [userId, tenantId, 'Haendell', 'haend@demo.com', '+5562912345678', 'Desenvolvedor', 'TI', '2024-01-01', 'active']);
    
    // Criar departamentos demo
    const dept1Id = uuidv4();
    const dept2Id = uuidv4();
    await query('INSERT INTO departments (id, tenant_id, name, created_at) VALUES ($1, $2, $3, NOW())', 
      [dept1Id, tenantId, 'TI']);
    await query('INSERT INTO departments (id, tenant_id, name, created_at) VALUES ($1, $2, $3, NOW())', 
      [dept2Id, tenantId, 'RH']);
    
    res.json({ 
      message: 'Tenant demo criado com sucesso',
      tenant_id: tenantId,
      user_id: userId,
      departments: [dept1Id, dept2Id]
    });
  } catch (error) {
    console.error('Erro ao criar tenant demo:', error);
    res.status(500).json({ error: 'Erro ao criar tenant demo: ' + error.message });
  }
});

// Endpoint para buscar usuário específico
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('GET /users/:id - userId:', userId);
    console.log('GET /users/:id - tenantSubdomain:', req.tenantSubdomain);
    
    // Buscar tenant pelo subdomain
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    console.log('GET /users/:id - tenant:', tenant);
    
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    // Use PostgreSQL if available, otherwise SQLite
    let user;
    if (await usePostgres()) {
      // PostgreSQL
      const result = await query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenant.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
      }
      user = result.rows[0];
    } else {
      // SQLite fallback
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

// Endpoint para editar usuário
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('PUT /users/:id - userId:', userId);
    console.log('PUT /users/:id - tenantSubdomain:', req.tenantSubdomain);
    
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      position: z.string().optional(), // DEPRECATED
      department: z.string().optional(), // DEPRECATED
      position_id: z.string().uuid().optional(), // NOVO
      department_id: z.string().uuid().optional(), // NOVO
      role: z.enum(['admin', 'colaborador']).optional(), // NOVO: role do usuário
      start_date: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional()
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    // Normalizar telefone para banco (com +)
    const normalizedPhone = normalizePhone(parse.data.phone);
    
    // Buscar tenant pelo subdomain
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    // Use PostgreSQL if available, otherwise SQLite
    if (await usePostgres()) {
      // PostgreSQL - Verificar se usuário existe
      const existing = await query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenant.id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
      }

      // Verificar se email já existe em outro usuário
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND tenant_id = $2 AND id != $3', [parse.data.email, tenant.id, userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
      }

      await query(`
        UPDATE users SET 
          name = $1, email = $2, phone = $3, 
          position = $4, department = $5, 
          position_id = $6, department_id = $7,
          role = $8,
          start_date = $9, status = $10,
          updated_at = NOW()
        WHERE id = $11 AND tenant_id = $12
      `, [
        parse.data.name, parse.data.email, normalizedPhone, 
        parse.data.position || null, parse.data.department || null,
        parse.data.position_id || null, parse.data.department_id || null,
        parse.data.role || 'colaborador',
        parse.data.start_date || null, parse.data.status || 'active', 
        userId, tenant.id
      ]);
    } else {
      // SQLite fallback
      const { db } = await openDatabase();
      try {
        // Verificar se usuário existe
        const existing = runQuery(db, 'SELECT id FROM users WHERE id = ? AND tenant_id = ?', [userId, tenant.id]);
        if (existing.length === 0) {
          return res.status(404).json({ error: { formErrors: ['Usuário não encontrado'] } });
        }

        // Verificar se email já existe em outro usuário
        const emailCheck = runQuery(db, 'SELECT id FROM users WHERE email = ? AND tenant_id = ? AND id != ?', [parse.data.email, tenant.id, userId]);
        if (emailCheck.length > 0) {
          return res.status(400).json({ error: { formErrors: ['Email já cadastrado neste tenant'] } });
        }

        runExec(db, `UPDATE users SET 
          name = ?, email = ?, phone = ?, 
          position = ?, department = ?, 
          position_id = ?, department_id = ?,
          role = ?,
          start_date = ?, status = ?, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND tenant_id = ?`, 
          [parse.data.name, parse.data.email, normalizedPhone, 
           parse.data.position || null, parse.data.department || null,
           parse.data.position_id || null, parse.data.department_id || null,
           parse.data.role || 'colaborador',
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
      role: parse.data.role || 'colaborador',
      start_date: parse.data.start_date,
      status: parse.data.status || 'active',
      tenant: tenant.name
    });
  } catch (error) {
    console.error('Erro ao editar usuário:', error);
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
    if (await usePostgres()) {
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

    if (await usePostgres()) {
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
    // Use PostgreSQL with cache fallback
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
              u.role,
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

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, category, department, description } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    
    if (!category || category.trim() === '') {
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
    
    if (!allowedTypes.includes(req.file.mimetype) && !allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ error: 'Tipo de arquivo não suportado. Use PDF, DOCX, DOC ou TXT.' });
    }
    
    if (req.file.size > 5 * 1024 * 1024) { // 5MB
      return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5MB' });
    }

    const documentId = uuidv4();
    const createdAt = new Date().toISOString();
    const fileData = req.file.buffer.toString('base64');
    
    // Análise do documento com IA (assíncrono)
    let analysis = null;
    try {
      console.log('Iniciando análise de IA do documento...');
      analysis = await analyzeDocument(req.file.buffer, req.file.originalname, req.file.mimetype, title);
      console.log('Análise de IA concluída:', analysis.classification);
    } catch (analysisError) {
      console.error('Erro na análise de IA (continuando upload):', analysisError.message);
      // Continua o upload mesmo se a análise falhar
    }
    
    // Use PostgreSQL if available, otherwise SQLite
    if (await usePostgres()) {
      // PostgreSQL
      await query('INSERT INTO documents (id, tenant_id, title, category, department, description, file_name, file_data, file_size, status, created_at, extracted_text, ai_classification, sentiment_score, ai_summary, ai_tags, word_count, language, analysis_status, analyzed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)', [
        documentId,
        tenant.id,
        title,
        analysis ? analysis.classification : category, // Usar classificação da IA se disponível
        department || null,
        description || null,
        req.file.originalname,
        fileData,
        req.file.size,
        'published',
        createdAt,
        analysis ? analysis.extractedText : null,
        analysis ? analysis.classification : null,
        analysis ? analysis.sentiment : null,
        analysis ? analysis.summary : null,
        analysis ? JSON.stringify(analysis.tags) : null,
        analysis ? analysis.wordCount : null,
        analysis ? analysis.language : null,
        analysis ? 'completed' : 'failed',
        analysis ? new Date().toISOString() : null,
      ]);
      
      // Se análise foi bem-sucedida, salvar embedding
      if (analysis && analysis.embedding) {
        try {
          await query('UPDATE documents SET embedding = $1 WHERE id = $2', [
            JSON.stringify(analysis.embedding),
            documentId
          ]);
        } catch (embeddingError) {
          console.error('Erro ao salvar embedding:', embeddingError.message);
        }
      }
    } else {
      // SQLite fallback (sem embeddings)
      const db = await openDatabase();
      try {
        await runExec(db, 'INSERT INTO documents (id, tenant_id, title, category, department, description, file_name, file_data, file_size, status, created_at, extracted_text, ai_classification, sentiment_score, ai_summary, ai_tags, word_count, language, analysis_status, analyzed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
          documentId,
          tenant.id,
          title,
          analysis ? analysis.classification : category,
          department || null,
          description || null,
          req.file.originalname,
          fileData,
          req.file.size,
          'published',
          createdAt,
          analysis ? analysis.extractedText : null,
          analysis ? analysis.classification : null,
          analysis ? analysis.sentiment : null,
          analysis ? analysis.summary : null,
          analysis ? JSON.stringify(analysis.tags) : null,
          analysis ? analysis.wordCount : null,
          analysis ? analysis.language : null,
          analysis ? 'completed' : 'failed',
          analysis ? new Date().toISOString() : null,
        ]);
        await persistDatabase(db);
      } finally {
        db.close();
      }
    }

    // Notificar n8n (não bloqueante)
    try {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://hndll.app.n8n.cloud/webhook/onboarding';
      const payload = {
        type: 'document_categorization',
        documentId,
        tenantId: tenant.id,
        title,
        category: analysis ? analysis.classification : category,
        content: analysis ? analysis.extractedText : '',
        department: department || null,
        description: description || null,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        createdAt,
        // Dados de análise de IA
        aiAnalysis: analysis ? {
          classification: analysis.classification,
          sentiment: analysis.sentiment,
          summary: analysis.summary,
          tags: analysis.tags,
          wordCount: analysis.wordCount,
          language: analysis.language,
          status: 'completed'
        } : {
          status: 'failed'
        }
      };
      // Em ambientes sem fetch global, você pode trocar por node-fetch
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('Webhook n8n enviado com sucesso');
    } catch (webhookError) {
      console.error('Falha ao enviar webhook para n8n (ignorado):', webhookError.message);
    }

    // Invalidar cache
    dataCache.documents.delete(tenant.id);
    dataCache.lastUpdate.delete(`${tenant.id}-documents`);

    res.json({ 
      success: true, 
        documentId,
      message: 'Documento enviado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao fazer upload do documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para listar documentos do tenant
app.get('/api/documents', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    // Cache por tenant para documentos
    const documents = await getCachedData(tenant.id, 'documents', async () => {
        if (await usePostgres()) {
          const result = await query(
            'SELECT id, title, category, status, file_name, file_size, description, ai_classification, sentiment_score, ai_summary, ai_tags, word_count, analysis_status, analyzed_at FROM documents WHERE tenant_id = $1 ORDER BY created_at DESC',
            [tenant.id]
          );
          return result.rows;
      } else {
        const demoData = getDemoData();
        return demoData.documents.filter(doc => doc.tenant_id === tenant.id);
      }
    });
    res.json(documents);
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para buscar documento específico
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    if (await usePostgres()) {
      const result = await query(
        'SELECT id, title, category, status, file_name, file_size, description, department FROM documents WHERE id = $1 AND tenant_id = $2',
        [id, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      
      res.json(result.rows[0]);
    } else {
      const demoData = getDemoData();
      const document = demoData.documents.find(doc => doc.id === id && doc.tenant_id === tenant.id);
      
      if (!document) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      
      res.json(document);
    }
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para download de documento
app.get('/api/documents/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    if (await usePostgres()) {
      const result = await query(
        'SELECT file_name, file_data FROM documents WHERE id = $1 AND tenant_id = $2',
        [id, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      
      const document = result.rows[0];
      const buffer = Buffer.from(document.file_data, 'base64');
      
      // Definir Content-Type baseado na extensão
      const ext = document.file_name.split('.').pop().toLowerCase();
      const mimeTypes = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'txt': 'text/plain'
      };
      
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
      res.send(buffer);
    } else {
      res.status(404).json({ error: 'Download não disponível em modo demo' });
    }
  } catch (error) {
    console.error('Erro ao fazer download do documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para atualizar documento
app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, department, description } = req.body;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    if (await usePostgres()) {
      const result = await query(
        'UPDATE documents SET title = $1, category = $2, department = $3, description = $4, updated_at = $5 WHERE id = $6 AND tenant_id = $7 RETURNING *',
        [title, category, department, description, new Date().toISOString(), id, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      
      // Invalidar cache
      dataCache.documents.delete(tenant.id);
      dataCache.lastUpdate.delete(`${tenant.id}-documents`);
      
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Edição não disponível em modo demo' });
    }
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para busca semântica de documentos
app.post('/api/documents/semantic-search', async (req, res) => {
  try {
    console.log('=== DEBUG SEMANTIC SEARCH ===');
    console.log('Request body:', req.body);
    console.log('Tenant subdomain:', req.tenantSubdomain);
    
    const { query: searchQuery, limit = 10 } = req.body;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    
    console.log('Tenant found:', tenant);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json({ error: 'Query de busca é obrigatória' });
    }

    if (await usePostgres()) {
      // Debug: verificar quantos documentos existem para o tenant
      const totalDocs = await query('SELECT COUNT(*) as count FROM documents WHERE tenant_id = $1', [tenant.id]);
      console.log('Total documents for tenant:', totalDocs.rows[0].count);
      
      // Debug: listar alguns documentos
      const sampleDocs = await query('SELECT id, title, category, analysis_status, ai_classification, ai_summary, description FROM documents WHERE tenant_id = $1 LIMIT 5', [tenant.id]);
      console.log('Sample documents:', sampleDocs.rows);
      
      // Primeiro, tentar busca semântica com embeddings
      try {
      const { generateEmbedding } = require('./document-analyzer');
      const queryEmbedding = await generateEmbedding(searchQuery);
      
      // Busca semântica usando embeddings
        const embeddingResult = await query(`
        SELECT 
          id, title, category, ai_classification, ai_summary, sentiment_score, 
            word_count, analysis_status, created_at, description, file_name,
          (embedding <=> $2) as similarity_distance
        FROM documents 
        WHERE tenant_id = $1 
          AND embedding IS NOT NULL 
          AND analysis_status = 'completed'
        ORDER BY embedding <=> $2
        LIMIT $3
      `, [tenant.id, JSON.stringify(queryEmbedding), limit]);
      
        console.log('Embedding search results:', embeddingResult.rows.length);
        
        // Se encontrou resultados com embeddings, retorna
        if (embeddingResult.rows.length > 0) {
          const documents = embeddingResult.rows.map(doc => ({
        ...doc,
        similarity_score: 1 - doc.similarity_distance
      }));
          console.log('Returning embedding results:', documents);
          return res.json(documents);
        }
      } catch (embeddingError) {
        console.log('Embedding search failed, falling back to text search:', embeddingError.message);
      }
      
      // Fallback: busca por texto simples
      const searchResult = await query(`
        SELECT 
          id, title, category, ai_classification, ai_summary, sentiment_score, 
          word_count, analysis_status, created_at, description, file_name
        FROM documents 
        WHERE tenant_id = $1 
          AND (
            LOWER(title) LIKE LOWER($2) OR 
            LOWER(category) LIKE LOWER($2) OR 
            LOWER(ai_classification) LIKE LOWER($2) OR
            LOWER(ai_summary) LIKE LOWER($2) OR
            LOWER(description) LIKE LOWER($2) OR
            LOWER(extracted_text) LIKE LOWER($2)
          )
        ORDER BY created_at DESC
        LIMIT $3
      `, [tenant.id, `%${searchQuery}%`, limit]);
      
      console.log('Text search results:', searchResult.rows.length);
      console.log('Text search results data:', searchResult.rows);
      
      const documents = searchResult.rows.map(doc => ({
        ...doc,
        similarity_score: 0.8 // Score fixo para busca por texto
      }));
      
      console.log('Returning text search results:', documents);
      res.json(documents);
    } else {
      res.status(404).json({ error: 'Busca semântica não disponível em modo demo' });
    }
  } catch (error) {
    console.error('Erro na busca semântica:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para excluir documento
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const documentId = req.params.id;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    if (await usePostgres()) {
      const result = await query(
        'DELETE FROM documents WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [documentId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }
      
      // Invalidar cache
      dataCache.documents.delete(tenant.id);
      dataCache.lastUpdate.delete(`${tenant.id}-documents`);
      
      res.json({ success: true, message: 'Documento excluído com sucesso' });
    } else {
      const db = await openDatabase();
      try {
        const result = await runQuery(db, 'DELETE FROM documents WHERE id = ? AND tenant_id = ?', [documentId, tenant.id]);
        
        if (result.changes === 0) {
          return res.status(404).json({ error: 'Documento não encontrado' });
        }
        
        await persistDatabase(db);
        res.json({ success: true, message: 'Documento excluído com sucesso' });
      } finally {
        db.close();
      }
    }
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
    if (await usePostgres()) {
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
    if (await usePostgres()) {
      // PostgreSQL - Atualizar documento com categorização
      const result = await query(
        'UPDATE documents SET category = $1 WHERE id = $2 AND tenant_id = $3',
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
  if (await usePostgres()) {
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

    // Cache por tenant para departamentos
    const departments = await getCachedData(tenant.id, 'departments', async () => {
    if (await usePostgres()) {
        const result = await query('SELECT id, name, created_at FROM departments WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
        return result.rows;
    } else {
      const demoData = getDemoData();
        return demoData.departments.filter(dept => dept.tenant_id === tenant.id);
    }
    });
    res.json(departments);
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
    
    // Cache por tenant para categorias
    const categories = await getCachedData(tenant.id, 'categories', async () => {
      const result = await query('SELECT id, name, created_at FROM categories WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
      return result.rows;
    });
    res.json(categories);
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
    
    // Cache por tenant para cargos
    const positions = await getCachedData(tenant.id, 'positions', async () => {
      const result = await query('SELECT id, name, created_at FROM positions WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
      return result.rows;
    });
    res.json(positions);
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
      await initializePool();
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

// ============================================
// IMPORTAR E REGISTRAR ROTAS MODULARES
// ============================================
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const trilhasRoutes = require('./routes/trilhas');
const colaboradorRoutes = require('./routes/colaborador');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');
const webhooksRoutes = require('./routes/webhooks');
const aiImprovementsRoutes = require('./routes/ai-improvements');
const sentimentosRoutes = require('./routes/sentimentos');
const trilhasRecomendadasRoutes = require('./routes/trilhas-recomendadas');
const anotacoesRoutes = require('./routes/anotacoes');
const analiseSentimentoRoutes = require('./routes/analise-sentimento');
const agenteAnotacoesRoutes = require('./routes/agente-anotacoes');
const trilhasSegmentacaoRoutes = require('./routes/trilhas-segmentacao');
const departmentsRoutes = require('./routes/departments');
const positionsRoutes = require('./routes/positions');

// Importar helpers
const { normalizePhone: normalizePhoneHelper, normalizePhoneForWhatsApp: normalizePhoneForWhatsAppHelper } = require('./utils/helpers');

// Disponibilizar funções compartilhadas para as rotas via app.locals
app.locals.getTenantBySubdomain = getTenantBySubdomain;
app.locals.usePostgres = usePostgres;
app.locals.getDemoData = getDemoData;
app.locals.getCachedData = getCachedData;
app.locals.normalizePhone = normalizePhoneHelper;
app.locals.normalizePhoneForWhatsApp = normalizePhoneForWhatsAppHelper;
app.locals.openDatabase = openDatabase;
app.locals.runQuery = runQuery;
app.locals.runExec = runExec;
app.locals.persistDatabase = persistDatabase;
app.locals.closeDatabase = (db) => db.close();

// Registrar rotas (comentadas temporariamente - manter endpoints antigos funcionando)
app.use('/api/auth', authRoutes);
// app.use('/api/users', usersRoutes);
app.use('/api/trilhas', trilhasRoutes);
app.use('/api/colaborador', colaboradorRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/gamificacao', quizRoutes); // Quiz routes contém gamificação
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/ai', aiImprovementsRoutes);
app.use('/api/sentimentos', sentimentosRoutes);
app.use('/api/trilhas-recomendadas', trilhasRecomendadasRoutes);
app.use('/api/anotacoes', anotacoesRoutes);
app.use('/api/analise-sentimento', analiseSentimentoRoutes);
app.use('/api/agente', agenteAnotacoesRoutes);
app.use('/api/trilhas', trilhasSegmentacaoRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/positions', positionsRoutes);

console.log('✅ Rotas modulares carregadas: auth, trilhas, colaborador, quiz, gamificação, admin, webhooks, sentimentos, trilhas-recomendadas, anotacoes, analise-sentimento, agente-anotacoes, trilhas-segmentacao, departments, positions');

// ============================================

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
      postgres: (await usePostgres()) ? 'available' : 'unavailable',
      time: new Date().toISOString(),
      database: {
        status: 'unknown',
        connectionTime: null,
        error: null
      }
    };

    // Testar conexão com o banco se PostgreSQL estiver disponível
    if (await usePostgres()) {
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
        await initializePool();
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
      if (await usePostgres()) {
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

// Endpoint para reprocessar documentos existentes
app.post('/api/documents/reprocess', async (req, res) => {
  try {
    if (!(await usePostgres())) {
      return res.status(400).json({ error: 'PostgreSQL não disponível' });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    console.log('Reprocessando documentos existentes para tenant:', tenant.id);

    // Buscar documentos sem embeddings ou com análise incompleta
    const documentsToReprocess = await query(`
      SELECT id, title, file_data, file_name, category
      FROM documents 
      WHERE tenant_id = $1 
        AND (embedding IS NULL OR analysis_status != 'completed')
        AND file_data IS NOT NULL
    `, [tenant.id]);

    console.log(`Encontrados ${documentsToReprocess.rows.length} documentos para reprocessar`);

    let processed = 0;
    let errors = 0;

    for (const doc of documentsToReprocess.rows) {
      try {
        // Decodificar file_data
        const fileBuffer = Buffer.from(doc.file_data, 'base64');
        
        // Analisar documento
        const analysis = await analyzeDocument(fileBuffer, doc.file_name, 'application/octet-stream', doc.title);
        
        if (analysis) {
          // Atualizar documento com nova análise
          await query(`
            UPDATE documents 
            SET 
              extracted_text = $1,
              ai_classification = $2,
              sentiment_score = $3,
              ai_summary = $4,
              ai_tags = $5,
              word_count = $6,
              language = $7,
              analysis_status = 'completed',
              analyzed_at = NOW(),
              embedding = $8
            WHERE id = $9
          `, [
            analysis.extractedText,
            analysis.classification,
            analysis.sentiment,
            analysis.summary,
            JSON.stringify(analysis.tags),
            analysis.wordCount,
            analysis.language,
            JSON.stringify(analysis.embedding),
            doc.id
          ]);
          
          processed++;
          console.log(`Documento ${doc.title} reprocessado com sucesso`);
        }
      } catch (error) {
        console.error(`Erro ao reprocessar documento ${doc.title}:`, error.message);
        errors++;
        
        // Marcar como falha
        await query(`
          UPDATE documents 
          SET analysis_status = 'failed', analyzed_at = NOW()
          WHERE id = $1
        `, [doc.id]);
      }
    }

    res.json({
      success: true,
      message: `Reprocessamento concluído`,
      processed,
      errors,
      total: documentsToReprocess.rows.length
    });

  } catch (error) {
    console.error('Erro no reprocessamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para popular dados demo no Supabase Pro
app.post('/api/demo/populate', async (req, res) => {
  try {
    if (!(await usePostgres())) {
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
          'INSERT INTO public.users (id, tenant_id, name, email, phone, position, department, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [userId, tenantId, user.name, user.email, user.phone, user.position, user.department, user.status, new Date().toISOString()]
        );
      }
      console.log('Usuários demo criados');
    }

    // Criar documentos demo se não existirem
    const docsCheck = await query('SELECT COUNT(*) as count FROM public.documents WHERE tenant_id = $1', [tenantId]);
    
    if (parseInt(docsCheck.rows[0].count) === 0) {
      const demoDocuments = [
        { 
          title: 'Manual do Colaborador', 
          category: 'Políticas Internas',
          description: 'Manual completo com todas as políticas internas da empresa, incluindo horários, benefícios e procedimentos.',
          ai_summary: 'Este manual contém as principais políticas internas da empresa, incluindo horários de trabalho, benefícios oferecidos, procedimentos administrativos e diretrizes de conduta profissional.',
          ai_classification: 'Políticas Internas'
        },
        { 
          title: 'Política de Férias', 
          category: 'Políticas Internas',
          description: 'Política detalhada sobre férias, incluindo direito a férias, período de gozo e procedimentos para solicitação.',
          ai_summary: 'Esta política define os direitos dos colaboradores em relação às férias, incluindo o período de 30 dias por ano, regras para agendamento e procedimentos administrativos.',
          ai_classification: 'Políticas Internas'
        },
        { 
          title: 'Código de Conduta', 
          category: 'Código de Conduta',
          description: 'Código de conduta ética e profissional que todos os colaboradores devem seguir.',
          ai_summary: 'Documento que estabelece os valores éticos da empresa, diretrizes de comportamento profissional e procedimentos para relatar violações.',
          ai_classification: 'Código de Conduta'
        },
        { 
          title: 'Manual de Procedimentos', 
          category: 'Manuais de Procedimentos',
          description: 'Manual com todos os procedimentos operacionais da empresa.',
          ai_summary: 'Manual detalhado com procedimentos operacionais, fluxos de trabalho e diretrizes para execução de tarefas administrativas.',
          ai_classification: 'Procedimentos'
        },
        { 
          title: 'Benefícios e Remuneração', 
          category: 'Benefícios e Remuneração',
          description: 'Documento detalhando todos os benefícios oferecidos pela empresa e estrutura de remuneração.',
          ai_summary: 'Este documento apresenta a estrutura completa de benefícios da empresa, incluindo plano de saúde, vale-refeição, participação nos lucros e política de remuneração.',
          ai_classification: 'Benefícios'
        }
      ];

      for (const doc of demoDocuments) {
        const docId = uuidv4();
        await query(
          'INSERT INTO public.documents (id, tenant_id, title, category, status, created_at, updated_at, description, ai_summary, ai_classification, analysis_status, analyzed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
          [docId, tenantId, doc.title, doc.category, 'published', new Date().toISOString(), new Date().toISOString(), doc.description, doc.ai_summary, doc.ai_classification, 'completed', new Date().toISOString()]
        );
      }
      console.log('Documentos demo criados');
    }

    res.json({ success: true, message: 'Dados demo populados com sucesso!' });
  } catch (error) {
    console.error('Erro ao popular dados demo:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/api/tenants/demo', async (req, res) => {
  try {
    if (await usePostgres()) {
      // Garantir que o pool está inicializado
      if (!getPool()) {
        console.log('Inicializando pool PostgreSQL...');
        await initializePool();
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
    if (await usePostgres()) {
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

// Endpoint para criar tabela tenant_settings manualmente
app.post('/api/debug/create-tenant-settings', async (req, res) => {
  try {
    if (await usePostgres()) {
      console.log('Criando tabela tenant_settings...');
      
      // Criar tabela tenant_settings
      await query(`
        CREATE TABLE IF NOT EXISTS tenant_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          setting_key VARCHAR(255) NOT NULL,
          setting_value TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(tenant_id, setting_key)
        )
      `);
      
      // Criar índice
      await query(`CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id)`);
      
      res.json({ message: 'Tabela tenant_settings criada com sucesso' });
    } else {
      res.status(500).json({ error: 'PostgreSQL não configurado' });
    }
  } catch (error) {
    console.error('Erro ao criar tabela tenant_settings:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para configurar RLS no Supabase
app.post('/api/debug/setup-rls', async (req, res) => {
  try {
    if (!(await usePostgres())) {
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
    if (await usePostgres()) {
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

// ===== CONFIGURADOR APIs =====

// Categories APIs
app.get('/api/categories', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    if (await usePostgres()) {
      const result = await query('SELECT * FROM categories WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
      res.json(result.rows);
    } else {
      // Demo data fallback
      const demoData = getDemoData();
      const categories = demoData.categories.filter(c => c.tenant_id === tenant.id);
      res.json(categories);
    }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (await usePostgres()) {
      const result = await query(
        'INSERT INTO categories (id, tenant_id, name, description, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [uuidv4(), tenant.id, name, description || null]
      );
      res.status(201).json(result.rows[0]);
    } else {
      // Demo data fallback
      const category = {
        id: uuidv4(),
        tenant_id: tenant.id,
        name,
        description: description || null,
        created_at: new Date().toISOString()
      };
      res.status(201).json(category);
    }
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const { name, description } = req.body;
    const categoryId = req.params.id;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (await usePostgres()) {
      const result = await query(
        'UPDATE categories SET name = $1, description = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *',
        [name, description || null, categoryId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
      
      res.json(result.rows[0]);
    } else {
      // Demo data fallback
      res.json({
        id: categoryId,
        tenant_id: tenant.id,
        name,
        description: description || null
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const categoryId = req.params.id;

    if (await usePostgres()) {
      const result = await query(
        'DELETE FROM categories WHERE id = $1 AND tenant_id = $2 RETURNING *',
        [categoryId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
      
      res.json({ message: 'Categoria excluída com sucesso' });
    } else {
      // Demo data fallback
      res.json({ message: 'Categoria excluída com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const categoryId = req.params.id;

    if (await usePostgres()) {
      const result = await query(
        'SELECT * FROM categories WHERE id = $1 AND tenant_id = $2',
        [categoryId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
      
      res.json(result.rows[0]);
    } else {
      // Demo data fallback
      const demoData = getDemoData();
      const category = demoData.categories.find(c => c.id === categoryId && c.tenant_id === tenant.id);
      
      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
      
      res.json(category);
    }
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Communication Type API
app.get('/api/communication-type', async (req, res) => {
  try {
    console.log('GET /api/communication-type - Tenant subdomain:', req.tenantSubdomain);
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    console.log('Tenant encontrado:', tenant ? tenant.name : 'não encontrado');
    
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    if (await usePostgres()) {
      const result = await query('SELECT * FROM tenant_settings WHERE tenant_id = $1 AND setting_key = $2', [tenant.id, 'communication_type']);
      console.log('Resultado da query:', result.rows);
      
      if (result.rows.length > 0) {
        console.log('Tipo de comunicação encontrado:', result.rows[0].setting_value);
        res.json({ type: result.rows[0].setting_value });
      } else {
        console.log('Nenhum tipo de comunicação configurado');
        res.json({ type: null });
      }
    } else {
      // Demo data fallback - return null for demo tenant
      console.log('PostgreSQL não disponível, retornando null');
      res.json({ type: null });
    }
  } catch (error) {
    console.error('Erro ao buscar tipo de comunicação:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/api/communication-type', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const { type } = req.body;
    
    if (!type || !['whatsapp', 'telegram', 'slack'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de comunicação inválido' });
    }

    if (await usePostgres()) {
      // Delete existing setting
      await query('DELETE FROM tenant_settings WHERE tenant_id = $1 AND setting_key = $2', [tenant.id, 'communication_type']);
      
      // Insert new setting
      await query(
        'INSERT INTO tenant_settings (id, tenant_id, setting_key, setting_value, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [uuidv4(), tenant.id, 'communication_type', type]
      );
      
      res.json({ type, message: 'Tipo de comunicação atualizado com sucesso' });
    } else {
      // Demo data fallback
      res.json({ type, message: 'Tipo de comunicação atualizado com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao atualizar tipo de comunicação:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint unificado para geração de links de comunicação (WhatsApp/Telegram/Slack)
app.post('/api/communication/generate-link', async (req, res) => {
  try {
    console.log('POST /api/communication/generate-link - Tenant subdomain:', req.tenantSubdomain);
    console.log('Request body:', req.body);
    
    let tenant = null;
    
    // Tentar buscar tenant, mas não falhar se PostgreSQL não estiver disponível
    try {
      tenant = await getTenantBySubdomain(req.tenantSubdomain);
      console.log('Tenant encontrado via banco:', tenant ? tenant.name : 'não encontrado');
    } catch (tenantError) {
      console.log('Aviso: não foi possível buscar tenant, usando dados do request:', tenantError.message);
      // Se não conseguir buscar tenant, usar dados do request diretamente
      tenant = {
        id: req.body.tenantId || 'demo-tenant',
        name: req.body.tenantName || 'Demo Tenant'
      };
      console.log('Usando tenant fallback:', tenant);
    }
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const schema = z.object({
      type: z.enum(['whatsapp', 'telegram', 'slack']),
      email: z.string().email().optional(),
      userId: z.string().uuid().optional(),
      name: z.string().optional(),
      phone: z.string().optional()
    }).refine((v) => Boolean(v.email || v.userId), { message: 'Informe email ou userId' });

    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { type, email, userId, name, phone } = parsed.data;

    // Buscar usuário no banco quando possível
    let finalUserId = userId || null;
    let finalName = name || '';
    let finalPhone = phone || '';
    
    if ((!finalUserId || !finalName) && email && (await usePostgres())) {
      try {
        const result = await query('SELECT id, name, phone FROM users WHERE tenant_id = $1 AND email = $2 LIMIT 1', [tenant.id, email]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          finalUserId = finalUserId || user.id;
          finalName = finalName || user.name;
          finalPhone = finalPhone || user.phone;
        }
      } catch (dbErr) {
        console.log('Aviso: falha ao consultar usuário por email:', dbErr.message);
      }
    }

    // Gerar identificador único para o usuário
    const baseStr = `${tenant.id}:${finalUserId || ''}:${email || ''}`;
    let identifier = Buffer.from(baseStr).toString('base64url');
    if (identifier.length > 64) {
      const crypto = require('crypto');
      identifier = crypto.createHash('sha256').update(baseStr).digest('base64url').slice(0, 64);
    }

    let result = {
      tenantId: tenant.id,
      type,
      identifier,
      user: {
        id: finalUserId,
        name: finalName,
        email: email || '',
        phone: finalPhone
      }
    };

    // Gerar links específicos por tipo de comunicação
    switch (type) {
      case 'telegram':
        const botUsername = process.env.TELEGRAM_BOT_USERNAME;
        if (!botUsername) {
          return res.status(500).json({ error: 'TELEGRAM_BOT_USERNAME não configurado no ambiente' });
        }
        
        const telegramDeepLink = `https://t.me/${botUsername}?start=${identifier}`;
        const qrDataUrl = await QRCode.toDataURL(telegramDeepLink, { width: 320, margin: 1 });
        
        result.deep_link = telegramDeepLink;
        result.qr_data_url = qrDataUrl;
        break;

      case 'slack':
        const slackTeamId = process.env.SLACK_TEAM_ID;
        const slackBotId = process.env.SLACK_BOT_ID;
        
        if (!slackTeamId) {
          return res.status(500).json({ error: 'SLACK_TEAM_ID não configurado no ambiente' });
        }

        // Deep link para abrir o Slack e iniciar conversa com o bot
        const slackDeepLink = `https://app.slack.com/client/${slackTeamId}`;
        const slackBotLink = slackBotId ? `${slackDeepLink}/D${slackBotId}` : slackDeepLink;
        
        // Link web alternativo (caso o deep link não funcione)
        const slackWebLink = `https://${process.env.SLACK_WORKSPACE_DOMAIN || 'workspace'}.slack.com/app_redirect?app=${slackBotId || 'BOT_ID'}`;
        
        result.deep_link = slackBotLink;
        result.web_link = slackWebLink;
        result.team_id = slackTeamId;
        break;

      case 'whatsapp':
        // Para WhatsApp, usar o número de telefone diretamente
        if (!finalPhone) {
          return res.status(400).json({ error: 'Telefone é obrigatório para WhatsApp' });
        }
        
        const whatsappLink = `https://wa.me/${finalPhone.replace(/\D/g, '')}`;
        const whatsappQr = await QRCode.toDataURL(whatsappLink, { width: 320, margin: 1 });
        
        result.deep_link = whatsappLink;
        result.qr_data_url = whatsappQr;
        result.phone = finalPhone;
        break;

      default:
        return res.status(400).json({ error: 'Tipo de comunicação não suportado' });
    }

    return res.json(result);
  } catch (error) {
    console.error('Erro ao gerar link de comunicação:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Positions APIs
app.get('/api/positions', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    if (await usePostgres()) {
      const result = await query('SELECT * FROM positions WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
      res.json(result.rows);
    } else {
      // Demo data fallback
      const demoData = getDemoData();
      const positions = demoData.positions.filter(p => p.tenant_id === tenant.id);
      res.json(positions);
    }
  } catch (error) {
    console.error('Erro ao buscar cargos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/api/positions', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (await usePostgres()) {
      const result = await query(
        'INSERT INTO positions (id, tenant_id, name, description, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [uuidv4(), tenant.id, name, description || null]
      );
      res.status(201).json(result.rows[0]);
    } else {
      // Demo data fallback
      const position = {
        id: uuidv4(),
        tenant_id: tenant.id,
        name,
        description: description || null,
        created_at: new Date().toISOString()
      };
      res.status(201).json(position);
    }
  } catch (error) {
    console.error('Erro ao criar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.put('/api/positions/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const { name, description } = req.body;
    const positionId = req.params.id;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (await usePostgres()) {
      const result = await query(
        'UPDATE positions SET name = $1, description = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *',
        [name, description || null, positionId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cargo não encontrado' });
      }
      
      res.json(result.rows[0]);
    } else {
      // Demo data fallback
      res.json({
        id: positionId,
        tenant_id: tenant.id,
        name,
        description: description || null
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.delete('/api/positions/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const positionId = req.params.id;

    if (await usePostgres()) {
      const result = await query(
        'DELETE FROM positions WHERE id = $1 AND tenant_id = $2 RETURNING *',
        [positionId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cargo não encontrado' });
      }
      
      res.json({ message: 'Cargo excluído com sucesso' });
    } else {
      // Demo data fallback
      res.json({ message: 'Cargo excluído com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao excluir cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.get('/api/positions/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const positionId = req.params.id;

    if (await usePostgres()) {
      const result = await query(
        'SELECT * FROM positions WHERE id = $1 AND tenant_id = $2',
        [positionId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cargo não encontrado' });
      }
      
      res.json(result.rows[0]);
    } else {
      // Demo data fallback
      const demoData = getDemoData();
      const position = demoData.positions.find(p => p.id === positionId && p.tenant_id === tenant.id);
      
      if (!position) {
        return res.status(404).json({ error: 'Cargo não encontrado' });
      }
      
      res.json(position);
    }
  } catch (error) {
    console.error('Erro ao buscar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Departments APIs
app.get('/api/departments', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    if (await usePostgres()) {
      const result = await query('SELECT * FROM departments WHERE tenant_id = $1 ORDER BY name', [tenant.id]);
      res.json(result.rows);
    } else {
      // Demo data fallback
      const demoData = getDemoData();
      const departments = demoData.departments.filter(d => d.tenant_id === tenant.id);
      res.json(departments);
    }
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (await usePostgres()) {
      const result = await query(
        'INSERT INTO departments (id, tenant_id, name, description, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [uuidv4(), tenant.id, name, description || null]
      );
      res.status(201).json(result.rows[0]);
    } else {
      // Demo data fallback
      const department = {
        id: uuidv4(),
        tenant_id: tenant.id,
        name,
        description: description || null,
        created_at: new Date().toISOString()
      };
      res.status(201).json(department);
    }
  } catch (error) {
    console.error('Erro ao criar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.put('/api/departments/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const { name, description } = req.body;
    const departmentId = req.params.id;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    if (await usePostgres()) {
      const result = await query(
        'UPDATE departments SET name = $1, description = $2 WHERE id = $3 AND tenant_id = $4 RETURNING *',
        [name, description || null, departmentId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Departamento não encontrado' });
      }
      
      res.json(result.rows[0]);
    } else {
      // Demo data fallback
      res.json({
        id: departmentId,
        tenant_id: tenant.id,
        name,
        description: description || null
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const departmentId = req.params.id;

    if (await usePostgres()) {
      const result = await query(
        'DELETE FROM departments WHERE id = $1 AND tenant_id = $2 RETURNING *',
        [departmentId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Departamento não encontrado' });
      }
      
      res.json({ message: 'Departamento excluído com sucesso' });
    } else {
      // Demo data fallback
      res.json({ message: 'Departamento excluído com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao excluir departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

app.get('/api/departments/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: { formErrors: ['Tenant não encontrado'] } });
    }

    const departmentId = req.params.id;

    if (await usePostgres()) {
      const result = await query(
        'SELECT * FROM departments WHERE id = $1 AND tenant_id = $2',
        [departmentId, tenant.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Departamento não encontrado' });
      }
      
      res.json(result.rows[0]);
    } else {
      // Demo data fallback
      const demoData = getDemoData();
      const department = demoData.departments.find(d => d.id === departmentId && d.tenant_id === tenant.id);
      
      if (!department) {
        return res.status(404).json({ error: 'Departamento não encontrado' });
      }
      
      res.json(department);
    }
  } catch (error) {
    console.error('Erro ao buscar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

