require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { openDatabase, migrate, persistDatabase, runExec, runQuery } = require('./db');
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
  const { db } = await openDatabase();
  try {
    const tenants = runQuery(db, 'SELECT * FROM tenants WHERE subdomain = ?', [subdomain]);
    return tenants[0] || null;
  } finally {
    db.close();
  }
}

app.get('/tenants', async (_req, res) => {
  const { db } = await openDatabase();
  try {
    const tenants = runQuery(db, 'SELECT id, name, subdomain FROM tenants ORDER BY name');
    res.json(tenants);
  } finally {
    db.close();
  }
});

app.post('/tenants', async (req, res) => {
  const schema = z.object({ 
    name: z.string().min(1),
    subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Subdomain deve conter apenas letras minúsculas, números e hífens')
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  
  const { db, SQL } = await openDatabase();
  try {
    // Verificar se subdomain já existe
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
});

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
      [userId, tenant.id, parse.data.name, parse.data.email, parse.data.phone, parse.data.position, parse.data.department || null, parse.data.start_date || null]);
    
    persistDatabase(SQL, db);
    
    // Disparar webhook para n8n
    try {
      const webhookData = {
        tenantId: tenant.id,
        tenantName: tenant.name,
        userId: userId,
        name: parse.data.name,
        email: parse.data.email,
        phone: parse.data.phone,
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
      phone: parse.data.phone,
      position: parse.data.position,
      department: parse.data.department,
      start_date: parse.data.start_date,
      tenant: tenant.name
    });
  } finally {
    db.close();
  }
});

// Endpoint para listar usuários do tenant atual
app.get('/users', async (req, res) => {
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
  const { db, SQL } = await openDatabase();
  migrate(db);
  persistDatabase(SQL, db);
  db.close();
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`API up on http://localhost:${port}`));
}

bootstrap();
