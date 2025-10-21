const axios = require('axios');

const API_URL = 'https://navigator-gules.vercel.app/api/documents/semantic-search';

async function testDocumentSearch() {
    console.log('🔍 Testando busca de documentos diretamente...');
    
    try {
        const response = await axios.post(API_URL, {
            query: "políticas",
            limit: 5
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-subdomain': 'demo' // Adicionar header do tenant
            }
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Resposta:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('❌ Dados do erro:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testDocumentSearch();
