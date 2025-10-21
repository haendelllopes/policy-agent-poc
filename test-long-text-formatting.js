const WebSocket = require('ws');

async function testLongTextFormatting() {
  console.log('🧪 Testando Formatação de Textos Longos...\n');

  const ws = new WebSocket('ws://localhost:3000/ws/chat');

  ws.on('open', () => {
    console.log('✅ WebSocket conectado!');
    
    // Teste com texto longo e formatado
    console.log('\n1️⃣ Testando texto longo com formatação...');
    ws.send(JSON.stringify({
      type: 'message',
      text: 'Olá Navi! Preciso de ajuda com o processo de onboarding. Você pode me explicar detalhadamente como funciona o sistema de trilhas? Quero entender:\n\n1. Como são organizadas as trilhas\n2. Quanto tempo leva para completar cada uma\n3. Quais são os requisitos para finalizar\n4. Como funciona o sistema de feedback\n\nTambém gostaria de saber sobre **políticas importantes** da empresa e se há algum *documento específico* que devo ler primeiro.\n\nPor favor, seja bem detalhado na sua explicação!',
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
        
        // Teste com código e formatação especial
        setTimeout(() => {
          console.log('\n2️⃣ Testando formatação de código...');
          ws.send(JSON.stringify({
            type: 'message',
            text: 'Navi, você pode me mostrar um exemplo de como usar a API do sistema? Preciso de um exemplo de código para integrar com nosso sistema interno.\n\n```javascript\nconst response = await fetch(\'/api/trilhas/disponiveis\', {\n  method: \'GET\',\n  headers: {\n    \'Authorization\': \'Bearer \' + token\n  }\n});\n```\n\nIsso está correto?',
            userId: 'admin-demo',
            context: { page: 'dashboard', userType: 'admin' }
          }));
        }, 3000);
        
        // Fechar conexão após testes
        setTimeout(() => {
          console.log('\n✅ Testes de formatação concluídos!');
          ws.close();
        }, 6000);
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
testLongTextFormatting().catch(console.error);
