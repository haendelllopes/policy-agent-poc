/**
 * Script para adicionar 15 novos usuários ao Navigator (Versão 3 - Simplificada)
 * Busca os IDs de Haendell e Vanessa antes de inserir
 */

require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function adicionarUsuarios() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 60000,
    statement_timeout: 60000
  });
  
  try {
    console.log('\n🚀 ADICIONANDO 15 NOVOS USUÁRIOS AO NAVIGATOR (V3)\n');
    console.log('='.repeat(70));
    
    const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
    
    // 1. Buscar IDs dos usuários de referência
    console.log('🔍 Buscando IDs de Haendell e Vanessa...\n');
    
    const haendell = await pool.query(`
      SELECT id, name FROM users 
      WHERE LOWER(name) LIKE '%haendell%' 
      AND tenant_id = $1 
      LIMIT 1
    `, [tenant_id]);
    
    const vanessa = await pool.query(`
      SELECT id, name FROM users 
      WHERE LOWER(name) LIKE '%vanessa%' 
      AND tenant_id = $1 
      LIMIT 1
    `, [tenant_id]);
    
    if (haendell.rows.length === 0) {
      console.error('❌ ERRO: Usuário Haendell não encontrado!\n');
      process.exit(1);
    }
    
    if (vanessa.rows.length === 0) {
      console.error('❌ ERRO: Usuário Vanessa não encontrado!\n');
      process.exit(1);
    }
    
    const haendell_id = haendell.rows[0].id;
    const vanessa_id = vanessa.rows[0].id;
    
    console.log(`✅ Haendell encontrado: ${haendell.rows[0].name} (ID: ${haendell_id})`);
    console.log(`✅ Vanessa encontrada: ${vanessa.rows[0].name} (ID: ${vanessa_id})\n`);
    
    // 2. Buscar IDs de departamentos e posições
    console.log('📂 Buscando departamentos e cargos existentes...\n');
    
    const deptDev = await pool.query(`
      SELECT id FROM departments 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%desenvolvimento%'
      LIMIT 1
    `, [tenant_id]);
    
    const deptDesign = await pool.query(`
      SELECT id FROM departments 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%design%'
      LIMIT 1
    `, [tenant_id]);
    
    const deptRH = await pool.query(`
      SELECT id FROM departments 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%recursos humanos%'
      LIMIT 1
    `, [tenant_id]);
    
    const deptComercial = await pool.query(`
      SELECT id FROM departments 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%comercial%'
      LIMIT 1
    `, [tenant_id]);
    
    const deptMarketing = await pool.query(`
      SELECT id FROM departments 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%marketing%'
      LIMIT 1
    `, [tenant_id]);
    
    const deptQA = await pool.query(`
      SELECT id FROM departments 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%quality%'
      LIMIT 1
    `, [tenant_id]);
    
    // IDs de departamentos (usar NULL se não existir)
    const dept_dev_id = deptDev.rows[0]?.id || null;
    const dept_design_id = deptDesign.rows[0]?.id || null;
    const dept_rh_id = deptRH.rows[0]?.id || null;
    const dept_comercial_id = deptComercial.rows[0]?.id || null;
    const dept_marketing_id = deptMarketing.rows[0]?.id || null;
    const dept_qa_id = deptQA.rows[0]?.id || null;
    
    // Buscar posições
    const pos_dev_jr = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%desenvolvedor%júnior%'
      LIMIT 1
    `, [tenant_id]);
    
    const pos_dev_pl = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%desenvolvedor%pleno%'
      LIMIT 1
    `, [tenant_id]);
    
    const pos_dev_sr = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%desenvolvedor%sênior%'
      LIMIT 1
    `, [tenant_id]);
    
    const pos_tech_lead = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%tech lead%'
      LIMIT 1
    `, [tenant_id]);
    
    const pos_design_jr = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%designer%júnior%'
      LIMIT 1
    `, [tenant_id]);
    
    const pos_design_pl = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%designer%pleno%'
      LIMIT 1
    `, [tenant_id]);
    
    const pos_mkt_jr = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%analista%marketing%'
      LIMIT 1
    `, [tenant_id]);
    
    const pos_qa_pl = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%qa%pleno%'
      LIMIT 1
    `, [tenant_id]);
    
    const pos_rh = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%analista%rh%'
      LIMIT 1
    `, [tenant_id]);
    
    const pos_vend = await pool.query(`
      SELECT id FROM positions 
      WHERE tenant_id = $1 AND LOWER(name) LIKE '%vendedor%'
      LIMIT 1
    `, [tenant_id]);
    
    // IDs de posições
    const pos_dev_jr_id = pos_dev_jr.rows[0]?.id || null;
    const pos_dev_pl_id = pos_dev_pl.rows[0]?.id || null;
    const pos_dev_sr_id = pos_dev_sr.rows[0]?.id || null;
    const pos_tech_lead_id = pos_tech_lead.rows[0]?.id || null;
    const pos_design_jr_id = pos_design_jr.rows[0]?.id || null;
    const pos_design_pl_id = pos_design_pl.rows[0]?.id || null;
    const pos_mkt_jr_id = pos_mkt_jr.rows[0]?.id || null;
    const pos_qa_pl_id = pos_qa_pl.rows[0]?.id || null;
    const pos_rh_id = pos_rh.rows[0]?.id || null;
    const pos_vend_id = pos_vend.rows[0]?.id || null;
    
    console.log('✅ IDs obtidos com sucesso\n');
    
    // 3. Inserir 15 novos usuários
    console.log('👥 Inserindo 15 novos usuários...\n');
    
    const usuarios = [
      { name: 'Ana Paula Santos', email: 'ana.paula@navigator.com', phone: '+5521999887766', position_id: pos_dev_jr_id, department_id: dept_dev_id },
      { name: 'Bruno Oliveira', email: 'bruno.oliveira@navigator.com', phone: '+5521988776655', position_id: pos_dev_pl_id, department_id: dept_dev_id },
      { name: 'Camila Ferreira', email: 'camila.ferreira@navigator.com', phone: '+5521977665544', position_id: pos_design_jr_id, department_id: dept_design_id },
      { name: 'Diego Almeida', email: 'diego.almeida@navigator.com', phone: '+5521966554433', position_id: pos_dev_sr_id, department_id: dept_dev_id },
      { name: 'Fernanda Costa', email: 'fernanda.costa@navigator.com', phone: '+5521955443322', position_id: pos_mkt_jr_id, department_id: dept_marketing_id },
      { name: 'Gabriel Lima', email: 'gabriel.lima@navigator.com', phone: '+5521944332211', position_id: pos_qa_pl_id, department_id: dept_qa_id },
      { name: 'Isabella Martins', email: 'isabella.martins@navigator.com', phone: '+5521933221100', position_id: pos_dev_pl_id, department_id: dept_dev_id },
      { name: 'João Henrique', email: 'joao.henrique@navigator.com', phone: '+5521922110099', position_id: pos_design_pl_id, department_id: dept_design_id },
      { name: 'Karina Silva', email: 'karina.silva@navigator.com', phone: '+5521911009988', position_id: pos_rh_id, department_id: dept_rh_id },
      { name: 'Lucas Pereira', email: 'lucas.pereira@navigator.com', phone: '+5521900998877', position_id: pos_vend_id, department_id: dept_comercial_id },
      { name: 'Mariana Rocha', email: 'mariana.rocha@navigator.com', phone: '+5521888777666', position_id: pos_dev_jr_id, department_id: dept_dev_id },
      { name: 'Natália Souza', email: 'natalia.souza@navigator.com', phone: '+5521877666555', position_id: pos_tech_lead_id, department_id: dept_dev_id },
      { name: 'Otávio Rodrigues', email: 'otavio.rodrigues@navigator.com', phone: '+5521866555444', position_id: pos_qa_pl_id, department_id: dept_qa_id },
      { name: 'Patrícia Alves', email: 'patricia.alves@navigator.com', phone: '+5521855444333', position_id: pos_mkt_jr_id, department_id: dept_marketing_id },
      { name: 'Ricardo Barbosa', email: 'ricardo.barbosa@navigator.com', phone: '+5521844333222', position_id: pos_vend_id, department_id: dept_comercial_id }
    ];
    
    let inseridos = 0;
    
    for (const usuario of usuarios) {
      const startDate = new Date();
      await pool.query(`
        INSERT INTO users (
          id, tenant_id, name, email, phone, 
          position, department, position_id, department_id,
          gestor_id, buddy_id, role,
          status, onboarding_status, onboarding_inicio, start_date,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [
        uuidv4(), tenant_id, usuario.name, usuario.email, usuario.phone,
        'Cargo', 'Departamento',
        usuario.position_id, usuario.department_id,
        haendell_id, vanessa_id, 'colaborador',
        'active', 'nao_iniciado', startDate, startDate // ambos usam a mesma data
      ]);
      inseridos++;
    }
    
    console.log(`✅ ${inseridos} usuários inseridos com sucesso!\n`);
    
    // 4. Verificar usuários inseridos
    console.log('🔍 Verificando usuários inseridos...\n');
    console.log('='.repeat(70));
    
    const verificacao = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        d.name as department_name,
        p.name as position_name,
        u.onboarding_status,
        u.start_date,
        CASE WHEN u.gestor_id IS NOT NULL THEN '✅' ELSE '❌' END as gestor,
        CASE WHEN u.buddy_id IS NOT NULL THEN '✅' ELSE '❌' END as buddy
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN positions p ON u.position_id = p.id
      WHERE u.tenant_id = $1
      AND u.created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY u.created_at DESC
      LIMIT 20
    `, [tenant_id]);
    
    if (verificacao.rows.length > 0) {
      console.log(`\n✅ ${verificacao.rows.length} usuários inseridos!\n`);
      console.table(verificacao.rows.map(u => ({
        Nome: u.name,
        Email: u.email,
        Dept: u.department_name || 'N/A',
        Cargo: u.position_name || 'N/A',
        Status: u.onboarding_status,
        Gestor: u.gestor,
        Buddy: u.buddy
      })));
    } else {
      console.log('\n⚠️  Nenhum usuário novo encontrado\n');
      
      // Verificar total de usuários
      const total = await pool.query(`
        SELECT COUNT(*) as total FROM users 
        WHERE tenant_id = $1
      `, [tenant_id]);
      
      console.log(`📊 Total de usuários no sistema: ${total.rows[0].total}\n`);
    }
    
    console.log('='.repeat(70));
    console.log('\n🎉 PROCESSO CONCLUÍDO!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

adicionarUsuarios()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

