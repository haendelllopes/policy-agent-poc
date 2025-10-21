const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🧪 Teste final do Supabase Realtime...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function finalRealtimeTest() {
    try {
        console.log('\n📡 Testando Realtime com configuração otimizada...');
        
        let messageReceived = false;
        let subscriptionReady = false;
        
        // Criar subscription com configuração otimizada
        const channel = supabase
            .channel('final-test', {
                config: {
                    broadcast: { self: true },
                    presence: { key: 'test' }
                }
            })
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    console.log('📨 Realtime recebido:', payload.new);
                    messageReceived = true;
                }
            )
            .on('system', {}, (status) => {
                console.log('🔄 Status da subscription:', status);
                if (status === 'SUBSCRIBED') {
                    subscriptionReady = true;
                }
            })
            .subscribe();
        
        console.log('✅ Subscription criada');
        
        // Aguardar subscription estar pronta
        let attempts = 0;
        while (!subscriptionReady && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
            console.log(`⏳ Aguardando subscription... (${attempts}/10)`);
        }
        
        if (!subscriptionReady) {
            console.log('❌ Subscription não ficou pronta');
            supabase.removeChannel(channel);
            return;
        }
        
        console.log('✅ Subscription pronta');
        
        // Aguardar um pouco mais para garantir
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Inserir mensagem para testar Realtime
        const testMessage = {
            user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2',
            message: 'Teste Final Realtime',
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
                console.log('🎉 REALTIME FUNCIONANDO PERFEITAMENTE!');
            } else {
                console.log('❌ Realtime ainda não está funcionando');
                console.log('💡 Execute o arquivo CORRECAO_RLS_REALTIME.sql no Supabase Dashboard');
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

finalRealtimeTest();
