const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🧪 Testando se Realtime foi ativado...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testRealtimeActivation() {
    try {
        console.log('\n📡 Testando Realtime após ativação...');
        
        let messageReceived = false;
        
        // Criar subscription
        const channel = supabase
            .channel('activation-test')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    console.log('🎉 REALTIME FUNCIONANDO! Mensagem recebida:', payload.new);
                    messageReceived = true;
                }
            )
            .subscribe();
        
        console.log('✅ Subscription criada');
        
        // Aguardar conexão
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Inserir mensagem de teste
        const testMessage = {
            user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2',
            message: 'Teste Realtime Ativado',
            message_type: 'user'
        };
        
        console.log('✍️ Inserindo mensagem de teste...');
        const { data: insertData, error: insertError } = await supabase
            .from('chat_messages')
            .insert(testMessage)
            .select();
        
        if (insertError) {
            console.log('❌ Erro na inserção:', insertError.message);
        } else {
            console.log('✅ Mensagem inserida:', insertData[0].id);
            
            // Aguardar recebimento via Realtime
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            if (messageReceived) {
                console.log('🎉🎉🎉 REALTIME ATIVADO COM SUCESSO! 🎉🎉🎉');
            } else {
                console.log('❌ Realtime ainda não está funcionando');
                console.log('💡 Verifique se ativou corretamente no Dashboard');
            }
            
            // Limpar teste
            await supabase
                .from('chat_messages')
                .delete()
                .eq('id', insertData[0].id);
            console.log('🧹 Teste removido');
        }
        
        // Cancelar subscription
        supabase.removeChannel(channel);
        console.log('🔌 Subscription cancelada');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

testRealtimeActivation();

