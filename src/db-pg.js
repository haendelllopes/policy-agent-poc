const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL
let pool;
let isConnecting = false;
let connectionQueue = [];
let globalMutex = null;
let connectionCount = 0;

async function initializePool() {
  // No Vercel, usar DATABASE_URL ou Session Pooler se variáveis PG* estiverem disponíveis
  if (process.env.VERCEL && (process.env.DATABASE_URL || (process.env.PGUSER && process.env.PGPASSWORD))) {
    // Se já temos um pool válido, reutilizar
    if (pool) {
      try {
        if (pool.totalCount >= 0 && pool.idleCount >= 0 && pool.totalCount < 1) {
          console.log('Reutilizando pool PostgreSQL existente no Vercel');
          return pool;
        } else if (pool.totalCount >= 1) {
          console.log('Pool atingiu limite máximo, aguardando liberação...');
          // Aguardar até 10 segundos para uma conexão se liberar
          for (let i = 0; i < 50; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            if (pool.idleCount > 0) {
              console.log('Conexão liberada, reutilizando pool');
              return pool;
            }
          }
          console.log('Nenhuma conexão liberada, forçando recriação...');
          pool = null;
        }
      } catch (e) {
        console.log('Pool inválido, criando novo');
        pool = null;
      }
    }
    
    // Criar mutex global se não existir
    if (!globalMutex) {
      globalMutex = new Promise(resolve => resolve());
    }
    
    // Aguardar mutex global
    await globalMutex;
    
    // Criar novo mutex para próxima operação
    let resolveMutex;
    globalMutex = new Promise(resolve => {
      resolveMutex = resolve;
    });
    
    try {
      // Se já estamos conectando, aguardar na fila
      if (isConnecting) {
        console.log('Aguardando na fila de conexão...');
        return new Promise((resolve) => {
          connectionQueue.push(resolve);
        });
      }
      
      // Marcar como conectando
      isConnecting = true;
      
      try {
        // Reduzir delay para acelerar primeira conexão em produção
        const randomDelay = Math.random() * 1500 + 500; // 0.5-2.0 segundos
        console.log(`Aguardando ${Math.round(randomDelay)}ms antes de conectar...`);
        await new Promise(resolve => setTimeout(resolve, randomDelay));
        
        if (process.env.DATABASE_URL) {
          console.log('Vercel detectado - usando DATABASE_URL');
          console.log('DATABASE_URL disponível:', !!process.env.DATABASE_URL);
          console.log('Usando DATABASE_URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
          try {
            pool = createPool(process.env.DATABASE_URL);
            console.log('✅ Pool criado com DATABASE_URL');
          } catch (error) {
            console.error('❌ Erro ao criar pool com DATABASE_URL:', error);
            throw error;
          }
        } else {
          console.log('Vercel detectado - usando Session Pooler do Supabase');
          const sessionPoolerUrl = `postgresql://${process.env.PGUSER}:${encodeURIComponent(process.env.PGPASSWORD)}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`;
          console.log('Usando Session Pooler do Supabase (IPv4 compatible):', sessionPoolerUrl.substring(0, 50) + '...');
          pool = createPool(sessionPoolerUrl);
        }
        
        // Resolver todas as promessas na fila
        connectionQueue.forEach(resolve => resolve(pool));
        connectionQueue = [];
        
        return pool;
      } finally {
        isConnecting = false;
      }
    } finally {
      // Liberar mutex
      resolveMutex();
    }
  }
  
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    // Tentar montar a conexão usando Session Pooler do Supabase
    const user = process.env.PGUSER;
    const password = process.env.PGPASSWORD;
    
    console.log('DATABASE_URL ausente. Verificando variáveis PG*:', {
      PGUSER: user ? 'SET' : 'MISSING',
      PGPASSWORD: password ? 'SET' : 'MISSING'
    });
    
    if (user && password) {
      // Usar Session Pooler do Supabase (IPv4 compatible)
      const sessionPoolerUrl = `postgresql://${user}:${encodeURIComponent(password)}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`;
      console.log('Usando Session Pooler do Supabase (IPv4 compatible):', sessionPoolerUrl.substring(0, 50) + '...');
      return createPool(sessionPoolerUrl);
    }
    
    console.warn('DATABASE_URL não encontrada e variáveis PG* ausentes. Usando SQLite local');
    return null;
  }
  
  try {
    console.log('Usando DATABASE_URL fornecida');
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
    // Configurações otimizadas para Supabase Session Pooler
    max: 2, // 2 conexões para melhor throughput
    min: 1, // Manter 1 conexão ativa
    idleTimeoutMillis: 10000, // 10 segundos para conexões idle
    connectionTimeoutMillis: 15000, // 15 segundos para conexão inicial
    acquireTimeoutMillis: 5000, // 5 segundos para adquirir conexão
    // Configurações de retry otimizadas
    retryDelayMs: 5000, // 5 segundos entre tentativas
    retryAttempts: 2, // 2 tentativas para melhor resiliência
    // Forçar IPv4
    family: 4,
    // Configurações para liberar recursos muito rapidamente
    keepAlive: false, // Desabilitar keepAlive para liberar recursos
    keepAliveInitialDelayMillis: 0,
    statement_timeout: 30000, // 30 segundos para queries
    query_timeout: 30000, // 30 segundos para queries
    // Configurações específicas para Lambda/Vercel
    allowExitOnIdle: true, // Permitir saída quando idle
    maxUses: 100, // Limite muito baixo de usos por conexão
    application_name: 'navigator-app',
    // Configurações específicas para Supabase Session Pooler
    options: '-c default_transaction_isolation=read_committed'
  });

  // Tratamento de erros do pool
  pool.on('error', (err) => {
    console.error('Erro inesperado no pool PostgreSQL:', err);
    // Não fechar o pool em caso de erro, deixar o Vercel gerenciar
  });

  pool.on('connect', (client) => {
    console.log('Nova conexão PostgreSQL estabelecida');
  });

  pool.on('remove', (client) => {
    console.log('Conexão PostgreSQL removida do pool');
  });

  console.log('Pool PostgreSQL inicializado com configurações serverless');
  return pool;
}

// Função para executar queries com retry otimizado para Supabase Pro
async function query(text, params = [], retries = 1) {
  // No Vercel, usar conexão direta para evitar problemas de pool
  if (process.env.VERCEL && process.env.PGUSER && process.env.PGPASSWORD) {
    return await queryWithDirectConnection(text, params, retries);
  }
  
  let pgPool = await initializePool();
  
  if (!pgPool) {
    throw new Error('Pool PostgreSQL não inicializado');
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const start = Date.now();
      const res = await pgPool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query executada', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error(`Erro na query (tentativa ${attempt}/${retries}):`, error.message);
      
      // Se o pool foi finalizado, tentar recriar
      if (error.message.includes('Cannot use a pool after calling end')) {
        console.log('Pool finalizado, recriando...');
        pool = null;
        pgPool = await initializePool();
        if (!pgPool) {
          throw new Error('Não foi possível recriar o pool PostgreSQL');
        }
      }
      
      // Verificar se é um erro recuperável
      const isRetryableError = (
        error.message.includes('connection terminated') ||
        error.message.includes('db_termination') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('Connection terminated due to connection timeout') ||
        error.message.includes('MaxClientsInSessionMode') ||
        error.message.includes('Cannot use a pool after calling end') ||
        error.code === 'XX000' // Erro fatal do PostgreSQL
      );
      
      // Se for erro de conexão e ainda há tentativas, aguardar e tentar novamente
      if (attempt < retries && isRetryableError) {
        // Backoff exponencial com jitter mais agressivo
        const baseDelay = Math.min(2000 * Math.pow(1.5, attempt - 1), 15000);
        const jitter = Math.random() * 2000;
        const delay = baseDelay + jitter;
        
        console.log(`Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
}

// Função para executar queries com conexão direta otimizada - para Vercel
async function queryWithDirectConnection(text, params = [], retries = 3) {
  const { Client } = require('pg');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    let client = null;
    try {
      const start = Date.now();
      
      // Criar conexão direta com configurações ultra-conservadoras
      const sessionPoolerUrl = `postgresql://${process.env.PGUSER}:${encodeURIComponent(process.env.PGPASSWORD)}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`;
      
      client = new Client({
        connectionString: sessionPoolerUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000, // 10 segundos - mais agressivo
        statement_timeout: 15000, // 15 segundos
        query_timeout: 15000, // 15 segundos
        application_name: `navigator-app-${Date.now()}-${attempt}`,
        // Configurações adicionais para estabilidade
        keepAlive: false,
        keepAliveInitialDelayMillis: 0
      });
      
      // Timeout manual para conexão
      const connectionPromise = client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log(`Conexão direta estabelecida (tentativa ${attempt}/${retries})`);
      
      // Timeout manual para query
      const queryPromise = client.query(text, params);
      const queryTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 15000)
      );
      
      const res = await Promise.race([queryPromise, queryTimeoutPromise]);
      const duration = Date.now() - start;
      console.log(`Query executada em ${duration}ms`);
      
      return res;
    } catch (error) {
      console.error(`Erro na query direta (tentativa ${attempt}/${retries}):`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Delay exponencial com jitter
      const baseDelay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      const jitter = Math.random() * 1000; // 0-1s de jitter
      const delay = baseDelay + jitter;
      
      console.log(`Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } finally {
      if (client) {
        try {
          await client.end();
          console.log('Conexão direta fechada');
        } catch (e) {
          console.log('Erro ao fechar conexão direta:', e.message);
        }
      }
    }
  }
}

// Função para executar transações
async function transaction(callback) {
  const pgPool = await initializePool();
  
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
        status VARCHAR(50) DEFAULT 'published',
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Adicionar colunas que podem não existir em tabelas antigas
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS department VARCHAR(100)`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_data TEXT`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER`);
    
    // Colunas para análise de IA
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding TEXT`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_classification VARCHAR(100)`);
    
    // Migrar coluna embedding de TEXT para VECTOR se necessário
    try {
      await query(`ALTER TABLE documents ALTER COLUMN embedding TYPE VECTOR(1536) USING embedding::VECTOR(1536)`);
      console.log('Coluna embedding migrada para tipo VECTOR(1536)');
    } catch (migrationError) {
      console.log('Migração de embedding ignorada (já é VECTOR ou erro esperado):', migrationError.message);
    }
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2)`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_summary TEXT`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_tags JSONB`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS word_count INTEGER`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS language VARCHAR(10)`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(50) DEFAULT 'pending'`);
    await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP WITH TIME ZONE`);
    
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
    
    // ===================================================================
    // SISTEMA DE TRILHAS DE ONBOARDING
    // ===================================================================
    console.log('Criando estrutura do sistema de trilhas...');
    
    // 1. Adicionar colunas de onboarding à tabela users
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'colaborador'`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'nao_iniciado'`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_inicio DATE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_fim DATE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pontuacao_total INTEGER DEFAULT 0`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    
    // Adicionar campos gestor_id e buddy_id à tabela users
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES users(id) ON DELETE SET NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS buddy_id UUID REFERENCES users(id) ON DELETE SET NULL`);
    
    // 2. Criar tabela trilhas
    await query(`
      CREATE TABLE IF NOT EXISTS trilhas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        prazo_dias INTEGER NOT NULL DEFAULT 7,
        ordem INTEGER DEFAULT 0,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // 3. Criar tabela trilha_conteudos
    await query(`
      CREATE TABLE IF NOT EXISTS trilha_conteudos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('documento', 'video', 'link', 'pdf')),
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        url TEXT NOT NULL,
        ordem INTEGER DEFAULT 0,
        obrigatorio BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // 4. Criar tabela colaborador_trilhas
    await query(`
      CREATE TABLE IF NOT EXISTS colaborador_trilhas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        colaborador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'nao_iniciada' CHECK (status IN ('nao_iniciada', 'em_andamento', 'aguardando_quiz', 'concluida', 'atrasada')),
        data_inicio TIMESTAMP WITH TIME ZONE,
        data_limite TIMESTAMP WITH TIME ZONE,
        data_conclusao TIMESTAMP WITH TIME ZONE,
        pontuacao_final INTEGER DEFAULT 0,
        certificado_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(colaborador_id, trilha_id)
      )
    `);
    
    // 5. Criar tabela conteudo_aceites
    await query(`
      CREATE TABLE IF NOT EXISTS conteudo_aceites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        colaborador_trilha_id UUID NOT NULL REFERENCES colaborador_trilhas(id) ON DELETE CASCADE,
        conteudo_id UUID NOT NULL REFERENCES trilha_conteudos(id) ON DELETE CASCADE,
        aceito_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(colaborador_trilha_id, conteudo_id)
      )
    `);
    
    // 6. Criar tabela quiz_tentativas
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_tentativas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        colaborador_trilha_id UUID NOT NULL REFERENCES colaborador_trilhas(id) ON DELETE CASCADE,
        questoes JSONB NOT NULL,
        respostas JSONB,
        nota INTEGER DEFAULT 0,
        aprovado BOOLEAN DEFAULT false,
        tentativa_numero INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // 7. Criar tabela gamificacao_pontos
    await query(`
      CREATE TABLE IF NOT EXISTS gamificacao_pontos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        colaborador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('trilha_concluida', 'quiz_aprovado', 'bonus_antecipacao', 'bonus_perfeito')),
        pontos INTEGER NOT NULL DEFAULT 0,
        trilha_id UUID REFERENCES trilhas(id) ON DELETE SET NULL,
        descricao TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Índices para sistema de trilhas
    await query(`CREATE INDEX IF NOT EXISTS idx_trilhas_tenant ON trilhas(tenant_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trilhas_tenant_ativo ON trilhas(tenant_id, ativo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_trilha_conteudos_trilha ON trilha_conteudos(trilha_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_colaborador_trilhas_colaborador ON colaborador_trilhas(colaborador_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_colaborador_trilhas_status ON colaborador_trilhas(colaborador_id, status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_conteudo_aceites_colaborador_trilha ON conteudo_aceites(colaborador_trilha_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_quiz_tentativas_colaborador_trilha ON quiz_tentativas(colaborador_trilha_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_gamificacao_colaborador ON gamificacao_pontos(colaborador_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_position ON users(position_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_onboarding_status ON users(tenant_id, onboarding_status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_gestor ON users(gestor_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_buddy ON users(buddy_id)`);
    
    console.log('Sistema de trilhas criado com sucesso!');
    
    // Criar índices otimizados para performance
    await query(`CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(document_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_docs_tenant ON documents(tenant_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_positions_tenant ON positions(tenant_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tags_tenant ON tags(tenant_id)`);
    // Índices compostos para queries mais específicas
    await query(`CREATE INDEX IF NOT EXISTS idx_users_tenant_status ON users(tenant_id, status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_docs_tenant_status ON documents(tenant_id, status)`);
    
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
      },
      { 
        title: 'Treinamento de Segurança', 
        category: 'Treinamentos',
        description: 'Material de treinamento sobre segurança no trabalho e procedimentos de emergência.',
        ai_summary: 'Material de treinamento que aborda questões de segurança no ambiente de trabalho, procedimentos de emergência e uso de equipamentos de proteção individual.',
        ai_classification: 'Treinamento'
      },
      { 
        title: 'Relatório Mensal', 
        category: 'Relatórios',
        description: 'Modelo de relatório mensal para acompanhamento de atividades.',
        ai_summary: 'Modelo padrão para relatórios mensais de atividades, incluindo métricas de performance e indicadores de produtividade.',
        ai_classification: 'Relatórios'
      },
      { 
        title: 'Formulário de Solicitação', 
        category: 'Formulários',
        description: 'Formulário padrão para solicitações internas.',
        ai_summary: 'Formulário padronizado para solicitações internas, incluindo pedidos de materiais, autorizações e outros procedimentos administrativos.',
        ai_classification: 'Formulários'
      }
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
        'INSERT INTO documents (id, tenant_id, title, category, status, created_at, updated_at, description, ai_summary, ai_classification, analysis_status, analyzed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [
          require('uuid').v4(),
          tenantId,
          doc.title,
          doc.category,
          'published',
          new Date().toISOString(),
          new Date().toISOString(),
          doc.description,
          doc.ai_summary,
          doc.ai_classification,
          'completed',
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
