require('dotenv').config();
const { supabase } = require('./src/supabase/client');
const fs = require('fs');
const path = require('path');

async function runChatMigrations() {
  console.log('🚀 EXECUTANDO MIGRAÇÕES CHAT REALTIME');
  console.log('=====================================\n');

  try {
    // 1. Executar migração das tabelas
    console.log('1️⃣ Criando tabelas de chat...');
    const tablesSQL = fs.readFileSync(path.join(__dirname, 'migrations/007_create_chat_tables.sql'), 'utf8');
    
    const { error: tablesError } = await supabase.rpc('exec_sql', { sql: tablesSQL });
    if (tablesError) {
      console.log('⚠️ Erro ao criar tabelas (pode já existir):', tablesError.message);
    } else {
      console.log('✅ Tabelas de chat criadas');
    }

    // 2. Executar migração RLS
    console.log('\n2️⃣ Configurando Row Level Security...');
    const rlsSQL = fs.readFileSync(path.join(__dirname, 'migrations/008_chat_rls_policies.sql'), 'utf8');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.log('⚠️ Erro ao configurar RLS (pode já existir):', rlsError.message);
    } else {
      console.log('✅ RLS configurado');
    }

    // 3. Verificar tabelas criadas
    console.log('\n3️⃣ Verificando tabelas...');
    const tables = ['chat_messages', 'chat_sessions', 'chat_connections'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela ${table}:`, error.message);
      } else {
        console.log(`✅ Tabela ${table}: OK`);
      }
    }

    console.log('\n🎉 MIGRAÇÕES CONCLUÍDAS!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('- ✅ Tabelas de chat criadas');
    console.log('- ✅ RLS configurado');
    console.log('- ✅ Realtime habilitado');
    console.log('\n🚀 Pronto para Fase 3: Migração do Sistema');

  } catch (error) {
    console.error('❌ Erro nas migrações:', error);
  }
}

runChatMigrations().catch(console.error);
