#!/usr/bin/env node

/**
 * 🧪 TESTE RÁPIDO DO SISTEMA PROATIVO EM PRODUÇÃO
 */

const https = require('https');

const BASE_URL = 'https://policy-agent-k172812fo-haendelllopes-projects.vercel.app';
const CRON_SECRET = 'proactive-system-2024-secure-key-1734892800';

function testEndpoint(endpoint, description) {
    return new Promise((resolve) => {
        const options = {
            headers: {
                'x-cron-secret': CRON_SECRET
            }
        };

        https.get(`${BASE_URL}${endpoint}`, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`✅ ${description}: Status ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        console.log(`   📊 Resultado: ${JSON.stringify(result, null, 2)}`);
                    } catch (e) {
                        console.log(`   📄 Resposta: ${data.substring(0, 200)}...`);
                    }
                } else {
                    console.log(`   ❌ Erro: ${data.substring(0, 200)}...`);
                }
                resolve();
            });
        }).on('error', (err) => {
            console.log(`❌ ${description}: Erro de conexão - ${err.message}`);
            resolve();
        });
    });
}

async function runTests() {
    console.log('🚀 TESTANDO SISTEMA PROATIVO EM PRODUÇÃO');
    console.log('🌐 URL:', BASE_URL);
    console.log('🔐 CRON_SECRET:', CRON_SECRET);
    console.log('');

    await testEndpoint('/api/cron/monitoramento-continuo', 'Monitoramento Contínuo (15min)');
    await testEndpoint('/api/cron/analise-horaria', 'Análise Horária');
    await testEndpoint('/api/cron/relatorio-diario', 'Relatório Diário');
    
    console.log('');
    console.log('🎯 TESTE DO DASHBOARD:');
    console.log(`📱 Acesse: ${BASE_URL}/dashboard.html`);
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('1. Acesse o dashboard no navegador');
    console.log('2. Verifique se a seção de Proatividade está funcionando');
    console.log('3. Monitore os cron jobs no dashboard do Vercel');
    console.log('4. Verifique se os alertas estão sendo gerados');
}

runTests().catch(console.error);
