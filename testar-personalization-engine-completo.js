const axios = require('axios');

async function testarPersonalizationEngineCompleto() {
  try {
    console.log('🔍 Testando personalizationEngine completo...');
    
    const userId = '4ab6c765-bcfc-4280-84cd-3190fcf881c2';
    
    // Simular exatamente o que o personalizationEngine faz
    console.log('📡 Fazendo requisição como o personalizationEngine...');
    
    const baseUrl = 'https://navigator-gules.vercel.app';
    const fullUrl = `${baseUrl}/api/agent/trilhas/colaborador/${userId}`;
    
    console.log(`🌐 URL: ${fullUrl}`);
    
    const response = await axios.get(fullUrl);
    
    console.log('✅ Resposta recebida:');
    console.log('📋 Dados do usuário:');
    console.log(`   • Nome: ${response.data.nome}`);
    console.log(`   • Cargo: ${response.data.cargo}`);
    console.log(`   • Departamento: ${response.data.departamento}`);
    
    // Simular o que o generateSystemMessage faria
    const userContext = {
      name: response.data.nome,
      position: response.data.cargo,
      department: response.data.departamento,
      sentimento_atual: 'neutro',
      sentimento_intensidade: 0.5,
      id: userId
    };
    
    console.log('\n🎯 Contexto que seria usado no generateSystemMessage:');
    console.log(`   • Nome: ${userContext.name}`);
    console.log(`   • Cargo: ${userContext.position}`);
    console.log(`   • Departamento: ${userContext.department}`);
    
    // Simular a mensagem do sistema
    const systemMessage = `Você é o **Navi**, assistente de onboarding inteligente e proativo.

🎯 **CONTEXTO ATUAL:**
- **Colaborador:** ${userContext.name}
- **Cargo:** ${userContext.position}
- **Departamento:** ${userContext.department}
- **Sentimento:** ${userContext.sentimento_atual} (${userContext.sentimento_intensidade}%)`;
    
    console.log('\n📝 Mensagem do sistema que seria gerada:');
    console.log(systemMessage);
    
    console.log('\n🔍 Comparando com resposta do chat:');
    console.log('❌ Chat disse: "Usuário teste, um Desenvolvedor"');
    console.log('✅ Deveria dizer:', `"${userContext.name}, um ${userContext.position}"`);
    
    console.log('\n🔍 Testando se há erro na requisição...');
    
    // Testar se há erro na requisição
    try {
      const testResponse = await axios.get(fullUrl);
      console.log('✅ Requisição funcionou:', testResponse.data.nome);
    } catch (testError) {
      console.log('❌ Erro na requisição:', testError.message);
      if (testError.response) {
        console.log('📋 Status:', testError.response.status);
        console.log('📋 Dados:', testError.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Dados:', error.response.data);
    }
  }
}

testarPersonalizationEngineCompleto();
