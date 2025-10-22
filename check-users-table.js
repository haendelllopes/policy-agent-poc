require('dotenv').config();
const { supabase } = require('./src/supabase/client');

async function checkUsersTable() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA USERS');
  console.log('========================================\n');

  try {
    // 1. Tentar inserir com campos mínimos
    console.log('1️⃣ Tentando inserir com campos mínimos...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: 'teste@supabase.com'
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar usuário:', createError.message);
      
      // 2. Tentar apenas com email e id
      console.log('\n2️⃣ Tentando com email e id...');
      const { data: newUser2, error: createError2 } = await supabase
        .from('users')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'teste2@supabase.com'
        })
        .select()
        .single();
      
      if (createError2) {
        console.log('❌ Erro ao criar usuário 2:', createError2.message);
        
        // 3. Verificar estrutura consultando
        console.log('\n3️⃣ Verificando estrutura via consulta...');
        const { data: structure, error: structureError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
        
        if (structureError) {
          console.log('❌ Erro ao consultar estrutura:', structureError.message);
        } else {
          console.log('✅ Estrutura da tabela users:');
          if (structure && structure.length > 0) {
            console.log('   Campos:', Object.keys(structure[0]));
          } else {
            console.log('   Tabela vazia - não é possível ver estrutura');
          }
        }
        
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

checkUsersTable().then(userId => {
  if (userId) {
    console.log('\n🎉 USUÁRIO DE TESTE PRONTO!');
    console.log(`📋 ID do usuário: ${userId}`);
    console.log('\n🚀 Agora você pode executar:');
    console.log('   node test-fase3-corrected.js');
  } else {
    console.log('\n❌ Falha ao criar usuário de teste');
    console.log('\n💡 SOLUÇÃO: Execute o SQL de correção no Supabase Dashboard:');
    console.log('\n-- Corrigir foreign keys para users');
    console.log('ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;');
    console.log('ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;');
    console.log('ALTER TABLE chat_connections DROP CONSTRAINT IF EXISTS chat_connections_user_id_fkey;');
    console.log('');
    console.log('ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);');
    console.log('ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);');
    console.log('ALTER TABLE chat_connections ADD CONSTRAINT chat_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);');
  }
}).catch(console.error);

