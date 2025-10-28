/**
 * Script para adicionar 15 novos usuários ao Navigator (Versão 2)
 * Busca os IDs de Haendell e Vanessa antes de inserir
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function adicionarUsuarios() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 60000,
    statement_timeout: 60000
  });
  
  try {
    console.log('\n🚀 ADICIONANDO 15 NOVOS USUÁRIOS AO NAVIGATOR (V2)\n');
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
      console.log('💡 Solução: Verifique se o usuário existe no sistema.\n');
      process.exit(1);
    }
    
    if (vanessa.rows.length === 0) {
      console.error('❌ ERRO: Usuário Vanessa não encontrado!\n');
      console.log('💡 Solução: Verifique se o usuário existe no sistema.\n');
      process.exit(1);
    }
    
    const haendell_id = haendell.rows[0].id;
    const vanessa_id = vanessa.rows[0].id;
    
    console.log(`✅ Haendell encontrado: ${haendell.rows[0].name} (ID: ${haendell_id})`);
    console.log(`✅ Vanessa encontrada: ${vanessa.rows[0].name} (ID: ${vanessa_id})\n`);
    
    // 2. Verificar/Criar departamentos e cargos
    console.log('📂 Verificando/Criando departamentos e cargos...\n');
    
    await pool.query(`
      INSERT INTO departments (id, tenant_id, name, created_at)
      VALUES 
      (gen_random_uuid(), $1, 'Desenvolvimento', NOW()),
      (gen_random_uuid(), $1, 'Design', NOW()),
      (gen_random_uuid(), $1, 'Recursos Humanos', NOW()),
      (gen_random_uuid(), $1, 'Comercial', NOW()),
      (gen_random_uuid(), $1, 'Marketing', NOW()),
      (gen_random_uuid(), $1, 'Financeiro', NOW()),
      (gen_random_uuid(), $1, 'Operações', NOW()),
      (gen_random_uuid(), $1, 'Quality Assurance', NOW())
      ON CONFLICT (tenant_id, name) DO NOTHING
    `, [tenant_id]);
    
    console.log('✅ Departamentos verificados/criados\n');
    
    await pool.query(`
      INSERT INTO positions (id, tenant_id, name, created_at)
      VALUES 
      ('pos-dev-jr-001', $1, 'Desenvolvedor Júnior', NOW()),
      ('pos-dev-pl-001', $1, 'Desenvolvedor Pleno', NOW()),
      ('pos-dev-sr-001', $1, 'Desenvolvedor Sênior', NOW()),
      ('pos-tech-lead-001', $1, 'Tech Lead', NOW()),
      ('pos-design-jr-001', $1, 'Designer Júnior', NOW()),
      ('pos-design-pl-001', $1, 'Designer Pleno', NOW()),
      ('pos-design-sr-001', $1, 'Designer Sênior', NOW()),
      ('pos-rh-analista-001', $1, 'Analista de RH', NOW()),
      ('pos-rh-coord-001', $1, 'Coordenador de RH', NOW()),
      ('pos-vend-001', $1, 'Vendedor', NOW()),
      ('pos-vend-sr-001', $1, 'Vendedor Sênior', NOW()),
      ('pos-mkt-jr-001', $1, 'Analista de Marketing', NOW()),
      ('pos-mkt-pl-001', $1, 'Especialista de Marketing', NOW()),
      ('pos-qa-jr-001', $1, 'QA Júnior', NOW()),
      ('pos-qa-pl-001', $1, 'QA Pleno', NOW())
      ON CONFLICT DO NOTHING
    `, [tenant_id]);
    
    console.log('✅ Cargos verificados/criados\n');
    
    // 3. Inserir 15 novos usuários
    console.log('👥 Inserindo 15 novos usuários...\n');
    
    const result = await pool.query(`
      INSERT INTO users (
        id, tenant_id, name, email, phone, position, department, 
        position_id, department_id, gestor_id, buddy_id, role,
        status, onboarding_status, onboarding_inicio, start_date,
        created_at, updated_at
      ) VALUES 
      (gen_random_uuid(), $1, 'Ana Paula Santos', 'ana.paula@navigator.com', '+5521999887766', 'Desenvolvedor Júnior', 'Desenvolvimento', 'pos-dev-jr-001', 'dept-dev-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 3, CURRENT_DATE - 3, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Bruno Oliveira', 'bruno.oliveira@navigator.com', '+5521988776655', 'Desenvolvedor Pleno', 'Desenvolvimento', 'pos-dev-pl-001', 'dept-dev-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 5, CURRENT_DATE - 5, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Camila Ferreira', 'camila.ferreira@navigator.com', '+5521977665544', 'Designer Júnior', 'Design', 'pos-design-jr-001', 'dept-design-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 2, CURRENT_DATE - 2, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Diego Almeida', 'diego.almeida@navigator.com', '+5521966554433', 'Desenvolvedor Sênior', 'Desenvolvimento', 'pos-dev-sr-001', 'dept-dev-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 7, CURRENT_DATE - 7, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Fernanda Costa', 'fernanda.costa@navigator.com', '+5521955443322', 'Analista de Marketing', 'Marketing', 'pos-mkt-jr-001', 'dept-marketing-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 1, CURRENT_DATE - 1, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Gabriel Lima', 'gabriel.lima@navigator.com', '+5521944332211', 'QA Pleno', 'Quality Assurance', 'pos-qa-pl-001', 'dept-qa-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 6, CURRENT_DATE - 6, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Isabella Martins', 'isabella.martins@navigator.com', '+5521933221100', 'Desenvolvedor Pleno', 'Desenvolvimento', 'pos-dev-pl-001', 'dept-dev-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 4, CURRENT_DATE - 4, NOW(), NOW()),
      (gen_random_uuid(), $1, 'João Henrique', 'joao.henrique@navigator.com', '+5521922110099', 'Designer Pleno', 'Design', 'pos-design-pl-001', 'dept-design-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 8, CURRENT_DATE - 8, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Karina Silva', 'karina.silva@navigator.com', '+5521911009988', 'Analista de RH', 'Recursos Humanos', 'pos-rh-analista-001', 'dept-rh-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 10, CURRENT_DATE - 10, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Lucas Pereira', 'lucas.pereira@navigator.com', '+5521900998877', 'Vendedor', 'Comercial', 'pos-vend-001', 'dept-comercial-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 12, CURRENT_DATE - 12, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Mariana Rocha', 'mariana.rocha@navigator.com', '+5521888777666', 'Desenvolvedor Júnior', 'Desenvolvimento', 'pos-dev-jr-001', 'dept-dev-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 9, CURRENT_DATE - 9, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Natália Souza', 'natalia.souza@navigator.com', '+5521877666555', 'Tech Lead', 'Desenvolvimento', 'pos-tech-lead-001', 'dept-dev-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 11, CURRENT_DATE - 11, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Otávio Rodrigues', 'otavio.rodrigues@navigator.com', '+5521866555444', 'QA Júnior', 'Quality Assurance', 'pos-qa-jr-001', 'dept-qa-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 13, CURRENT_DATE - 13, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Patrícia Alves', 'patricia.alves@navigator.com', '+5521855444333', 'Especialista de Marketing', 'Marketing', 'pos-mkt-pl-001', 'dept-marketing-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 14, CURRENT_DATE - 14, NOW(), NOW()),
      (gen_random_uuid(), $1, 'Ricardo Barbosa', 'ricardo.barbosa@navigator.com', '+5521844333222', 'Vendedor Sênior', 'Comercial', 'pos-vend-sr-001', 'dept-comercial-001', $2, $3, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 15, CURRENT_DATE - 15, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [tenant_id, haendell_id, vanessa_id]);
    
    console.log(`✅ Inserção concluída!\n`);
    
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
      console.log(`\n✅ ${verificacao.rows.length} usuários inseridos com sucesso!\n`);
      console.log('📋 Lista de usuários inseridos:\n');
      console.table(verificacao.rows.map(u => ({
        Nome: u.name,
        Email: u.email,
        Departamento: u.department_name,
        Cargo: u.position_name,
        Status: u.onboarding_status,
        Início: u.start_date,
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
      
      // Listar últimos 5 usuários
      const ultimos = await pool.query(`
        SELECT name, email, onboarding_status FROM users 
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [tenant_id]);
      
      console.log('📋 Últimos 5 usuários no sistema:\n');
      console.table(ultimos.rows);
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

