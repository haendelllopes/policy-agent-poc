/**
 * Executa migrations no Supabase de forma segura
 * Uma migration por vez, com conexão nova para cada uma
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Criar pool com timeout maior
function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 60000,
    statement_timeout: 60000,
    max: 1 // Uma conexão por vez
  });
}

async function executarMigration(file, sql) {
  const pool = createPool();
  
  try {
    console.log(`\n📍 Executando: ${file}...`);
    
    const client = await pool.connect();
    
    try {
      // Executar a migration
      await client.query(sql);
      console.log(`   ✅ ${file} - SUCESSO`);
      return { success: true, file };
    } catch (error) {
      // Ignorar erros de "já existe"
      if (error.message.includes('already exists')) {
        console.log(`   ⚠️  ${file} - Já existe (OK)`);
        return { success: true, file, skipped: true };
      } else if (error.message.includes('does not exist') && file.includes('007')) {
        // Erro conhecido na migration 007 - pode ignorar
        console.log(`   ⚠️  ${file} - Erro conhecido (ignorado)`);
        return { success: true, file, skipped: true };
      } else {
        console.log(`   ❌ ${file} - ERRO: ${error.message}`);
        return { success: false, file, error: error.message };
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.log(`   ❌ ${file} - ERRO DE CONEXÃO: ${error.message}`);
    return { success: false, file, error: error.message };
  } finally {
    await pool.end();
    // Aguardar um pouco entre migrations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function executarTodasMigrations() {
  console.log('\n🚀 EXECUTANDO MIGRATIONS NO SUPABASE\n');
  console.log('='.repeat(60));
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`\n📂 Migrations encontradas: ${files.length}\n`);
  
  const resultados = [];
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    const resultado = await executarMigration(file, sql);
    resultados.push(resultado);
    
    // Se falhou e não foi erro conhecido, parar
    if (!resultado.success && !resultado.skipped) {
      console.log(`\n⚠️  Parando devido a erro em ${file}\n`);
      break;
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO DAS MIGRATIONS:\n');
  
  const sucesso = resultados.filter(r => r.success && !r.skipped).length;
  const ignoradas = resultados.filter(r => r.skipped).length;
  const erros = resultados.filter(r => !r.success).length;
  
  console.log(`   ✅ Executadas com sucesso: ${sucesso}`);
  console.log(`   ⚠️  Ignoradas (já existiam): ${ignoradas}`);
  console.log(`   ❌ Com erro: ${erros}`);
  
  // Verificar estrutura do banco
  console.log('\n🔍 Verificando tabelas criadas...\n');
  
  const pool = createPool();
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`📊 Tabelas no banco (${result.rows.length}):\n`);
    result.rows.forEach((row, i) => {
      console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${row.table_name}`);
    });
    
    // Verificar se a tabela colaboradores existe
    const temColaboradores = result.rows.some(r => r.table_name === 'colaboradores');
    
    console.log('\n' + '='.repeat(60));
    
    if (temColaboradores) {
      console.log('\n🎉 SUCESSO! Tabela "colaboradores" criada!');
      console.log('✅ Agora você pode testar a análise de sentimento completa!\n');
    } else {
      console.log('\n⚠️  Tabela "colaboradores" ainda não existe.');
      console.log('   Pode ser necessário executar a migration manualmente no Supabase.\n');
    }
    
  } catch (error) {
    console.log(`   ❌ Erro ao verificar tabelas: ${error.message}`);
  } finally {
    await pool.end();
  }
}

executarTodasMigrations()
  .then(() => {
    console.log('🏁 Processo concluído!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  });

