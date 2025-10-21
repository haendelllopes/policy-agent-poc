const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Diagnosticando problema do Realtime...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function diagnoseRealtime() {
    try {
        console.log('\n📊 Verificando configuração das tabelas...');
        
        // Verificar se as tabelas têm REPLICA IDENTITY FULL
        const { data: tables, error: tablesError } = await supabase
            .rpc('exec_sql', { 
                sql: `SELECT schemaname, tablename, replicaidentity 
                      FROM pg_tables 
                      WHERE tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
                      AND schemaname = 'public'` 
            });
        
        if (tablesError) {
            console.log('❌ Erro ao verificar tabelas:', tablesError.message);
        } else {
            console.log('✅ Status das tabelas:', tables);
        }
        
        // Teste 1: Verificar se consegue inserir
        console.log('\n✍️ Testando inserção...');
        const testMessage = {
            user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2',
            message: 'Teste Diagnóstico',
            message_type: 'user'
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
                .eq('id', insertData[0].id);
            console.log('🧹 Teste removido');
        }
        
        // Teste 2: Tentar subscription com diferentes configurações
        console.log('\n📡 Testando subscription com configurações diferentes...');
        
        // Configuração 1: Básica
        console.log('🔄 Teste 1: Subscription básica...');
        let received1 = false;
        const channel1 = supabase
            .channel('test-basic')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    console.log('📨 Recebido (básico):', payload.new);
                    received1 = true;
                }
            )
            .subscribe();
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Inserir mensagem
        const { data: insert1, error: insert1Error } = await supabase
            .from('chat_messages')
            .insert({
                user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2',
                message: 'Teste Básico',
                message_type: 'user'
            })
            .select();
        
        if (!insert1Error) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await supabase.from('chat_messages').delete().eq('id', insert1[0].id);
        }
        
        supabase.removeChannel(channel1);
        
        if (received1) {
            console.log('✅ Subscription básica funcionando!');
        } else {
            console.log('❌ Subscription básica não funcionou');
        }
        
        // Configuração 2: Com broadcast
        console.log('\n🔄 Teste 2: Subscription com broadcast...');
        let received2 = false;
        const channel2 = supabase
            .channel('test-broadcast', {
                config: {
                    broadcast: { self: true }
                }
            })
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    console.log('📨 Recebido (broadcast):', payload.new);
                    received2 = true;
                }
            )
            .subscribe();
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Inserir mensagem
        const { data: insert2, error: insert2Error } = await supabase
            .from('chat_messages')
            .insert({
                user_id: '3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2',
                message: 'Teste Broadcast',
                message_type: 'user'
            })
            .select();
        
        if (!insert2Error) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await supabase.from('chat_messages').delete().eq('id', insert2[0].id);
        }
        
        supabase.removeChannel(channel2);
        
        if (received2) {
            console.log('✅ Subscription com broadcast funcionando!');
        } else {
            console.log('❌ Subscription com broadcast não funcionou');
        }
        
        console.log('\n🎯 Diagnóstico concluído!');
        
        if (!received1 && !received2) {
            console.log('\n💡 Possíveis soluções:');
            console.log('1. Verificar se Realtime está habilitado no projeto Supabase');
            console.log('2. Verificar se as tabelas têm REPLICA IDENTITY FULL');
            console.log('3. Verificar se não há políticas RLS bloqueando');
            console.log('4. Tentar habilitar Realtime via Dashboard');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

diagnoseRealtime();
