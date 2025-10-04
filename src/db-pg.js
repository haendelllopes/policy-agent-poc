const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL
let pool;

function initializePool() {
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.warn('DATABASE_URL não encontrada, usando SQLite local');
    return null;
  }
  
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  console.log('Pool PostgreSQL inicializado');
  return pool;
}

// Função para executar queries
async function query(text, params = []) {
  const pgPool = initializePool();
  
  if (!pgPool) {
    throw new Error('Pool PostgreSQL não inicializado');
  }
  
  try {
    const start = Date.now();
    const res = await pgPool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
}

// Função para executar transações
async function transaction(callback) {
  const pgPool = initializePool();
  
  if (!pgPool) {
    throw new Error('Pool PostgreSQL não inicializado');
  }
  
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Migração do banco de dados
async function migrate() {
  try {
    console.log('Executando migrações...');
    
    // Criar tabela tenants
    await query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Criar tabela users
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        position VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        start_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, email)
      )
    `);
    
    // Criar tabela documents
    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        version VARCHAR(50),
        status VARCHAR(50) DEFAULT 'published',
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Criar tabela chunks
    await query(`
      CREATE TABLE IF NOT EXISTS chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        section VARCHAR(255),
        content TEXT NOT NULL,
        embedding TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Criar índices
    await query(`CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(document_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_docs_tenant ON documents(tenant_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain)`);
    
    console.log('Migrações executadas com sucesso!');
  } catch (error) {
    console.error('Erro nas migrações:', error);
    throw error;
  }
}

// Função para buscar tenant por subdomain
async function getTenantBySubdomain(subdomain) {
  const result = await query('SELECT * FROM tenants WHERE subdomain = $1', [subdomain]);
  return result.rows[0] || null;
}

// Função para buscar usuários por tenant
async function getUsersByTenant(tenantId) {
  const result = await query(`
    SELECT id, name, email, phone, position, department, start_date, status, created_at 
    FROM users 
    WHERE tenant_id = $1 
    ORDER BY name
  `, [tenantId]);
  return result.rows;
}

// Função para buscar documentos por tenant
async function getDocumentsByTenant(tenantId) {
  const result = await query(`
    SELECT id, title, category, version, status, created_at 
    FROM documents 
    WHERE tenant_id = $1 
    ORDER BY created_at DESC
  `, [tenantId]);
  return result.rows;
}

// Função para buscar chunks por documento
async function getChunksByDocument(documentId) {
  const result = await query(`
    SELECT id, section, content, embedding 
    FROM chunks 
    WHERE document_id = $1 
    ORDER BY id
  `, [documentId]);
  return result.rows;
}

// Função para fechar o pool
async function closePool() {
  if (pool) {
    await pool.end();
    console.log('Pool PostgreSQL fechado');
  }
}

module.exports = {
  initializePool,
  query,
  transaction,
  migrate,
  getTenantBySubdomain,
  getUsersByTenant,
  getDocumentsByTenant,
  getChunksByDocument,
  closePool,
  getPool: () => pool
};
