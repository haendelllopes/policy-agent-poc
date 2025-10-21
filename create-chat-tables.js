require('dotenv').config();
const { supabase } = require('./src/supabase/client');

async function createChatTables() {
  console.log('🚀 CRIANDO TABELAS CHAT REALTIME');
  console.log('=================================\n');

  try {
    // 1. Criar tabela chat_messages
    console.log('1️⃣ Criando tabela chat_messages...');
    const { error: messagesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES colaboradores(id),
          message TEXT NOT NULL,
          message_type VARCHAR(20) DEFAULT 'user' CHECK (message_type IN ('user', 'assistant', 'system')),
          context JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (messagesError) {
      console.log('⚠️ Erro chat_messages:', messagesError.message);
    } else {
      console.log('✅ Tabela chat_messages criada');
    }

    // 2. Criar tabela chat_sessions
    console.log('\n2️⃣ Criando tabela chat_sessions...');
    const { error: sessionsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES colaboradores(id),
          session_name VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (sessionsError) {
      console.log('⚠️ Erro chat_sessions:', sessionsError.message);
    } else {
      console.log('✅ Tabela chat_sessions criada');
    }

    // 3. Criar tabela chat_connections
    console.log('\n3️⃣ Criando tabela chat_connections...');
    const { error: connectionsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_connections (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES colaboradores(id),
          connection_id VARCHAR(255) UNIQUE,
          is_online BOOLEAN DEFAULT false,
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (connectionsError) {
      console.log('⚠️ Erro chat_connections:', connectionsError.message);
    } else {
      console.log('✅ Tabela chat_connections criada');
    }

    // 4. Criar índices
    console.log('\n4️⃣ Criando índices...');
    const { error: indexError } = await supabase.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_connections_user_id ON chat_connections(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_connections_connection_id ON chat_connections(connection_id);
      `
    });

    if (indexError) {
      console.log('⚠️ Erro índices:', indexError.message);
    } else {
      console.log('✅ Índices criados');
    }

    // 5. Habilitar Realtime
    console.log('\n5️⃣ Habilitando Realtime...');
    const { error: realtimeError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE chat_messages REPLICA IDENTITY FULL;
        ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
        ALTER TABLE chat_connections REPLICA IDENTITY FULL;
      `
    });

    if (realtimeError) {
      console.log('⚠️ Erro Realtime:', realtimeError.message);
    } else {
      console.log('✅ Realtime habilitado');
    }

    console.log('\n🎉 TABELAS CRIADAS COM SUCESSO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('- ✅ Tabelas de chat criadas');
    console.log('- ✅ Índices criados');
    console.log('- ✅ Realtime habilitado');
    console.log('\n⚠️ NOTA: Execute as políticas RLS manualmente no Supabase Dashboard');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createChatTables().catch(console.error);
