const axios = require('axios');

async function testarChatHttpCompleto() {
  try {
    console.log('🔍 Testando chat HTTP completo...');
    
    const userId = '4ab6c765-bcfc-4280-84cd-3190fcf881c2';
    const message = 'quem sou eu';
    const context = {
      url: 'https://navigator-gules.vercel.app/dashboard.html',
      title: 'Insights - Navigator',
      timestamp: new Date().toISOString()
    };
    
    console.log('📡 Fazendo requisição para /api/chat...');
    
    const response = await axios.post('https://navigator-gules.vercel.app/api/chat', {
      message: message,
      userId: userId,
      context: context
    });
    
    console.log('✅ Resposta recebida:');
    console.log('📋 Dados da resposta:');
    console.log(`   • Tipo: ${response.data.type}`);
    console.log(`   • Mensagem: ${response.data.message}`);
    console.log(`   • Sentimento: ${response.data.sentiment}`);
    console.log(`   • Ferramentas usadas: ${response.data.toolsUsed}`);
    
    console.log('\n🔍 Analisando a resposta:');
    if (response.data.message.includes('Usuário teste')) {
      console.log('❌ PROBLEMA: Resposta contém "Usuário teste"');
      console.log('✅ Deveria conter: "Haendell Lopes"');
    } else if (response.data.message.includes('Haendell Lopes')) {
      console.log('✅ CORRETO: Resposta contém "Haendell Lopes"');
    } else {
      console.log('⚠️ Resposta genérica ou diferente');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar chat HTTP:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Dados:', error.response.data);
    }
  }
}

testarChatHttpCompleto();

