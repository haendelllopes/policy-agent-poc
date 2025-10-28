require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificarDatas() {
  const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  console.log('\n🔍 VERIFICANDO DATAS DAS ANOTAÇÕES\n');
  console.log('='.repeat(70));
  
  // Verificar últimos 10 registros
  const resultado = await pool.query(`
    SELECT 
      aa.created_at, 
      aa.sentimento, 
      p.name as cargo,
      NOW() - aa.created_at as idade
    FROM agente_anotacoes aa
    JOIN users u ON aa.colaborador_id = u.id
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE aa.tenant_id = $1
    ORDER BY aa.created_at DESC
    LIMIT 10
  `, [tenant_id]);
  
  console.log('📅 Últimas 10 anotações inseridas:\n');
  resultado.rows.forEach((row, i) => {
    console.log(`${i+1}. ${row.cargo} - ${row.sentimento}`);
    console.log(`   Data: ${row.created_at}`);
    console.log(`   Idade: ${row.idade}`);
    console.log('');
  });
  
  // Verificar contagem por período
  const ultimos7dias = await pool.query(`
    SELECT COUNT(*) as total 
    FROM agente_anotacoes 
    WHERE tenant_id = $1 
    AND created_at > NOW() - INTERVAL '7 days'
  `, [tenant_id]);
  
  const ultimos30dias = await pool.query(`
    SELECT COUNT(*) as total 
    FROM agente_anotacoes 
    WHERE tenant_id = $1 
    AND created_at > NOW() - INTERVAL '30 days'
  `, [tenant_id]);
  
  console.log(`📊 Anotações nos últimos 7 dias: ${ultimos7dias.rows[0].total}`);
  console.log(`📊 Anotações nos últimos 30 dias: ${ultimos30dias.rows[0].total}`);
  console.log('\n' + '='.repeat(70));
  
  await pool.end();
  process.exit();
}

verificarDatas();

