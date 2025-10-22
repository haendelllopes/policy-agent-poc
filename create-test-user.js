require('dotenv').config();
const { supabase } = require('./src/supabase/client');

async function createTestUser() {
  console.log('🧪 CRIANDO USUÁRIO DE TESTE');
  console.log('===========================\n');

  try {
    // 1. Verificar se já existe usuário
    console.log('1️⃣ Verificando usuários existentes...');
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);
    
    if (checkError) {
      console.log('❌ Erro ao verificar usuários:', checkError.message);
      return false;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log(`✅ ${existingUsers.length} usuários encontrados:`);
      existingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`);
      });
      return existingUsers[0].id;
    }

    // 2. Criar usuário de teste
    console.log('\n2️⃣ Criando usuário de teste...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: 'teste@supabase.com',
        nome: 'Usuário Teste Supabase',
        tenant_id: '5978f911-738b-4aae-802a-f037fdac2e64',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar usuário:', createError.message);
      
      // Tentar sem tenant_id
      console.log('\n3️⃣ Tentando sem tenant_id...');
      const { data: newUser2, error: createError2 } = await supabase
        .from('users')
        .insert({
          email: 'teste2@supabase.com',
          nome: 'Usuário Teste Supabase 2',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError2) {
        console.log('❌ Erro ao criar usuário 2:', createError2.message);
        return false;
      } else {
        console.log('✅ Usuário de teste criado:', newUser2.id);
        return newUser2.id;
      }
    } else {
      console.log('✅ Usuário de teste criado:', newUser.id);
      return newUser.id;
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

createTestUser().then(userId => {
  if (userId) {
    console.log('\n🎉 USUÁRIO DE TESTE PRONTO!');
    console.log(`📋 ID do usuário: ${userId}`);
    console.log('\n🚀 Agora você pode executar:');
    console.log('   node test-fase3-corrected.js');
  } else {
    console.log('\n❌ Falha ao criar usuário de teste');
  }
}).catch(console.error);

