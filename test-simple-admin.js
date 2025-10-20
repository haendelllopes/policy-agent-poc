// test-simple-admin.js
/**
 * TESTE SIMPLES DAS FERRAMENTAS DE ADMIN
 * Verifica se as ferramentas estão sendo reconhecidas pelo GPT
 */

const WebSocket = require('ws');

async function testSimpleAdmin() {
  console.log('🧪 Teste Simples das Ferramentas de Admin...\n');

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('1️⃣ Conectando ao WebSocket...');
    const ws = new WebSocket('ws://localhost:3000/ws/chat');

    ws.on('open', () => {
      console.log('✅ WebSocket conectado!');

      // Teste muito direto
      console.log('\n2️⃣ Testando comando direto...');
      ws.send(JSON.stringify({
        type: 'chat',
        userId: 'admin-test-123',
        text: 'Use a ferramenta analisar_performance_colaboradores para analisar todos os colaboradores',
        context: { 
          page: 'dashboard',
          userType: 'admin'
        }
      }));
    });

    ws.on('message', (data) => {
      const response = JSON.parse(data);
      console.log('📨 Resposta:', response);

      if (response.type === 'response') {
        console.log('💬 Mensagem:', response.message);
        console.log('🔧 Ferramentas usadas:', response.toolsUsed);
        
        if (response.toolsUsed.length > 0) {
          console.log('🎉 SUCESSO! Ferramentas foram chamadas!');
        } else {
          console.log('❌ PROBLEMA: Ferramentas não foram chamadas');
        }
        
        ws.close();
      }
    });

    ws.on('error', (error) => {
      console.error('❌ Erro:', error.message);
    });

    ws.on('close', () => {
      console.log('🔌 Conexão fechada');
    });

    setTimeout(() => {
      console.log('⏰ Timeout');
      process.exit(1);
    }, 15000);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testSimpleAdmin();
