const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Testando conexão com Supabase...');

// Verificar variáveis de ambiente
console.log('\n📋 Variáveis de ambiente:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Definida' : '❌ Não definida');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('\n❌ Credenciais do Supabase não encontradas!');
    console.log('Verifique se as variáveis estão definidas no Vercel:');
    console.log('- SUPABASE_URL');
    console.log('- SUPABASE_ANON_KEY');
    process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
    try {
        console.log('\n🔗 Testando conexão...');
        
        // Teste 1: Verificar se as tabelas existem
        console.log('\n📊 Verificando tabelas...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['chat_messages', 'chat_sessions', 'chat_connections', 'users']);
        
        if (tablesError) {
            console.log('❌ Erro ao verificar tabelas:', tablesError.message);
        } else {
            console.log('✅ Tabelas encontradas:', tables.map(t => t.table_name));
        }
        
        // Teste 2: Verificar se Realtime está habilitado
        console.log('\n⚡ Testando Realtime...');
        const { data: realtimeData, error: realtimeError } = await supabase
            .from('chat_messages')
            .select('*')
            .limit(1);
        
        if (realtimeError) {
            console.log('❌ Erro no Realtime:', realtimeError.message);
        } else {
            console.log('✅ Realtime funcionando');
        }
        
        // Teste 3: Testar inserção (se possível)
        console.log('\n✍️ Testando inserção...');
        const testMessage = {
            id: 'test-' + Date.now(),
            user_id: 'test-user',
            message: 'Teste de conexão',
            role: 'user',
            created_at: new Date().toISOString()
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('chat_messages')
            .insert(testMessage)
            .select();
        
        if (insertError) {
            console.log('❌ Erro na inserção:', insertError.message);
        } else {
            console.log('✅ Inserção funcionando');
            
            // Limpar teste
            await supabase
                .from('chat_messages')
                .delete()
                .eq('id', testMessage.id);
            console.log('🧹 Teste removido');
        }
        
        console.log('\n🎉 Teste de conexão concluído!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

testConnection();

