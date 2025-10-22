const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🧪 Testando Supabase Realtime após migração...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testAfterMigration() {
    try {
        console.log('\n📊 Verificando estrutura das tabelas...');
        
        // Teste 1: Verificar se chat_messages tem a estrutura correta
        const { data: messages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .limit(1);
        
        if (messagesError) {
            console.log('❌ Erro ao acessar chat_messages:', messagesError.message);
        } else {
            console.log('✅ Tabela chat_messages acessível');
        }
        
        // Teste 2: Testar inserção com estrutura completa
        console.log('\n✍️ Testando inserção com estrutura completa...');
        const testMessage = {
            user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2',
            message: 'Teste de Realtime após migração',
            message_type: 'user',
            context: { test: true }
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
                .eq('id', insertData[0].id);
            console.log('🧹 Teste removido');
        }
        
        // Teste 3: Testar Realtime subscription
        console.log('\n📡 Testando Realtime subscription...');
        let messageReceived = false;
        
        const channel = supabase
            .channel('test-realtime')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    console.log('📨 Realtime recebido:', payload.new);
                    messageReceived = true;
                }
            )
            .subscribe();
        
        console.log('✅ Subscription criada');
        
        // Aguardar um pouco para a subscription se conectar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Inserir mensagem para testar Realtime
        const realtimeTestMessage = {
            user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2',
            message: 'Teste Realtime',
            message_type: 'user'
        };
        
        const { data: realtimeInsert, error: realtimeInsertError } = await supabase
            .from('chat_messages')
            .insert(realtimeTestMessage)
            .select();
        
        if (realtimeInsertError) {
            console.log('❌ Erro na inserção Realtime:', realtimeInsertError.message);
        } else {
            console.log('✅ Mensagem inserida para teste Realtime');
            
            // Aguardar um pouco para receber via Realtime
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (messageReceived) {
                console.log('🎉 Realtime funcionando perfeitamente!');
            } else {
                console.log('⚠️ Realtime pode não estar funcionando');
            }
            
            // Limpar teste
            await supabase
                .from('chat_messages')
                .delete()
                .eq('id', realtimeInsert[0].id);
            console.log('🧹 Teste Realtime removido');
        }
        
        // Cancelar subscription
        supabase.removeChannel(channel);
        console.log('🔌 Subscription cancelada');
        
        // Teste 4: Verificar outras tabelas
        console.log('\n📋 Verificando outras tabelas...');
        
        const { data: sessions, error: sessionsError } = await supabase
            .from('chat_sessions')
            .select('*')
            .limit(1);
        
        if (sessionsError) {
            console.log('❌ Erro ao acessar chat_sessions:', sessionsError.message);
        } else {
            console.log('✅ Tabela chat_sessions acessível');
        }
        
        const { data: connections, error: connectionsError } = await supabase
            .from('chat_connections')
            .select('*')
            .limit(1);
        
        if (connectionsError) {
            console.log('❌ Erro ao acessar chat_connections:', connectionsError.message);
        } else {
            console.log('✅ Tabela chat_connections acessível');
        }
        
        console.log('\n🎉 Teste completo concluído!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

testAfterMigration();

