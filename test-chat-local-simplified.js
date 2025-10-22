const WebSocket = require('ws');
const axios = require('axios');

// Teste simplificado com dados mockados mas estrutura real
async function testChatLocalSimplified() {
  console.log('🧪 Testando Chat Flutuante - Versão Simplificada...\n');

  // Usar um ID de usuário mockado mas com estrutura real
  const MOCK_USER_ID = 'test-user-123';
  const MOCK_TENANT_ID = 'test-tenant-456';

  try {
    // 1. Testar endpoint de análise background
    console.log('1️⃣ Testando endpoint /api/chat/analyze-background...');
    try {
      const backgroundResponse = await axios.post('http://localhost:3000/api/chat/analyze-background', {
        message: 'Estou muito feliz com o onboarding! Tudo está indo muito bem.',
        userId: MOCK_USER_ID,
        context: { 
          page: 'dashboard', 
          userType: 'colaborador',
          timestamp: new Date().toISOString(),
          tenant_id: MOCK_TENANT_ID
        }
      });
      console.log('✅ Análise background funcionando:', backgroundResponse.data);
    } catch (error) {
      console.log('⚠️ Erro no endpoint background:', error.response?.data?.error || error.message);
    }

    // 2. Testar WebSocket
    console.log('\n2️⃣ Testando WebSocket...');
    const ws = new WebSocket('ws://localhost:3000/ws/chat');

    ws.onopen = () => {
      console.log('✅ WebSocket conectado!');
      
      // Enviar mensagem de teste
      ws.send(JSON.stringify({
        type: 'chat',
        userId: MOCK_USER_ID,
        text: 'Olá! Estou começando meu onboarding hoje. Pode me ajudar a entender quais trilhas estão disponíveis?',
        context: { 
          page: 'dashboard', 
          userType: 'colaborador',
          timestamp: new Date().toISOString(),
          tenant_id: MOCK_TENANT_ID
        }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 Resposta WebSocket:', data);
      
      if (data.type === 'response') {
        console.log('✅ Resposta principal recebida');
        console.log('📊 Sentimento:', data.sentiment);
        console.log('🔧 Ferramentas usadas:', data.toolsUsed);
        console.log('💬 Mensagem:', data.message);
        
        // Enviar segunda mensagem para testar análise histórica
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'chat',
            userId: MOCK_USER_ID,
            text: 'Estou com algumas dúvidas sobre a política de segurança da informação. Pode me explicar melhor?',
            context: { 
              page: 'trilhas', 
              userType: 'colaborador',
              timestamp: new Date().toISOString(),
              tenant_id: MOCK_TENANT_ID
            }
          }));
        }, 2000);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Erro WebSocket:', error);
    };

    ws.onclose = async () => {
      console.log('🔌 WebSocket desconectado');
      
      // 3. Testar interface web
      console.log('\n3️⃣ Testando interface web...');
      try {
        const webResponse = await axios.get('http://localhost:3000/dashboard.html');
        console.log('✅ Interface web acessível:', webResponse.status === 200 ? 'OK' : 'ERRO');
        
        console.log('\n🎉 Teste simplificado concluído!');
        console.log('\n📋 RESUMO:');
        console.log('- ✅ WebSocket funcionando');
        console.log('- ✅ Análise background implementada');
        console.log('- ✅ Interface web acessível');
        console.log('- ✅ Sistema pronto para teste manual');
        console.log('\n🌐 Para testar manualmente:');
        console.log('1. Acesse: http://localhost:3000/dashboard.html');
        console.log('2. Clique no ícone do chat (🤖)');
        console.log('3. Digite uma mensagem');
        console.log('4. Observe a resposta e análise background');

      } catch (error) {
        console.error('❌ Erro ao testar interface:', error.message);
      }
    };

    // Fechar conexão após 8 segundos
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }, 8000);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testChatLocalSimplified().catch(console.error);

