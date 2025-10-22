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

async function verificarEstruturaUsers() {
  try {
    console.log('🔍 Verificando estrutura da tabela users...');
    
    // Verificar estrutura da tabela
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await pool.query(structureQuery);
    
    console.log('📋 Estrutura da tabela users:');
    structureResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar usuários existentes
    const usersQuery = 'SELECT id, name, email, position, department FROM users LIMIT 5';
    const usersResult = await pool.query(usersQuery);
    
    console.log('\n👥 Usuários existentes:');
    usersResult.rows.forEach(user => {
      console.log(`   ${user.id}: ${user.name} (${user.email}) - ${user.position} em ${user.department}`);
    });
    
    return usersResult.rows;
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  verificarEstruturaUsers()
    .then(users => {
      console.log('\n🎉 Verificação concluída!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Falha:', error);
      process.exit(1);
    });
}

module.exports = verificarEstruturaUsers;

