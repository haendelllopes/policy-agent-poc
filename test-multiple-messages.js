const axios = require('axios');

const API_URL = 'https://navigator-gules.vercel.app/api/chat';

async function testSpecificMessages() {
    const messages = [
        "buscar documentos",
        "encontrar documentos sobre políticas",
        "quero ver os documentos da empresa",
        "mostre os manuais disponíveis",
        "busque políticas internas"
    ];
    
    for (const message of messages) {
        console.log(`\n🔍 Testando: "${message}"`);
        
        try {
            const response = await axios.post(API_URL, {
                message: message,
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
            
            console.log('✅ Resposta:', response.data.message.substring(0, 100) + '...');
            
        } catch (error) {
            console.error('❌ Erro:', error.response ? error.response.status : error.message);
        }
        
        // Aguardar um pouco entre testes
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

testSpecificMessages();
