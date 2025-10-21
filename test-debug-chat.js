const axios = require('axios');

const API_URL = 'https://navigator-gules.vercel.app/api/chat';

async function testDebugChat() {
    console.log('🔍 Testando chat com debug detalhado...');
    
    try {
        const response = await axios.post(API_URL, {
            message: "Quais trilhas tenho disponíveis?",
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
        console.log('✅ Resposta:', response.data);
        
    } catch (error) {
        console.error('❌ Erro:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('❌ Dados do erro:', error.response.data);
            console.error('❌ Headers:', error.response.headers);
        }
        if (error.code) {
            console.error('❌ Código do erro:', error.code);
        }
    }
}

testDebugChat();
