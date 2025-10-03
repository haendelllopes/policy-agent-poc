import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { openDatabase, migrate, persistDatabase, runExec, runQuery } from './db';
import { z } from 'zod';

const app = express();
app.use(express.json({ limit: '2mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function simpleChunk(text: string, size = 1000, overlap = 200): string[] {
  if (text.length === 0) return [];
  if (size <= 0) size = 500;
  if (overlap < 0) overlap = 0;
  if (overlap >= size) overlap = Math.floor(size / 3);
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    const nextStart = end - overlap;
    if (nextStart <= start) {
      start = end; // avança para evitar loop infinito
    } else {
      start = nextStart;
    }
  }
  return chunks;
}

async function embed(text: string): Promise<number[]> {
  // POC: embedding fake determinístico baseado em hash simples
  const vecSize = 128;
  const vector = new Array(vecSize).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    vector[code % vecSize] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

function cosine(a: number[], b: number[]): number {
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

app.get('/health', (_req: any, res: any) => {
  res.json({ ok: true });
});

app.post('/tenants', async (req: any, res: any) => {
  const schema = z.object({ name: z.string().min(1) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const id = uuidv4();
  const { db, SQL } = await openDatabase();
  try {
    runExec(db, 'INSERT INTO tenants (id, name) VALUES (?, ?)', [id, parse.data.name]);
    persistDatabase(SQL, db);
    res.status(201).json({ id, name: parse.data.name });
  } finally {
    db.close();
  }
});

app.post('/documents/upload', upload.single('file'), async (req: any, res: any) => {
  const schema = z.object({ tenantId: z.string().uuid(), title: z.string().min(1), category: z.string().optional(), version: z.string().optional() });
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  if (!req.file) return res.status(400).json({ error: 'Arquivo ausente' });

  const text = req.file.buffer.toString('utf8'); // MVP: assume texto
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

app.post('/search/policy', async (req: any, res: any) => {
  const schema = z.object({ tenantId: z.string().uuid(), query: z.string().min(1), top_k: z.number().min(1).max(10).default(3) });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { tenantId, query, top_k } = parse.data;

  const qEmbed = await embed(query);
  const { db } = await openDatabase();
  try {
    const rows = runQuery<{ id: string; content: string; embedding: string; title: string; version: string; section: string }>(
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


