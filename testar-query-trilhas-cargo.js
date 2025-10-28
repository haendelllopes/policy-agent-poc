require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testarQuery() {
  const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  console.log('\n🧪 TESTANDO QUERY DE TRILHAS POR CARGO\n');
  console.log('='.repeat(70));
  
  const query = `
    SELECT 
      p.name as cargo,
      COUNT(DISTINCT t.id) as disponiveis
    FROM positions p
    CROSS JOIN trilhas t
    LEFT JOIN trilha_segmentacao ts ON ts.trilha_id = t.id AND ts.position_id = p.id AND ts.incluir = true
    WHERE t.tenant_id = $1
      AND t.ativo = true
      AND (t.segmentacao_tipo = 'todos' OR ts.position_id IS NOT NULL)
    GROUP BY p.name, p.id
    ORDER BY p.name
  `;
  
  const resultado = await pool.query(query, [tenant_id]);
  
  console.log('\n📊 Resultado da Query:\n');
  console.table(resultado.rows);
  
  console.log(`\nTotal de linhas: ${resultado.rows.length}`);
  
  // Verificar duplicatas
  const nomes = resultado.rows.map(r => r.cargo);
  const duplicatas = nomes.filter((nome, index) => nomes.indexOf(nome) !== index);
  
  if (duplicatas.length > 0) {
    console.log(`\n❌ ATENÇÃO: Cargos duplicados encontrados!`);
    console.log(duplicatas);
  } else {
    console.log('\n✅ Nenhum cargo duplicado!');
  }
  
  await pool.end();
  process.exit();
}

testarQuery();

