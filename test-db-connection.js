/**
 * Teste de Conexão com Banco de Dados
 * Ajuda a diagnosticar problemas de autenticação
 */

require('dotenv').config();

async function testConnection() {
  console.log('\n🔍 TESTE DE CONEXÃO COM BANCO DE DADOS\n');
  console.log('=' .repeat(50));
  
  // Verificar variáveis
  console.log('\n📋 Variáveis de ambiente:');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Definida (comprimento: ' + process.env.DATABASE_URL.length + ')' : 'NÃO DEFINIDA'}`);
  console.log(`PGHOST: ${process.env.PGHOST || 'NÃO DEFINIDA'}`);
  console.log(`PGPORT: ${process.env.PGPORT || 'NÃO DEFINIDA'}`);
  console.log(`PGDATABASE: ${process.env.PGDATABASE || 'NÃO DEFINIDA'}`);
  console.log(`PGUSER: ${process.env.PGUSER || 'NÃO DEFINIDA'}`);
  console.log(`PGPASSWORD: ${process.env.PGPASSWORD ? '***' + process.env.PGPASSWORD.slice(-4) + ' (comprimento: ' + process.env.PGPASSWORD.length + ')' : 'NÃO DEFINIDA'}`);
  
  // Testar se a senha tem caracteres especiais
  if (process.env.PGPASSWORD) {
    const specialChars = /[!@#$%^&*()+=\[\]{};':"\\|,.<>\/? ]/;
    if (specialChars.test(process.env.PGPASSWORD)) {
      console.log('\n⚠️  ATENÇÃO: A senha contém caracteres especiais!');
      console.log('   Isso pode causar problemas se não estiver URL-encoded na DATABASE_URL');
      console.log('   Use: encodeURIComponent() para encodar a senha');
    }
  }
  
  // Testar conexão
  console.log('\n🔌 Testando conexão...\n');
  
  const { Pool } = require('pg');
  
  let pool;
  
  // Tentar com DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('📍 Tentativa 1: Usando DATABASE_URL');
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query('SELECT NOW()');
      console.log('✅ CONEXÃO OK com DATABASE_URL!');
      console.log(`   Timestamp: ${result.rows[0].now}`);
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.log(`❌ FALHOU com DATABASE_URL: ${error.message}`);
      if (pool) await pool.end();
    }
  }
  
  // Tentar com variáveis separadas
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD) {
    console.log('\n📍 Tentativa 2: Usando variáveis PG* separadas');
    try {
      pool = new Pool({
        host: process.env.PGHOST,
        port: process.env.PGPORT || 5432,
        database: process.env.PGDATABASE || 'postgres',
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query('SELECT NOW()');
      console.log('✅ CONEXÃO OK com variáveis separadas!');
      console.log(`   Timestamp: ${result.rows[0].now}`);
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.log(`❌ FALHOU com variáveis separadas: ${error.message}`);
      if (pool) await pool.end();
    }
  }
  
  // Tentar com Session Pooler (Supabase)
  if (process.env.PGUSER && process.env.PGPASSWORD) {
    console.log('\n📍 Tentativa 3: Usando Session Pooler do Supabase (porta 5432)');
    try {
      // Extrair o projeto do PGHOST
      const projectRef = process.env.PGHOST ? process.env.PGHOST.split('.')[0].replace('aws-0-sa-east-1.pooler.supabase.com', '') : '';
      
      const sessionPoolerUrl = `postgresql://${process.env.PGUSER}:${encodeURIComponent(process.env.PGPASSWORD)}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`;
      
      pool = new Pool({
        connectionString: sessionPoolerUrl,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query('SELECT NOW()');
      console.log('✅ CONEXÃO OK com Session Pooler!');
      console.log(`   Timestamp: ${result.rows[0].now}`);
      console.log('\n💡 SOLUÇÃO: Use esta URL no .env:');
      console.log(`   DATABASE_URL=${sessionPoolerUrl}`);
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.log(`❌ FALHOU com Session Pooler: ${error.message}`);
      if (pool) await pool.end();
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('❌ TODAS AS TENTATIVAS FALHARAM\n');
  console.log('💡 Verifique:');
  console.log('   1. A senha está correta no Supabase Dashboard?');
  console.log('   2. Pegou a connection string correta (Session Pooler)?');
  console.log('   3. Não há espaços extras antes/depois da senha?');
  console.log('   4. O projeto Supabase está ativo?');
  console.log('\n📝 Onde pegar: https://supabase.com/dashboard → Settings → Database → Connection string\n');
  
  process.exit(1);
}

testConnection().catch(console.error);

