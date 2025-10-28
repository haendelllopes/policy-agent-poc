require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificar() {
  const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  console.log('\n🔍 VERIFICANDO DADOS EM PRODUÇÃO\n');
  console.log('='.repeat(70));
  
  // 1. Verificar anotações totais
  console.log('📊 Verificando anotações totais...\n');
  const total = await pool.query('SELECT COUNT(*) as total FROM agente_anotacoes WHERE tenant_id = $1', [tenant_id]);
  console.log(`   Total de anotações: ${total.rows[0].total}`);
  
  const ultimos7dias = await pool.query('SELECT COUNT(*) as total FROM agente_anotacoes WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL \'7 days\'', [tenant_id]);
  console.log(`   Últimos 7 dias: ${ultimos7dias.rows[0].total}`);
  
  const ultimos30dias = await pool.query('SELECT COUNT(*) as total FROM agente_anotacoes WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL \'30 days\'', [tenant_id]);
  console.log(`   Últimos 30 dias: ${ultimos30dias.rows[0].total}\n`);
  
  // 2. Verificar usuários com cargo
  console.log('👥 Verificando usuários com cargo...\n');
  const usersComCargo = await pool.query(`
    SELECT u.id, u.name, p.name as cargo 
    FROM users u
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE u.tenant_id = $1
    AND u.position_id IS NOT NULL
    LIMIT 10
  `, [tenant_id]);
  console.log(`   Usuários com cargo: ${usersComCargo.rows.length}`);
  usersComCargo.rows.forEach(u => {
    console.log(`   - ${u.name} (${u.cargo})`);
  });
  
  // 3. Verificar anotações por cargo (usando a mesma query do dashboard)
  console.log('\n📊 Verificando anotações por cargo (últimos 30 dias)...\n');
  const resultado = await pool.query(`
    SELECT 
      COALESCE(p.name, 'Sem Cargo') as cargo,
      AVG(CASE 
        WHEN aa.sentimento = 'muito_positivo' THEN 5
        WHEN aa.sentimento = 'positivo' THEN 4
        WHEN aa.sentimento = 'neutro' THEN 3
        WHEN aa.sentimento = 'negativo' THEN 2
        WHEN aa.sentimento = 'muito_negativo' THEN 1
        ELSE 3
      END) as sentimento_medio,
      COUNT(*) as total_anotacoes
    FROM users u
    LEFT JOIN positions p ON u.position_id = p.id
    LEFT JOIN agente_anotacoes aa ON u.id = aa.colaborador_id
    WHERE u.tenant_id = $1 
      AND aa.created_at > NOW() - INTERVAL '30 days'
    GROUP BY p.name
    ORDER BY sentimento_medio DESC
  `, [tenant_id]);
  
  if (resultado.rows.length > 0) {
    console.log('✅ Dados encontrados:\n');
    console.table(resultado.rows.map(r => ({
      Cargo: r.cargo,
      'Média /5': parseFloat(r.sentimento_medio).toFixed(2),
      'Anotações': r.total_anotacoes
    })));
  } else {
    console.log('❌ Nenhum dado encontrado!\n');
    console.log('💡 Verificando se há anotações para usuários...\n');
    
    const anotacoes = await pool.query(`
      SELECT aa.id, aa.created_at, aa.sentimento 
      FROM agente_anotacoes aa
      JOIN users u ON aa.colaborador_id = u.id
      WHERE u.tenant_id = $1
      LIMIT 5
    `, [tenant_id]);
    
    console.log(`   Anotações encontradas: ${anotacoes.rows.length}`);
    anotacoes.rows.forEach(a => {
      console.log(`   - ${a.created_at}: ${a.sentimento}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  await pool.end();
  process.exit();
}

verificar();

