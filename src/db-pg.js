const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL
let pool;

function initializePool() {
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    // Tentar montar a conexão a partir de variáveis separadas (fallback)
    const host = process.env.PGHOST;
    const port = process.env.PGPORT || '5432';
    const database = process.env.PGDATABASE;
    const user = process.env.PGUSER;
    const password = process.env.PGPASSWORD;
    
    console.log('DATABASE_URL ausente. Verificando variáveis PG*:', {
      PGHOST: host ? 'SET' : 'MISSING',
      PGPORT: port,
      PGDATABASE: database ? 'SET' : 'MISSING',
      PGUSER: user ? 'SET' : 'MISSING',
      PGPASSWORD: password ? 'SET' : 'MISSING'
    });
    
    if (host && database && user && password) {
      // Se for host do Supabase direto, usar session pooler (IPv4)
      let finalHost = host;
      if (host.includes('db.gxqwfltteimexngybwna.supabase.co')) {
        finalHost = 'aws-1-sa-east-1.pooler.supabase.com';
        console.log('Usando session pooler Supabase para IPv4:', finalHost);
      }
      
      const assembled = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${finalHost}:${port}/${database}`;
      console.log('Usando variáveis PG* para montar a conexão:', assembled.substring(0, 50) + '...');
      return createPool(assembled);
    }
    
    console.warn('DATABASE_URL não encontrada e variáveis PG* ausentes. Usando SQLite local');
    return null;
  }
  
  try {
    // Validar se a URL é válida
    if (!connectionString.includes('postgres://') && !connectionString.includes('postgresql://')) {
      console.warn('DATABASE_URL inválida. Tentando interpretar com variáveis PG*...');
      const host = process.env.PGHOST;
      const port = process.env.PGPORT || '5432';
      const database = process.env.PGDATABASE;
      const user = process.env.PGUSER;
      const password = process.env.PGPASSWORD;
      if (host && database && user && password) {
        const assembled = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
        return createPool(assembled);
      }
      console.warn('Sem variáveis PG*. Usando SQLite local');
      return null;
    }
    return createPool(connectionString);
  } catch (error) {
    console.error('Erro ao criar pool PostgreSQL:', error.message);
    console.warn('Usando SQLite como fallback');
    return null;
  }
}

function createPool(connStr) {
  pool = new Pool({
    connectionString: connStr,
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
    
    // Criar tenant demo se não existir
    await createDemoTenant();
    
    // Popular dados iniciais para todos os tenants existentes
    await seedInitialData();
    await query(`CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain)`);
    
    console.log('Migrações executadas com sucesso!');
  } catch (error) {
    console.error('Erro nas migrações:', error);
    throw error;
  }
}

// Função para criar tenant demo se não existir
async function createDemoTenant() {
  try {
    console.log('Verificando se tenant demo existe...');
    
    // Verificar se tenant demo já existe
    const existing = await query('SELECT id FROM tenants WHERE subdomain = $1', ['demo']);
    
    if (existing.rows.length === 0) {
      console.log('Criando tenant demo...');
      const demoId = require('uuid').v4();
      await query(
        'INSERT INTO tenants (id, name, subdomain, created_at) VALUES ($1, $2, $3, $4)',
        [demoId, 'Empresa Demo', 'demo', new Date().toISOString()]
      );
      console.log('Tenant demo criado com sucesso!');
    } else {
      console.log('Tenant demo já existe');
    }
  } catch (error) {
    console.error('Erro ao criar tenant demo:', error);
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
      
      // Para o tenant demo, adicionar alguns dados de exemplo
      if (tenant.id === (await query('SELECT id FROM tenants WHERE subdomain = $1', ['demo'])).rows[0]?.id) {
        await seedDemoData(tenant.id);
      }
    }
    
    console.log('Dados iniciais populados com sucesso!');
  } catch (error) {
    console.error('Erro ao popular dados iniciais:', error);
  }
}

// Função para popular dados de exemplo do tenant demo
async function seedDemoData(tenantId) {
  try {
    console.log('Populando dados de exemplo para tenant demo...');
    
    // Verificar se já existem dados para o tenant demo
    const existingUsers = await query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
    const existingDocs = await query('SELECT COUNT(*) FROM documents WHERE tenant_id = $1', [tenantId]);
    
    if (existingUsers.rows[0].count > 0 || existingDocs.rows[0].count > 0) {
      console.log('Dados de exemplo já existem para tenant demo');
      return;
    }
    
    // Dados de exemplo para usuários
    const demoUsers = [
      { name: 'João Silva', email: 'joao@demo.com', phone: '11999999999', position: 'Desenvolvedor', department: 'Desenvolvimento' },
      { name: 'Maria Santos', email: 'maria@demo.com', phone: '11999999998', position: 'Analista', department: 'Recursos Humanos (RH)' },
      { name: 'Pedro Costa', email: 'pedro@demo.com', phone: '11999999997', position: 'Gerente', department: 'Financeiro' },
      { name: 'Ana Oliveira', email: 'ana@demo.com', phone: '11999999996', position: 'Coordenador', department: 'Comercial' },
      { name: 'Carlos Lima', email: 'carlos@demo.com', phone: '11999999995', position: 'Supervisor', department: 'Marketing' }
    ];
    
    // Dados de exemplo para documentos
    const demoDocuments = [
      { title: 'Manual do Colaborador', category: 'Políticas Internas' },
      { title: 'Política de Segurança', category: 'Políticas Internas' },
      { title: 'Código de Conduta', category: 'Código de Conduta' },
      { title: 'Manual de Procedimentos', category: 'Manuais de Procedimentos' },
      { title: 'Benefícios e Remuneração', category: 'Benefícios e Remuneração' },
      { title: 'Treinamento de Segurança', category: 'Treinamentos' },
      { title: 'Relatório Mensal', category: 'Relatórios' },
      { title: 'Formulário de Solicitação', category: 'Formulários' }
    ];
    
    // Inserir usuários de exemplo
    for (const user of demoUsers) {
      await query(
        'INSERT INTO users (id, tenant_id, name, email, phone, position, department, start_date, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          require('uuid').v4(),
          tenantId,
          user.name,
          user.email,
          user.phone,
          user.position,
          user.department,
          new Date().toISOString().split('T')[0],
          'active',
          new Date().toISOString()
        ]
      );
    }
    
    // Inserir documentos de exemplo
    for (const doc of demoDocuments) {
      await query(
        'INSERT INTO documents (id, tenant_id, title, category, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          require('uuid').v4(),
          tenantId,
          doc.title,
          doc.category,
          'published',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
    }
    
    console.log('Dados de exemplo criados para tenant demo!');
  } catch (error) {
    console.error('Erro ao popular dados de exemplo:', error);
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
