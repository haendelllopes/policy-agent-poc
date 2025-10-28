require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verificarECorrigir() {
  const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  console.log('\n🔍 Verificando cargos existentes...\n');
  
  // Buscar positions
  const positions = await pool.query('SELECT id, name FROM positions WHERE tenant_id = $1', [tenant_id]);
  console.log(`📋 Cargos disponíveis (${positions.rows.length}):`);
  positions.rows.forEach(p => console.log(`   - ${p.name} (${p.id})`));
  
  console.log('\n👥 Verificando usuários...\n');
  
  const users = await pool.query(`
    SELECT u.id, u.name, u.position_id, p.name as cargo 
    FROM users u
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE u.tenant_id = $1
  `, [tenant_id]);
  
  console.log(`Total de usuários: ${users.rows.length}`);
  console.log(`Usuários sem cargo: ${users.rows.filter(u => !u.cargo).length}`);
  console.log(`Usuários com cargo: ${users.rows.filter(u => u.cargo).length}\n`);
  
  if (positions.rows.length > 0) {
    // Mostrar usuários por cargo
    const porCargo = {};
    users.rows.forEach(u => {
      const cargo = u.cargo || 'Sem Cargo';
      if (!porCargo[cargo]) porCargo[cargo] = [];
      porCargo[cargo].push(u.name);
    });
    
    console.log('📊 Usuários por cargo:');
    Object.keys(porCargo).forEach(cargo => {
      console.log(`   ${cargo}: ${porCargo[cargo].length} usuários`);
      if (porCargo[cargo].length <= 5) {
        console.log(`      ${porCargo[cargo].join(', ')}`);
      }
    });
  }
  
  await pool.end();
  process.exit();
}

verificarECorrigir();

