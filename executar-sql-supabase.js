/**
 * Executa um arquivo SQL no Supabase
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function executarSQL(arquivo) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 60000,
    statement_timeout: 60000
  });
  
  try {
    console.log(`\n🔧 Executando: ${arquivo}\n`);
    console.log('='.repeat(60));
    
    const sql = fs.readFileSync(arquivo, 'utf8');
    
    const result = await pool.query(sql);
    
    console.log('\n✅ SQL executado com sucesso!\n');
    
    if (result.rows && result.rows.length > 0) {
      console.log('📋 Resultado:');
      console.table(result.rows);
    }
    
    // Verificar se a tabela foi criada
    const check = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'colaboradores'
      ) as existe
    `);
    
    if (check.rows[0].existe) {
      console.log('✅ Tabela "colaboradores" existe!\n');
      
      // Contar registros
      const count = await pool.query('SELECT COUNT(*) as total FROM colaboradores');
      console.log(`📊 Total de colaboradores: ${count.rows[0].total}\n`);
    }
    
    console.log('='.repeat(60));
    console.log('\n🎉 Tudo pronto para testar análise de sentimento!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const arquivo = process.argv[2] || 'criar-tabela-colaboradores.sql';
executarSQL(arquivo)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

