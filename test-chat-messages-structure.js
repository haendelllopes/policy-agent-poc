const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Verificando estrutura da tabela chat_messages...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkTableStructure() {
    try {
        // Teste 1: Verificar estrutura atual
        console.log('\n📊 Verificando estrutura atual...');
        const { data: structure, error: structureError } = await supabase
            .from('chat_messages')
            .select('*')
            .limit(1);
        
        if (structureError) {
            console.log('❌ Erro ao verificar estrutura:', structureError.message);
        } else {
            console.log('✅ Estrutura atual:', structure);
        }
        
        // Teste 2: Tentar inserir sem a coluna role
        console.log('\n✍️ Testando inserção sem coluna role...');
        const testMessage = {
            id: 'test-' + Date.now(),
            user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2',
            message: 'Teste sem role',
            created_at: new Date().toISOString()
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('chat_messages')
            .insert(testMessage)
            .select();
        
        if (insertError) {
            console.log('❌ Erro na inserção:', insertError.message);
        } else {
            console.log('✅ Inserção funcionando sem role');
            console.log('📋 Dados inseridos:', insertData);
            
            // Limpar teste
            await supabase
                .from('chat_messages')
                .delete()
                .eq('id', testMessage.id);
            console.log('🧹 Teste removido');
        }
        
        // Teste 3: Verificar se precisa adicionar coluna role
        console.log('\n🛠️ Verificando se precisa adicionar coluna role...');
        const addRoleSQL = `
            ALTER TABLE chat_messages 
            ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
            CHECK (role IN ('user', 'assistant'));
        `;
        
        const { data: alterData, error: alterError } = await supabase
            .rpc('exec_sql', { sql: addRoleSQL });
        
        if (alterError) {
            console.log('❌ Erro ao adicionar coluna role:', alterError.message);
        } else {
            console.log('✅ Coluna role adicionada/verificada');
        }
        
        // Teste 4: Testar inserção com role
        console.log('\n✍️ Testando inserção com role...');
        const testMessageWithRole = {
            id: 'test-role-' + Date.now(),
            user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2',
            message: 'Teste com role',
            role: 'user',
            created_at: new Date().toISOString()
        };
        
        const { data: insertData2, error: insertError2 } = await supabase
            .from('chat_messages')
            .insert(testMessageWithRole)
            .select();
        
        if (insertError2) {
            console.log('❌ Erro na inserção com role:', insertError2.message);
        } else {
            console.log('✅ Inserção com role funcionando');
            console.log('📋 Dados inseridos:', insertData2);
            
            // Limpar teste
            await supabase
                .from('chat_messages')
                .delete()
                .eq('id', testMessageWithRole.id);
            console.log('🧹 Teste removido');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkTableStructure();
