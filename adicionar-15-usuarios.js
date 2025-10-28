/**
 * Script para adicionar 15 novos usuários ao Navigator
 * Executa o arquivo SQL: adicionar-15-usuarios.sql
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
    console.log('\n🚀 ADICIONANDO 15 NOVOS USUÁRIOS AO NAVIGATOR\n');
    console.log('='.repeat(70));
    
    const arquivoSQL = 'adicionar-15-usuarios.sql';
    console.log(`\n📄 Lendo arquivo: ${arquivoSQL}\n`);
    
    const sql = fs.readFileSync(arquivoSQL, 'utf8');
    
    console.log('🔧 Executando SQL...\n');
    const result = await pool.query(sql);
    
    console.log('\n✅ SQL executado com sucesso!\n');
    
    // Verificar usuários inseridos
    console.log('🔍 Verificando usuários inseridos...\n');
    console.log('='.repeat(70));
    
    const verificacao = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        d.name as department_name,
        p.name as position_name,
        u.onboarding_status,
        u.start_date,
        u.gestor_id,
        u.buddy_id
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN positions p ON u.position_id = p.id
      WHERE u.tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64'
      AND u.created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY u.created_at DESC
      LIMIT 20
    `);
    
    if (verificacao.rows.length > 0) {
      console.log(`\n✅ ${verificacao.rows.length} usuários inseridos com sucesso!\n`);
      console.log('📋 Lista de usuários inseridos:\n');
      console.table(verificacao.rows.map(u => ({
        Nome: u.name,
        Email: u.email,
        Departamento: u.department_name,
        Cargo: u.position_name,
        Status: u.onboarding_status,
        Início: u.start_date
      })));
      
      // Verificar gestor e buddy
      const primeiroUsuario = verificacao.rows[0];
      if (primeiroUsuario.gestor_id && primeiroUsuario.buddy_id) {
        console.log('\n✅ Gestor e Buddy configurados corretamente!\n');
      } else {
        console.log('\n⚠️  Aviso: Gestor ou Buddy não configurados\n');
      }
    } else {
      console.log('\n⚠️  Nenhum usuário novo encontrado (pode já ter sido inserido anteriormente)\n');
      
      // Verificar total de usuários
      const total = await pool.query(`
        SELECT COUNT(*) as total FROM users 
        WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64'
      `);
      
      console.log(`📊 Total de usuários no sistema: ${total.rows[0].total}\n`);
    }
    
    console.log('='.repeat(70));
    console.log('\n🎉 PROCESSO CONCLUÍDO!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    
    if (error.message.includes('Haendell')) {
      console.error('\n⚠️  Erro: Usuário Haendell não encontrado.');
      console.error('Certifique-se de que o usuário Haendell existe no sistema.\n');
    } else if (error.message.includes('Vanessa')) {
      console.error('\n⚠️  Erro: Usuário Vanessa não encontrado.');
      console.error('Certifique-se de que o usuário Vanessa existe no sistema.\n');
    }
    
    console.error('\nDetalhes completos do erro:', error);
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

