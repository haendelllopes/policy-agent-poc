const axios = require('axios');

// Teste direto do endpoint de busca de documentos
async function testDocumentSearchDirect() {
    console.log('🔍 Testando busca de documentos diretamente...');
    
    try {
        const response = await axios.post('https://navigator-gules.vercel.app/api/documents/semantic-search', {
            query: "políticas",
            limit: 5
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-subdomain': 'demo'
            }
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Documentos encontrados:', response.data.length);
        console.log('✅ Primeiro documento:', response.data[0]?.title);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Erro na busca direta:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('❌ Dados do erro:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

// Teste do chat com mensagem mais simples
async function testChatSimple() {
    console.log('🔍 Testando chat com mensagem simples...');
    
    try {
        const response = await axios.post('https://navigator-gules.vercel.app/api/chat', {
            message: "buscar documentos",
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
        console.error('❌ Erro no chat:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('❌ Dados do erro:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

async function runTests() {
    console.log('🧪 Executando testes sequenciais...\n');
    
    // Teste 1: Busca direta
    console.log('=== TESTE 1: BUSCA DIRETA ===');
    const documentos = await testDocumentSearchDirect();
    
    console.log('\n=== TESTE 2: CHAT SIMPLES ===');
    await testChatSimple();
    
    console.log('\n=== RESUMO ===');
    if (documentos && documentos.length > 0) {
        console.log('✅ Documentos encontrados na busca direta:', documentos.length);
        console.log('❌ Mas o chat não está apresentando os documentos');
        console.log('🔍 Problema: A ferramenta não está sendo executada ou os resultados não estão sendo processados');
    } else {
        console.log('❌ Nenhum documento encontrado na busca direta');
        console.log('🔍 Problema: Base de dados ou endpoint com problema');
    }
}

runTests();
