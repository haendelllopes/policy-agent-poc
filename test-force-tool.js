const axios = require('axios');

const API_URL = 'https://navigator-gules.vercel.app/api/chat';

async function testForceTool() {
    console.log('🔍 Testando com mensagem que deve forçar a ferramenta...');
    
    try {
        const response = await axios.post(API_URL, {
            message: "buscar documentos sobre políticas",
            userId: "colaborador-demo",
            context: {
                page: "colaborador-trilhas",
                userType: "colaborador"
            }
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Resposta:', response.data.message);
        
    } catch (error) {
        console.error('❌ Erro:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('❌ Dados do erro:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testForceTool();
