const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Verificando tabelas do Supabase...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkTables() {
    try {
        // Teste 1: Verificar se consegue listar tabelas
        console.log('\n📊 Listando tabelas disponíveis...');
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_tables');
        
        if (tablesError) {
            console.log('❌ Erro ao listar tabelas:', tablesError.message);
            
            // Tentar método alternativo
            console.log('\n🔄 Tentando método alternativo...');
            const { data: altTables, error: altError } = await supabase
                .from('pg_tables')
                .select('tablename')
                .eq('schemaname', 'public');
            
            if (altError) {
                console.log('❌ Método alternativo também falhou:', altError.message);
            } else {
                console.log('✅ Tabelas encontradas:', altTables.map(t => t.tablename));
            }
        } else {
            console.log('✅ Tabelas encontradas:', tables);
        }
        
        // Teste 2: Verificar estrutura da tabela chat_messages
        console.log('\n🔍 Verificando estrutura da tabela chat_messages...');
        const { data: messages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .limit(1);
        
        if (messagesError) {
            console.log('❌ Erro ao acessar chat_messages:', messagesError.message);
            
            // Tentar criar a tabela se não existir
            console.log('\n🛠️ Tentando criar tabela chat_messages...');
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id TEXT PRIMARY KEY,
                    user_id UUID REFERENCES users(id),
                    message TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    session_id TEXT,
                    metadata JSONB
                );
            `;
            
            const { data: createData, error: createError } = await supabase
                .rpc('exec_sql', { sql: createTableSQL });
            
            if (createError) {
                console.log('❌ Erro ao criar tabela:', createError.message);
            } else {
                console.log('✅ Tabela chat_messages criada/verificada');
            }
        } else {
            console.log('✅ Tabela chat_messages acessível');
        }
        
        // Teste 3: Verificar se tabela users existe
        console.log('\n👥 Verificando tabela users...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email')
            .limit(1);
        
        if (usersError) {
            console.log('❌ Erro ao acessar users:', usersError.message);
        } else {
            console.log('✅ Tabela users acessível');
            if (users && users.length > 0) {
                console.log('📋 Exemplo de usuário:', users[0]);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkTables();

