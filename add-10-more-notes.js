require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function adicionarMais() {
  const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  // Buscar usuários
  const users = await pool.query('SELECT id FROM users WHERE tenant_id = $1 AND status = $2 LIMIT 20', [tenant_id, 'active']);
  
  // Adicionar 10 anotações muito positivas
  for (let i = 0; i < 10; i++) {
    const user = users.rows[Math.floor(Math.random() * users.rows.length)];
    
    await pool.query(`
      INSERT INTO agente_anotacoes (id, tenant_id, colaborador_id, tipo, titulo, anotacao, sentimento, intensidade_sentimento, tags, relevante, gerou_melhoria, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, false, NOW() - INTERVAL '3 days', NOW())
    `, [
      uuidv4(), tenant_id, user.id, 'sentimento_empresa',
      'Feedback extremamente positivo sobre o processo', 
      'Colaborador demonstrou grande satisfação e entusiasmo',
      'muito_positivo', 0.98, ['satisfacao', 'positivo']
    ]);
  }
  
  console.log('✅ 10 anotações adicionadas!');
  
  // Verificar média
  const result = await pool.query(`
    SELECT AVG(CASE 
      WHEN sentimento = 'muito_positivo' THEN 5
      WHEN sentimento = 'positivo' THEN 4
      WHEN sentimento = 'neutro' THEN 3
      WHEN sentimento = 'negativo' THEN 2
      WHEN sentimento = 'muito_negativo' THEN 1
      ELSE 3
    END) as media,
    COUNT(*) as total
    FROM agente_anotacoes
    WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '7 days'
  `, [tenant_id]);
  
  const media = parseFloat(result.rows[0].media).toFixed(2);
  const total = result.rows[0].total;
  const media10 = ((media / 5) * 10).toFixed(2);
  
  console.log('\n📊 Resultado:');
  console.log(`   Média: ${media}/5 (${media10}/10)`);
  console.log(`   Total: ${total} anotações (últimos 7 dias)\n`);
  
  await pool.end();
  process.exit();
}

adicionarMais();

