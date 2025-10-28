require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificarCategorias() {
  try {
    const result = await pool.query(`
      SELECT constraint_name, check_clause 
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%categoria%'
    `);
    
    console.log('Restrições de categoria:');
    console.log(result.rows);
    
    // Também verificar tentando inserir para ver qual categoria falha
    const categorias = ['conteudo', 'interface', 'fluxo', 'performance', 'engajamento', 'acessibilidade', 'outros'];
    
    for (const cat of categorias) {
      try {
        const teste = await pool.query(`
          INSERT INTO onboarding_improvements (tenant_id, categoria, prioridade, titulo, descricao, status) 
          VALUES ('5978f911-738b-4aae-802a-f037fdac2e64', $1, 'media', 'Teste', 'Teste', 'sugerida')
        `, [cat]);
        await pool.query(`DELETE FROM onboarding_improvements WHERE titulo = 'Teste'`);
        console.log(`✅ ${cat} - OK`);
      } catch (e) {
        console.log(`❌ ${cat} - ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

verificarCategorias();

