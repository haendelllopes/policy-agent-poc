const axios = require('axios');

async function testarEndpointUsuario() {
  try {
    console.log('🔍 Testando endpoint do usuário...');
    
    const userId = '4ab6c765-bcfc-4280-84cd-3190fcf881c2';
    const url = `https://navigator-gules.vercel.app/api/agent/trilhas/colaborador/${userId}`;
    
    console.log(`📡 Fazendo requisição para: ${url}`);
    
    const response = await axios.get(url);
    
    console.log('✅ Resposta recebida:');
    console.log('📋 Dados do usuário:');
    console.log(`   • ID: ${response.data.id}`);
    console.log(`   • Nome: ${response.data.nome}`);
    console.log(`   • Email: ${response.data.email}`);
    console.log(`   • Telefone: ${response.data.telefone}`);
    console.log(`   • Cargo: ${response.data.cargo}`);
    console.log(`   • Departamento: ${response.data.departamento}`);
    console.log(`   • Data de admissão: ${response.data.data_admissao}`);
    console.log(`   • Status: ${response.data.status}`);
    console.log(`   • Gestor: ${response.data.gestor_nome || 'N/A'}`);
    console.log(`   • Buddy: ${response.data.buddy_nome || 'N/A'}`);
    
    console.log('\n🔍 Comparando com dados esperados:');
    console.log('✅ Nome esperado: Haendell Lopes');
    console.log('✅ Cargo esperado: Coordenador');
    console.log('✅ Departamento esperado: Desenvolvimento');
    
    if (response.data.nome === 'Haendell Lopes' && 
        response.data.cargo === 'Coordenador' && 
        response.data.departamento === 'Desenvolvimento') {
      console.log('\n🎉 Dados corretos! O endpoint está funcionando.');
      console.log('❌ O problema deve estar no chat ou no personalizationEngine.');
    } else {
      console.log('\n❌ Dados incorretos no endpoint!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Dados:', error.response.data);
    }
  }
}

testarEndpointUsuario();

