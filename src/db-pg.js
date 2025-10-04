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
    
    // Criar tabela departments
    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, name)
      )
    `);
    
    // Criar tabela categories
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, name)
      )
    `);
    
    // Criar tabela positions
    await query(`
      CREATE TABLE IF NOT EXISTS positions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, name)
      )
    `);
    
    // Criar tabela tags
    await query(`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, name)
      )
    `);
    
    // Criar tabela document_tags
    await query(`
      CREATE TABLE IF NOT EXISTS document_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        tag_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(document_id, tag_name)
      )
    `);
    
    // Criar índices
    await query(`CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(document_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_docs_tenant ON documents(tenant_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)`);
    
    // Popular dados iniciais para todos os tenants existentes
    await seedInitialData();
    await query(`CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain)`);
    
    console.log('Migrações executadas com sucesso!');
  } catch (error) {
    console.error('Erro nas migrações:', error);
    throw error;
  }
}

// Função para popular dados iniciais
async function seedInitialData() {
  try {
    console.log('Populando dados iniciais...');
    
    // Obter todos os tenants existentes
    const tenantsResult = await query('SELECT id FROM tenants');
    const tenants = tenantsResult.rows;
    
    if (tenants.length === 0) {
      console.log('Nenhum tenant encontrado para popular dados iniciais');
      return;
    }
    
    // Dados iniciais
    const departments = [
      'Desenvolvimento', 'Recursos Humanos (RH)', 'Financeiro', 'Comercial', 
      'Marketing', 'Operações', 'Suporte Técnico', 'Qualidade', 'Jurídico', 'Administrativo'
    ];
    
    const positions = [
      'Desenvolvedor', 'Analista', 'Gerente', 'Coordenador', 'Supervisor',
      'Assistente', 'Diretor', 'Consultor', 'Especialista', 'Trainee'
    ];
    
    const categories = [
      'Políticas Internas', 'Manuais de Procedimentos', 'Benefícios e Remuneração',
      'Código de Conduta', 'Segurança e Saúde', 'Treinamentos', 'Contratos',
      'Relatórios', 'Formulários', 'Comunicados'
    ];
    
    const tags = ['Urgente', 'Confidencial', 'Obrigatório'];
    
    // Popular dados para cada tenant
    for (const tenant of tenants) {
      console.log(`Populando dados para tenant ${tenant.id}...`);
      
      // Inserir departamentos
      for (const dept of departments) {
        await query(
          'INSERT INTO departments (id, tenant_id, name, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (tenant_id, name) DO NOTHING',
          [require('uuid').v4(), tenant.id, dept, new Date().toISOString()]
        );
      }
      
      // Inserir cargos
      for (const pos of positions) {
        await query(
          'INSERT INTO positions (id, tenant_id, name, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (tenant_id, name) DO NOTHING',
          [require('uuid').v4(), tenant.id, pos, new Date().toISOString()]
        );
      }
      
      // Inserir categorias
      for (const cat of categories) {
        await query(
          'INSERT INTO categories (id, tenant_id, name, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (tenant_id, name) DO NOTHING',
          [require('uuid').v4(), tenant.id, cat, new Date().toISOString()]
        );
      }
      
      // Inserir tags
      for (const tag of tags) {
        await query(
          'INSERT INTO tags (id, tenant_id, name, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (tenant_id, name) DO NOTHING',
          [require('uuid').v4(), tenant.id, tag, new Date().toISOString()]
        );
      }
    }
    
    console.log('Dados iniciais populados com sucesso!');
  } catch (error) {
    console.error('Erro ao popular dados iniciais:', error);
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
