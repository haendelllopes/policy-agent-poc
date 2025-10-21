const WebSocket = require('ws');

async function testEnhancedWebSocketChat() {
  console.log('🧪 Testando Chat WebSocket Aprimorado...\n');

  const ws = new WebSocket('ws://localhost:3000/ws/chat');

  ws.on('open', () => {
    console.log('✅ WebSocket conectado!');
    
    // Teste 1: Mensagem simples
    console.log('\n1️⃣ Testando mensagem simples...');
    ws.send(JSON.stringify({
      type: 'message',
      text: 'Olá Navi! Quais trilhas estão disponíveis para mim?',
      userId: 'admin-demo',
      context: { page: 'dashboard', userType: 'admin' }
    }));
  });

  ws.on('message', (data) => {
    try {
      const response = JSON.parse(data);
      console.log('📨 Resposta recebida:', response);
      
      if (response.type === 'message') {
        console.log('💬 Resposta do Navi:', response.text);
        
        if (response.toolsUsed && response.toolsUsed.length > 0) {
          console.log('🔧 Ferramentas utilizadas:', response.toolsUsed.map(t => t.tool).join(', '));
        }
        
        // Teste 2: Finalizar trilha
        setTimeout(() => {
          console.log('\n2️⃣ Testando finalizar trilha...');
          ws.send(JSON.stringify({
            type: 'message',
            text: 'Quero finalizar a trilha de Segurança do Trabalho',
            userId: 'admin-demo',
            context: { page: 'dashboard', userType: 'admin' }
          }));
        }, 2000);
        
        // Teste 3: Criar anotação
        setTimeout(() => {
          console.log('\n3️⃣ Testando criação de anotação...');
          ws.send(JSON.stringify({
            type: 'message',
            text: 'Estou tendo dificuldade com o conteúdo sobre políticas de férias',
            userId: 'admin-demo',
            context: { page: 'dashboard', userType: 'admin' }
          }));
        }, 4000);
        
        // Teste 4: Registrar sentimento
        setTimeout(() => {
          console.log('\n4️⃣ Testando registro de sentimento...');
          ws.send(JSON.stringify({
            type: 'message',
            text: 'Estou muito frustrado com este processo de onboarding',
            userId: 'admin-demo',
            context: { page: 'dashboard', userType: 'admin' }
          }));
        }, 6000);
        
        // Teste 5: Gerar melhoria
        setTimeout(() => {
          console.log('\n5️⃣ Testando geração de melhoria...');
          ws.send(JSON.stringify({
            type: 'message',
            text: 'Sugiro que vocês melhorem a interface do sistema de trilhas',
            userId: 'admin-demo',
            context: { page: 'dashboard', userType: 'admin' }
          }));
        }, 8000);
        
        // Fechar conexão após testes
        setTimeout(() => {
          console.log('\n✅ Testes concluídos!');
          ws.close();
        }, 10000);
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Erro WebSocket:', error);
  });

  ws.on('close', () => {
    console.log('🔌 Conexão WebSocket fechada');
  });
}

// Executar testes
testEnhancedWebSocketChat().catch(console.error);
