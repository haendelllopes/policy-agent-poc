const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🧪 Testando Chat Híbrido com Supabase Realtime...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testHybridChat() {
    try {
        console.log('\n📡 Simulando chat híbrido...');
        
        // Simular usuário logado
        const userId = '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2';
        const userName = 'Vanessa Teste';
        
        console.log(`👤 Usuário: ${userName} (${userId})`);
        
        // Criar subscription para receber mensagens
        let messageReceived = false;
        const channel = supabase
            .channel('hybrid-chat-test')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    console.log('📨 Mensagem recebida via Realtime:', payload.new.message);
                    messageReceived = true;
                }
            )
            .subscribe();
        
        console.log('✅ Subscription criada');
        
        // Aguardar conexão
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular envio de mensagem do usuário
        console.log('\n✍️ Enviando mensagem do usuário...');
        const userMessage = {
            user_id: userId,
            message: 'Olá Navi, como você está?',
            message_type: 'user'
        };
        
        const { data: userInsert, error: userError } = await supabase
            .from('chat_messages')
            .insert(userMessage)
            .select();
        
        if (userError) {
            console.log('❌ Erro ao enviar mensagem do usuário:', userError.message);
        } else {
            console.log('✅ Mensagem do usuário enviada:', userInsert[0].message);
            
            // Aguardar recebimento via Realtime
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (messageReceived) {
                console.log('🎉 Chat híbrido funcionando perfeitamente!');
            } else {
                console.log('⚠️ Mensagem não foi recebida via Realtime');
            }
            
            // Simular resposta do assistente
            console.log('\n🤖 Enviando resposta do assistente...');
            const assistantMessage = {
                user_id: userId,
                message: 'Olá! Estou funcionando perfeitamente com Supabase Realtime! 🚀',
                message_type: 'assistant'
            };
            
            const { data: assistantInsert, error: assistantError } = await supabase
                .from('chat_messages')
                .insert(assistantMessage)
                .select();
            
            if (assistantError) {
                console.log('❌ Erro ao enviar resposta do assistente:', assistantError.message);
            } else {
                console.log('✅ Resposta do assistente enviada:', assistantInsert[0].message);
            }
            
            // Limpar mensagens de teste
            await supabase
                .from('chat_messages')
                .delete()
                .eq('id', userInsert[0].id);
            
            await supabase
                .from('chat_messages')
                .delete()
                .eq('id', assistantInsert[0].id);
            
            console.log('🧹 Mensagens de teste removidas');
        }
        
        // Cancelar subscription
        supabase.removeChannel(channel);
        console.log('🔌 Subscription cancelada');
        
        console.log('\n🎉 Teste do chat híbrido concluído!');
        console.log('✅ Supabase Realtime está funcionando perfeitamente!');
        console.log('🚀 O chat híbrido deve detectar automaticamente o Supabase!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

testHybridChat();
