const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTabelas() {
  try {
    console.log('🔍 Verificando tabelas disponíveis...');
    
    // Verificar tabela users
    console.log('\n📋 Verificando tabela "users"...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Erro na tabela users:', usersError.message);
    } else {
      console.log(`✅ Tabela users: ${users.length} registros encontrados`);
      if (users.length > 0) {
        console.log('📋 Primeiro usuário:', users[0]);
      }
    }
    
    // Verificar tabela colaboradores
    console.log('\n📋 Verificando tabela "colaboradores"...');
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('*')
      .limit(5);
    
    if (colaboradoresError) {
      console.log('❌ Erro na tabela colaboradores:', colaboradoresError.message);
    } else {
      console.log(`✅ Tabela colaboradores: ${colaboradores.length} registros encontrados`);
      if (colaboradores.length > 0) {
        console.log('📋 Primeiro colaborador:', colaboradores[0]);
      }
    }
    
    // Verificar tabela tenants
    console.log('\n📋 Verificando tabela "tenants"...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(5);
    
    if (tenantsError) {
      console.log('❌ Erro na tabela tenants:', tenantsError.message);
    } else {
      console.log(`✅ Tabela tenants: ${tenants.length} registros encontrados`);
      if (tenants.length > 0) {
        console.log('📋 Primeiro tenant:', tenants[0]);
      }
    }
    
    // Verificar tabela conversation_history
    console.log('\n📋 Verificando tabela "conversation_history"...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversation_history')
      .select('*')
      .limit(5);
    
    if (conversationsError) {
      console.log('❌ Erro na tabela conversation_history:', conversationsError.message);
    } else {
      console.log(`✅ Tabela conversation_history: ${conversations.length} registros encontrados`);
      if (conversations.length > 0) {
        console.log('📋 Primeira conversa:', conversations[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarTabelas();

