/**
 * Script para rodar migrations no banco de dados
 */

require('dotenv').config();
const { query } = require('./src/db-pg');
const fs = require('fs');
const path = require('path');

async function rodarMigrations() {
  try {
    console.log('\n🔧 RODANDO MIGRATIONS NO BANCO DE DADOS\n');
    console.log('='.repeat(50));
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`\n📂 Encontradas ${files.length} migrations:\n`);
    files.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
    
    console.log('\n🚀 Executando...\n');
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`📍 Executando: ${file}...`);
      
      try {
        await query(sql);
        console.log(`   ✅ ${file} - OK\n`);
      } catch (error) {
        // Se o erro for "already exists", ignorar
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  ${file} - Já existe (ignorado)\n`);
        } else {
          console.log(`   ❌ ${file} - ERRO: ${error.message}\n`);
          throw error;
        }
      }
    }
    
    console.log('='.repeat(50));
    console.log('\n🎉 MIGRATIONS CONCLUÍDAS COM SUCESSO!\n');
    
    // Verificar tabelas criadas
    const tabelas = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Tabelas criadas (${tabelas.rows.length}):\n`);
    tabelas.rows.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.table_name}`);
    });
    
    console.log('\n✅ Banco de dados pronto para uso!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO AO RODAR MIGRATIONS:', error.message);
    process.exit(1);
  }
}

rodarMigrations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

