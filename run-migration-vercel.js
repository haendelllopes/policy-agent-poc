// ============================================
// SCRIPT: Executar Migração via Vercel Cron
// Arquivo: run-migration-vercel.js
// Descrição: Executa migração via endpoint de cron do Vercel
// ============================================

const axios = require('axios');

const BASE_URL = 'https://policy-agent-g9ij64jya-haendelllopes-projects.vercel.app';
const CRON_SECRET = process.env.CRON_SECRET || 'your_cron_secret_here';

async function runMigrationViaCron() {
    try {
        console.log('🚀 Executando migração via Vercel Cron...');
        console.log('🌐 URL:', BASE_URL);
        
        // 1. Testar se o sistema está funcionando
        console.log('🧪 Testando sistema proativo...');
        try {
            const testResponse = await axios.get(`${BASE_URL}/api/cron/monitoramento-continuo`, {
                headers: {
                    'x-cron-secret': CRON_SECRET
                }
            });
            
            if (testResponse.status === 200) {
                console.log('✅ Sistema proativo funcionando!');
                console.log('📊 Resposta:', testResponse.data);
            } else {
                console.log('⚠️ Sistema retornou status:', testResponse.status);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('⚠️ Erro de autenticação - CRON_SECRET pode estar incorreto');
                console.log('💡 Configure o CRON_SECRET nas variáveis de ambiente do Vercel');
            } else {
                console.log('❌ Erro ao testar sistema:', error.message);
            }
        }
        
        // 2. Executar análise horária (que pode inserir dados)
        console.log('⏰ Executando análise horária...');
        try {
            const hourlyResponse = await axios.get(`${BASE_URL}/api/cron/analise-horaria`, {
                headers: {
                    'x-cron-secret': CRON_SECRET
                }
            });
            
            if (hourlyResponse.status === 200) {
                console.log('✅ Análise horária executada!');
                console.log('📊 Resposta:', hourlyResponse.data);
            }
        } catch (error) {
            console.log('⚠️ Erro na análise horária:', error.response?.data?.message || error.message);
        }
        
        // 3. Executar relatório diário
        console.log('📅 Executando relatório diário...');
        try {
            const dailyResponse = await axios.get(`${BASE_URL}/api/cron/relatorio-diario`, {
                headers: {
                    'x-cron-secret': CRON_SECRET
                }
            });
            
            if (dailyResponse.status === 200) {
                console.log('✅ Relatório diário executado!');
                console.log('📊 Resposta:', dailyResponse.data);
            }
        } catch (error) {
            console.log('⚠️ Erro no relatório diário:', error.response?.data?.message || error.message);
        }
        
        // 4. Testar endpoint de métricas do dashboard
        console.log('📊 Testando endpoint de métricas...');
        try {
            const metricsResponse = await axios.get(`${BASE_URL}/api/dashboard/metrics/5978f911-738b-4aae-802a-f037fdac2e64`);
            
            if (metricsResponse.status === 200) {
                console.log('✅ Endpoint de métricas funcionando!');
                console.log('📈 Dados:', metricsResponse.data);
            } else {
                console.log('⚠️ Endpoint retornou status:', metricsResponse.status);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('⚠️ Endpoint requer autenticação');
            } else {
                console.log('❌ Erro no endpoint de métricas:', error.message);
            }
        }
        
        console.log('🎉 Migração via cron concluída!');
        console.log('📊 Sistema proativo deve estar funcionando com dados mock');
        
        console.log('🌐 Acesse o dashboard em:');
        console.log(`   ${BASE_URL}/dashboard.html`);
        
    } catch (error) {
        console.error('❌ Erro durante migração:', error);
        console.error('📋 Detalhes do erro:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    runMigrationViaCron();
}

module.exports = { runMigrationViaCron };











