require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificarDuplicatas() {
  const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  console.log('\n🔍 VERIFICANDO TRILHAS DUPLICADAS\n');
  console.log('='.repeat(70));
  
  // Buscar trilhas com mesmo nome
  const trilhas = await pool.query(`
    SELECT 
      nome,
      COUNT(*) as duplicatas,
      STRING_AGG(id::text, ', ') as ids
    FROM trilhas
    WHERE tenant_id = $1
    GROUP BY nome
    HAVING COUNT(*) > 1
    ORDER BY duplicatas DESC
  `, [tenant_id]);
  
  if (trilhas.rows.length === 0) {
    console.log('✅ Nenhuma trilha duplicada encontrada!\n');
    await pool.end();
    process.exit();
  }
  
  console.log(`❌ ${trilhas.rows.length} trilhas com nomes duplicados encontradas:\n`);
  
  for (const trilha of trilhas.rows) {
    console.log(`📚 ${trilha.nome}`);
    console.log(`   Duplicatas: ${trilha.duplicatas}`);
    console.log(`   IDs: ${trilha.ids}`);
    
    // Buscar detalhes de cada duplicata
    const ids = trilha.ids.split(', ');
    for (let i = 0; i < ids.length; i++) {
      const detalhes = await pool.query(`
        SELECT 
          t.id,
          t.descricao,
          t.prazo_dias,
          COUNT(DISTINCT tc.id) as conteudos,
          COUNT(DISTINCT ts.id) as segmentacoes
        FROM trilhas t
        LEFT JOIN trilha_conteudos tc ON tc.trilha_id = t.id
        LEFT JOIN trilha_segmentacao ts ON ts.trilha_id = t.id
        WHERE t.id = $1
        GROUP BY t.id, t.descricao, t.prazo_dias
      `, [ids[i]]);
      
      const d = detalhes.rows[0];
      console.log(`\n   Cópia ${i+1}:`);
      console.log(`      ID: ${d.id}`);
      console.log(`      Descrição: ${d.descricao || '(vazia)'}`);
      console.log(`      Prazo: ${d.prazo_dias} dias`);
      console.log(`      Conteúdos: ${d.conteudos}`);
      console.log(`      Segmentações: ${d.segmentacoes}`);
    }
    console.log('');
  }
  
  console.log('='.repeat(70));
  console.log('\n💡 Deseja remover as duplicatas? (executar script de limpeza)\n');
  
  await pool.end();
  process.exit();
}

verificarDuplicatas();

