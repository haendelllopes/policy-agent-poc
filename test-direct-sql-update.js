const axios = require('axios');

async function testDirectSQLUpdate() {
  console.log('🧪 Testando UPDATE direto no banco...\n');
  
  try {
    const userId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    const newBuddyId = '97625a2b-ab7b-4f6f-bd52-be3aed47647d'; // Livia
    const baseUrl = 'https://navigator-gules.vercel.app';
    
    // Primeiro, buscar dados atuais
    console.log('📥 Buscando dados atuais...');
    const userResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const currentUser = userResponse.data;
    
    console.log('👤 Usuário atual:', {
      id: currentUser.id,
      name: currentUser.name,
      buddy_id: currentUser.buddy_id
    });
    
    // Testar UPDATE com dados mínimos
    console.log(`\n🎯 Testando mudança de buddy para: ${newBuddyId}`);
    
    const updateData = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      position: currentUser.position,
      department: currentUser.department,
      start_date: currentUser.start_date,
      status: currentUser.status,
      gestor_id: currentUser.gestor_id,
      buddy_id: newBuddyId // Mudar apenas o buddy
    };
    
    console.log('📤 Dados para atualização:', {
      name: updateData.name,
      buddy_id: updateData.buddy_id
    });
    
    // Fazer a atualização
    console.log('\n🔄 Fazendo PUT request...');
    const updateResponse = await axios.put(
      `${baseUrl}/api/users/${userId}?tenant=demo`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Resposta da atualização:', updateResponse.data);
    
    // Verificar imediatamente após a atualização
    console.log('\n🔍 Verificando imediatamente após UPDATE...');
    const verifyResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const updatedUser = verifyResponse.data;
    
    console.log('👤 Usuário após atualização:', {
      id: updatedUser.id,
      name: updatedUser.name,
      buddy_id: updatedUser.buddy_id
    });
    
    // Verificar se o buddy foi realmente alterado
    if (updatedUser.buddy_id === newBuddyId) {
      console.log('✅ SUCESSO: Buddy foi atualizado corretamente!');
    } else {
      console.log('❌ FALHA: Buddy não foi atualizado!');
      console.log(`   Esperado: ${newBuddyId}`);
      console.log(`   Atual: ${updatedUser.buddy_id}`);
      
      // Testar novamente após alguns segundos
      console.log('\n⏳ Aguardando 3 segundos e testando novamente...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const retryResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const retryUser = retryResponse.data;
      
      console.log('👤 Usuário após retry:', {
        id: retryUser.id,
        name: retryUser.name,
        buddy_id: retryUser.buddy_id
      });
      
      if (retryUser.buddy_id === newBuddyId) {
        console.log('✅ SUCESSO NO RETRY: Buddy foi atualizado!');
      } else {
        console.log('❌ FALHA NO RETRY: Buddy ainda não foi atualizado!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDirectSQLUpdate();
