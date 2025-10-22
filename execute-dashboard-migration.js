// ============================================
// SCRIPT: Executar Migração Dashboard em Produção
// Arquivo: execute-dashboard-migration.js
// Descrição: Executa a migração SQL em produção via Supabase
// ============================================

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
    try {
        console.log('🚀 Executando migração de dados mock para dashboard em produção...');
        
        // Ler o arquivo SQL
        const fs = require('fs');
        const path = require('path');
        const sqlFile = path.join(__dirname, 'migrations', '016_dashboard_mock_data.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('📄 Arquivo SQL carregado:', sqlFile);
        console.log('📊 Tamanho do arquivo:', sqlContent.length, 'caracteres');
        
        // Dividir o SQL em comandos individuais
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 10 && !cmd.startsWith('--'))
            .filter(cmd => !cmd.includes('DO $$') && !cmd.includes('END $$'));
        
        console.log('📋 Executando', commands.length, 'comandos SQL principais...');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            try {
                console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
                
                // Executar comando SQL via Supabase
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_query: command 
                });
                
                if (error) {
                    console.log(`⚠️ Comando ${i + 1} teve erro:`, error.message);
                    errorCount++;
                } else {
                    console.log(`✅ Comando ${i + 1} executado com sucesso`);
                    successCount++;
                }
            } catch (cmdError) {
                console.log(`❌ Erro no comando ${i + 1}:`, cmdError.message);
                errorCount++;
            }
        }
        
        console.log('📊 Resultado da migração:');
        console.log(`   ✅ Sucessos: ${successCount}`);
        console.log(`   ❌ Erros: ${errorCount}`);
        
        // Verificar se os dados foram inseridos
        console.log('🔍 Verificando dados inseridos...');
        
        const checks = [
            { name: 'Alertas proativos', table: 'agente_anotacoes' },
            { name: 'Melhorias/ações', table: 'onboarding_improvements' },
            { name: 'Notificações', table: 'notifications' },
            { name: 'Usuários com risco', table: 'users' }
        ];
        
        for (const check of checks) {
            try {
                const { data, error } = await supabase
                    .from(check.table)
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', '5978f911-738b-4aae-802a-f037fdac2e64');
                
                if (error) {
                    console.log(`⚠️ Erro ao verificar ${check.name}:`, error.message);
                } else {
                    console.log(`📊 ${check.name}: ${data?.length || 0} registros`);
                }
            } catch (verifyError) {
                console.log(`⚠️ Erro na verificação de ${check.name}:`, verifyError.message);
            }
        }
        
        // Testar endpoint de métricas
        console.log('🧪 Testando endpoint de métricas...');
        try {
            const response = await fetch('https://policy-agent-g9ij64jya-haendelllopes-projects.vercel.app/api/dashboard/metrics/5978f911-738b-4aae-802a-f037fdac2e64');
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Endpoint de métricas funcionando!');
                console.log('📈 Métricas principais:', {
                    trilhasAtivas: data.trilhasAtivas,
                    usuariosOnboarding: data.usuariosOnboarding,
                    alertasAtivos: data.alertasAtivos,
                    colaboradoresRisco: data.colaboradoresRisco
                });
            } else {
                console.log('⚠️ Endpoint retornou:', response.status);
            }
        } catch (error) {
            console.log('⚠️ Erro ao testar endpoint:', error.message);
        }
        
        console.log('🎉 Migração concluída!');
        console.log('📊 Dashboard pronto para uso com dados mock otimizados');
        
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        console.error('📋 Detalhes do erro:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executeMigration();
}

module.exports = { executeMigration };

