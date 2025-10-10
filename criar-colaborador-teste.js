/**
 * Script para criar colaborador de teste
 */

require('dotenv').config();
const { query } = require('./src/db-pg');

async function criarColaboradorTeste() {
  try {
    console.log('\n🔧 Criando colaborador de teste...\n');
    
    const tenantId = '5978f911-738b-4aae-802a-f037fdac2e64';
    const colaboradorId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    
    // Verificar se já existe
    const existe = await query(
      'SELECT id FROM colaboradores WHERE id = $1',
      [colaboradorId]
    );
    
    if (existe.rows.length > 0) {
      console.log('✅ Colaborador de teste já existe!');
      console.log(`   ID: ${colaboradorId}`);
      console.log(`   Pode usar esse ID para testar análise de sentimento\n`);
      return colaboradorId;
    }
    
    // Criar colaborador
    const result = await query(
      `INSERT INTO colaboradores (id, tenant_id, nome, email, cargo, departamento, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nome, email`,
      [
        colaboradorId,
        tenantId,
        'Colaborador Teste',
        'teste@flowly.com',
        'Desenvolvedor',
        'TI',
        'ativo'
      ]
    );
    
    console.log('✅ Colaborador criado com sucesso!');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Nome: ${result.rows[0].nome}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log('\n💡 Use este ID para testar análise de sentimento:\n');
    console.log(`   userId: "${result.rows[0].id}"`);
    console.log(`   tenantId: "${tenantId}"\n`);
    
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

criarColaboradorTeste()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

