const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 Executando migração das tabelas de chat...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function runMigration() {
    try {
        console.log('\n📋 Executando migração das tabelas de chat...');
        
        // SQL para criar/atualizar tabelas de chat
        const migrationSQL = `
-- =====================================
-- SUPABASE REALTIME - TABELAS DE CHAT
-- =====================================

-- Tabela para mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'user' CHECK (message_type IN ('user', 'assistant', 'system')),
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para sessões de chat
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  session_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para status de conexão
CREATE TABLE IF NOT EXISTS chat_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  connection_id VARCHAR(255) UNIQUE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_connections_user_id ON chat_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_connections_connection_id ON chat_connections(connection_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Realtime para as tabelas
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE chat_connections REPLICA IDENTITY FULL;
        `;
        
        // Executar migração
        const { data: migrationData, error: migrationError } = await supabase
            .rpc('exec_sql', { sql: migrationSQL });
        
        if (migrationError) {
            console.log('❌ Erro na migração:', migrationError.message);
            
            // Tentar executar comandos individuais
            console.log('\n🔄 Tentando executar comandos individuais...');
            
            const commands = migrationSQL.split(';').filter(cmd => cmd.trim());
            
            for (const command of commands) {
                if (command.trim()) {
                    try {
                        const { data: cmdData, error: cmdError } = await supabase
                            .rpc('exec_sql', { sql: command.trim() });
                        
                        if (cmdError) {
                            console.log('⚠️ Comando falhou:', command.substring(0, 50) + '...', cmdError.message);
                        } else {
                            console.log('✅ Comando executado:', command.substring(0, 50) + '...');
                        }
                    } catch (err) {
                        console.log('⚠️ Erro no comando:', command.substring(0, 50) + '...', err.message);
                    }
                }
            }
        } else {
            console.log('✅ Migração executada com sucesso');
        }
        
        // Teste final: verificar se as tabelas foram criadas
        console.log('\n🧪 Testando tabelas criadas...');
        
        const { data: testData, error: testError } = await supabase
            .from('chat_messages')
            .select('*')
            .limit(1);
        
        if (testError) {
            console.log('❌ Erro no teste:', testError.message);
        } else {
            console.log('✅ Tabela chat_messages funcionando');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

runMigration();

