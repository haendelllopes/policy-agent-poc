/**
 * Executa a migração 008 - Tabela de Feedbacks de Trilhas
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function executarMigracao008() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    query_timeout: 30000,
    statement_timeout: 30000
  });
  
  try {
    console.log('\n🔧 EXECUTANDO MIGRAÇÃO 008: Tabela de Feedbacks de Trilhas\n');
    console.log('='.repeat(70));
    
    // Ler arquivo SQL
    const sql = fs.readFileSync('migrations/008_trilha_feedbacks.sql', 'utf8');
    
    console.log('\n📋 SQL a ser executado:');
    console.log(sql);
    console.log('\n' + '='.repeat(70));
    
    // Executar SQL
    await pool.query(sql);
    
    console.log('\n✅ Migração executada com sucesso!\n');
    
    // Verificar se a tabela foi criada
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trilha_feedbacks'
      ) as existe
    `);
    
    if (checkTable.rows[0].existe) {
      console.log('✅ Tabela "trilha_feedbacks" criada com sucesso!\n');
      
      // Verificar colunas
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'trilha_feedbacks'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Estrutura da tabela:');
      console.table(columns.rows);
      
      // Verificar índices
      const indexes = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'trilha_feedbacks'
      `);
      
      console.log('\n📊 Índices criados:');
      console.table(indexes.rows);
      
      // Contar registros
      const count = await pool.query('SELECT COUNT(*) as total FROM trilha_feedbacks');
      console.log(`\n📈 Total de feedbacks: ${count.rows[0].total}\n`);
    } else {
      console.log('⚠️ ATENÇÃO: Tabela não foi criada!\n');
    }
    
    console.log('='.repeat(70));
    console.log('\n🎉 Migração 008 concluída! Sistema de feedbacks pronto!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO ao executar migração:', error.message);
    console.error('\nDetalhes completos:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executarMigracao008()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });


