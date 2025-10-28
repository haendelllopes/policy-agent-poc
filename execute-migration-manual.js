// ============================================
// SCRIPT: Executar Migração Manual
// Arquivo: execute-migration-manual.js
// Descrição: Executa a migração via axios
// ============================================

const axios = require('axios');

const BASE_URL = 'https://policy-agent-4alsgs11o-haendelllopes-projects.vercel.app';

async function executeMigration() {
    try {
        console.log('🚀 Executando migração de dados mock...');
        console.log('🌐 URL:', BASE_URL);
        
        const response = await axios.post(`${BASE_URL}/api/migration/insert-mock-data`);
        
        if (response.status === 200) {
            console.log('✅ Migração executada com sucesso!');
            console.log('📊 Resposta:', response.data);
            
            if (response.data.summary) {
                console.log('📈 Resumo da migração:');
                console.log(`   ✅ Inseridos: ${response.data.summary.inserted}`);
                console.log(`   ❌ Erros: ${response.data.summary.errors}`);
                console.log('📋 Verificação:');
                Object.entries(response.data.summary.verification).forEach(([key, value]) => {
                    console.log(`   📊 ${key}: ${value} registros`);
                });
            }
        } else {
            console.log('⚠️ Migração retornou status:', response.status);
        }
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Erro na migração:');
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Mensagem: ${error.response.data?.message || error.response.statusText}`);
            
            if (error.response.status === 401) {
                console.log('💡 Erro de autenticação - endpoint protegido pelo Vercel');
                console.log('💡 Você precisa acessar via navegador ou configurar autenticação');
            }
        } else {
            console.log('❌ Erro de conexão:', error.message);
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executeMigration();
}

module.exports = { executeMigration };











