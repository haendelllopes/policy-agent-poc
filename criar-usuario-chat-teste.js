const { Pool } = require('pg');
require('dotenv').config();

// Configurar pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  min: 1,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 45000,
  acquireTimeoutMillis: 30000,
  retryDelayMs: 5000,
  retryAttempts: 3,
  family: 4,
  keepAlive: false,
  keepAliveInitialDelayMillis: 0,
  statement_timeout: 120000,
  query_timeout: 120000,
  allowExitOnIdle: true,
  maxUses: 100,
  application_name: 'navigator-app',
  options: '-c default_transaction_isolation=read_committed',
  maxLifetimeSeconds: 0
});

async function criarUsuarioChatTeste() {
  try {
    console.log('🚀 Criando usuário de teste para chat...');
    
    // Gerar UUID válido
    const userId = '550e8400-e29b-41d4-a716-446655440000'; // UUID válido fixo
    const tenantId = '5978f911-738b-4aae-802a-f037fdac2e64'; // Tenant demo existente
    
    // Verificar se usuário já existe
    const checkQuery = 'SELECT id FROM users WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Usuário de teste já existe:', userId);
      return userId;
    }
    
    // Criar usuário de teste
    const insertQuery = `
      INSERT INTO users (
        id, tenant_id, name, email, phone, position, department, 
        manager_id, buddy_id, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
    `;
    
    const values = [
      userId,                    // id
      tenantId,                  // tenant_id
      'Usuário Chat Teste',      // name
      'chat.teste@navigator.com', // email
      '11999999999',             // phone
      'Desenvolvedor',           // position
      'TI',                      // department
      null,                      // manager_id
      null,                      // buddy_id
      'ativo'                    // status
    ];
    
    await pool.query(insertQuery, values);
    
    console.log('✅ Usuário de teste criado com sucesso!');
    console.log('📋 Detalhes do usuário:');
    console.log('   ID:', userId);
    console.log('   Nome:', 'Usuário Chat Teste');
    console.log('   Email:', 'chat.teste@navigator.com');
    console.log('   Posição:', 'Desenvolvedor');
    console.log('   Departamento:', 'TI');
    
    return userId;
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  criarUsuarioChatTeste()
    .then(userId => {
      console.log('🎉 Usuário criado:', userId);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Falha:', error);
      process.exit(1);
    });
}

module.exports = criarUsuarioChatTeste;
