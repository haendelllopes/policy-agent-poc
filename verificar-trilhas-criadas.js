require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificar() {
  const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  console.log('\n🔍 VERIFICANDO TRILHAS E CONTEÚDOS CRIADOS\n');
  console.log('='.repeat(70));
  
  // Buscar trilhas
  const trilhas = await pool.query(`
    SELECT 
      t.id,
      t.nome,
      t.descricao,
      t.prazo_dias,
      t.segmentacao_tipo,
      COUNT(DISTINCT tc.id) as total_conteudos,
      COUNT(DISTINCT ts.position_id) as total_cargos
    FROM trilhas t
    LEFT JOIN trilha_conteudos tc ON tc.trilha_id = t.id
    LEFT JOIN trilha_segmentacao ts ON ts.trilha_id = t.id
    WHERE t.tenant_id = $1
    GROUP BY t.id, t.nome, t.descricao, t.prazo_dias, t.segmentacao_tipo
    ORDER BY t.ordem
  `, [tenant_id]);
  
  console.log(`\n📚 Total de trilhas: ${trilhas.rows.length}\n`);
  
  for (const trilha of trilhas.rows) {
    console.log(`\n🎯 ${trilha.nome}`);
    console.log(`   Descrição: ${trilha.descricao}`);
    console.log(`   Prazo: ${trilha.prazo_dias} dias`);
    console.log(`   Conteúdos: ${trilha.total_conteudos}`);
    console.log(`   Cargos associados: ${trilha.total_cargos}`);
    
    // Buscar conteúdos
    const conteudos = await pool.query(`
      SELECT tipo, titulo, url, obrigatorio
      FROM trilha_conteudos
      WHERE trilha_id = $1
      ORDER BY ordem
    `, [trilha.id]);
    
    if (conteudos.rows.length > 0) {
      console.log('\n   📄 Conteúdos:');
      conteudos.rows.forEach((c, i) => {
        console.log(`      ${i+1}. [${c.tipo}] ${c.titulo}`);
        console.log(`         URL: ${c.url}`);
        console.log(`         ${c.obrigatorio ? '✅' : '📌'} ${c.obrigatorio ? 'Obrigatório' : 'Opcional'}`);
      });
    }
    
    // Buscar cargos
    const cargos = await pool.query(`
      SELECT p.name as cargo
      FROM trilha_segmentacao ts
      JOIN positions p ON ts.position_id = p.id
      WHERE ts.trilha_id = $1 AND ts.incluir = true
    `, [trilha.id]);
    
    if (cargos.rows.length > 0) {
      console.log('\n   👔 Direcionado para:');
      console.log(`      ${cargos.rows.map(c => c.cargo).join(', ')}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 OBSERVAÇÃO IMPORTANTE:');
  console.log('   Os URLs são placeholders (exemplos).');
  console.log('   Você precisará substituí-los por conteúdos reais quando for usar.\n');
  
  await pool.end();
  process.exit();
}

verificar();

