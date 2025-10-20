const { query } = require('./src/db-pg');

async function verificarUsuarios() {
  try {
    console.log('🔍 Buscando usuários...');
    
    const result = await query(`
      SELECT id, name, phone, tenant_id 
      FROM users 
      WHERE phone LIKE '%1233801973%' 
         OR phone LIKE '%556291708483%'
         OR phone LIKE '%552291708483%'
      LIMIT 10
    `);
    
    console.log('📋 Usuários encontrados:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado com esses telefones');
      
      // Buscar qualquer usuário para teste
      const qualquerUsuario = await query(`
        SELECT id, name, phone, tenant_id 
        FROM users 
        WHERE status = 'active'
        LIMIT 3
      `);
      
      console.log('👥 Usuários disponíveis para teste:', qualquerUsuario.rows);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

verificarUsuarios();



