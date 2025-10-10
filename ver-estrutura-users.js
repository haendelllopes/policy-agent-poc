require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
  SELECT column_name, data_type, is_nullable, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'users' 
  ORDER BY ordinal_position
`).then(r => {
  console.log('\n📋 Estrutura da tabela users:\n');
  console.table(r.rows);
  
  const obrigatorios = r.rows.filter(c => c.is_nullable === 'NO' && !c.column_default);
  console.log(`\n⚠️  Campos obrigatórios (${obrigatorios.length}):\n`);
  obrigatorios.forEach(c => console.log(`   - ${c.column_name} (${c.data_type})`));
  
  pool.end();
});

