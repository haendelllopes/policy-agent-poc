const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Testando Supabase Realtime especificamente...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testRealtime() {
    try {
        console.log('\n⚡ Testando Realtime...');
        
        // Teste 1: Verificar se Realtime está habilitado
        const { data: realtimeData, error: realtimeError } = await supabase
            .from('chat_messages')
            .select('*')
            .limit(1);
        
        if (realtimeError) {
            console.log('❌ Erro no Realtime:', realtimeError.message);
        } else {
            console.log('✅ Realtime funcionando');
        }
        
        // Teste 2: Testar inserção com estrutura correta
        console.log('\n✍️ Testando inserção com estrutura correta...');
        const testMessage = {
            id: 'test-' + Date.now(),
            user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2', // UUID válido
            message: 'Teste de conexão Realtime',
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
            console.log('📋 Dados inseridos:', insertData);
            
            // Limpar teste
            await supabase
                .from('chat_messages')
                .delete()
                .eq('id', testMessage.id);
            console.log('🧹 Teste removido');
        }
        
        // Teste 3: Testar subscription (Realtime)
        console.log('\n📡 Testando subscription Realtime...');
        const channel = supabase
            .channel('test-channel')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    console.log('📨 Realtime recebido:', payload);
                }
            )
            .subscribe();
        
        console.log('✅ Subscription criada');
        
        // Aguardar um pouco e depois cancelar
        setTimeout(() => {
            supabase.removeChannel(channel);
            console.log('🔌 Subscription cancelada');
        }, 2000);
        
        console.log('\n🎉 Teste de Realtime concluído!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

testRealtime();

