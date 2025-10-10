/**
 * Verifica estrutura das tabelas e foreign keys
 */

require('dotenv').config();
const { Pool } = require('pg');

async function verificar() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('\n🔍 VERIFICANDO ESTRUTURA DO BANCO\n');
    console.log('='.repeat(60));
    
    // 1. Verificar se colaborador existe
    console.log('\n1️⃣  Verificando colaborador de teste...\n');
    const colaborador = await pool.query(`
      SELECT id, nome, email, tenant_id 
      FROM colaboradores 
      WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    `);
    
    if (colaborador.rows.length > 0) {
      console.log('✅ Colaborador encontrado:');
      console.table(colaborador.rows);
    } else {
      console.log('❌ Colaborador NÃO encontrado!');
    }
    
    // 2. Verificar estrutura da tabela colaborador_sentimentos
    console.log('\n2️⃣  Estrutura da tabela colaborador_sentimentos...\n');
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'colaborador_sentimentos'
      ORDER BY ordinal_position
    `);
    
    console.table(estrutura.rows);
    
    // 3. Verificar foreign keys
    console.log('\n3️⃣  Foreign Keys da tabela colaborador_sentimentos...\n');
    const fks = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'colaborador_sentimentos'
    `);
    
    console.table(fks.rows);
    
    // 4. Verificar se a FK aponta para 'users' ou 'colaboradores'
    if (fks.rows.length > 0) {
      const fkColaborador = fks.rows.find(fk => fk.column_name === 'colaborador_id');
      
      if (fkColaborador) {
        console.log(`\n💡 FK colaborador_id aponta para: ${fkColaborador.foreign_table_name}.${fkColaborador.foreign_column_name}`);
        
        if (fkColaborador.foreign_table_name === 'users') {
          console.log('\n⚠️  PROBLEMA ENCONTRADO!');
          console.log('   A FK aponta para "users" mas estamos inserindo em "colaboradores"');
          console.log('\n🔧 SOLUÇÃO: Vamos corrigir a FK...\n');
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  } finally {
    await pool.end();
  }
}

verificar()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

