require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function removerDuplicatas() {
  const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  console.log('\n🧹 REMOVENDO TRILHAS DUPLICADAS\n');
  console.log('='.repeat(70));
  
  // IDs das trilhas duplicadas (manter a 36bef2db que tem segmentação)
  const idsParaRemover = [
    '6653030a-ffd3-4d51-9624-f1009c67caa2', // sem segmentação
    '15a40fa9-f1c6-45c7-b715-236bdb1debba' // com segmentação (duplicada)
  ];
  
  const idParaManter = '36bef2db-2122-4730-bf70-81110ad5105f'; // manter esta (tem segmentação)
  
  console.log('\n✅ Mantendo trilha:', idParaManter);
  console.log('❌ Removendo duplicatas:', idsParaRemover.join(', '));
  
  for (const id of idsParaRemover) {
    console.log(`\n🗑️  Removendo trilha ${id}...`);
    
    // Remover conteúdos associados
    const conteudos = await pool.query('DELETE FROM trilha_conteudos WHERE trilha_id = $1', [id]);
    console.log(`   📄 Removidos ${conteudos.rowCount} conteúdos`);
    
    // Remover segmentações
    const segmentacoes = await pool.query('DELETE FROM trilha_segmentacao WHERE trilha_id = $1', [id]);
    console.log(`   👔 Removidas ${segmentacoes.rowCount} segmentações`);
    
    // Remover trilha
    const trilha = await pool.query('DELETE FROM trilhas WHERE id = $1', [id]);
    console.log(`   ✅ Trilha removida`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ DUPLICATAS REMOVIDAS COM SUCESSO!\n');
  
  // Verificar resultado final
  const trilhas = await pool.query(`
    SELECT COUNT(*) as total
    FROM trilhas
    WHERE tenant_id = $1
  `, [tenant_id]);
  
  console.log(`📊 Total de trilhas agora: ${trilhas.rows[0].total}\n`);
  
  await pool.end();
  process.exit();
}

removerDuplicatas();

