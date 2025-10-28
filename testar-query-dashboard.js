require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testarQuery() {
  const tenantId = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  console.log('\n🔍 TESTANDO QUERY DO DASHBOARD\n');
  console.log('='.repeat(70));
  
  const query = `
    SELECT 
      COALESCE(p.name, 'Sem Cargo') as cargo,
      AVG(CASE 
        WHEN aa.sentimento = 'muito_positivo' THEN 5
        WHEN aa.sentimento = 'positivo' THEN 4
        WHEN aa.sentimento = 'neutro' THEN 3
        WHEN aa.sentimento = 'negativo' THEN 2
        WHEN aa.sentimento = 'muito_negativo' THEN 1
        ELSE 3
      END) as sentimento_medio
    FROM users u
    LEFT JOIN positions p ON u.position_id = p.id
    LEFT JOIN agente_anotacoes aa ON u.id = aa.colaborador_id
    WHERE u.tenant_id = $1 
      AND aa.created_at > NOW() - INTERVAL '30 days'
    GROUP BY p.name
    ORDER BY sentimento_medio DESC
  `;
  
  console.log('📝 Executando query...\n');
  
  const resultado = await pool.query(query, [tenantId]);
  
  console.log(`✅ Resultado: ${resultado.rows.length} cargos encontrados\n`);
  
  if (resultado.rows.length > 0) {
    console.table(resultado.rows.map(r => ({
      Cargo: r.cargo,
      'Sentimento Médio': parseFloat(r.sentimento_medio).toFixed(2),
      'Escala /10': ((parseFloat(r.sentimento_medio) / 5) * 10).toFixed(2)
    })));
  } else {
    console.log('❌ Nenhum resultado encontrado!');
  }
  
  console.log('\n' + '='.repeat(70));
  
  await pool.end();
  process.exit();
}

testarQuery();

