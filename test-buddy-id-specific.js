const axios = require('axios');

async function testBuddyIdSpecific() {
  console.log('🧪 Testando problema específico do buddy_id...\n');
  
  try {
    const baseUrl = 'https://navigator-gules.vercel.app';
    const userId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    
    // Buscar dados atuais
    console.log('📥 Buscando dados atuais...');
    const currentResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const currentUser = currentResponse.data;
    
    console.log('👤 Usuário atual:', {
      id: currentUser.id,
      name: currentUser.name,
      gestor_id: currentUser.gestor_id,
      buddy_id: currentUser.buddy_id
    });
    
    // Buscar todos os usuários
    const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
    const users = usersResponse.data;
    
    // Testar com diferentes usuários
    const otherUsers = users.filter(u => u.id !== userId && u.status === 'active');
    
    console.log('\n🧪 Testando com diferentes usuários...');
    
    for (let i = 0; i < Math.min(3, otherUsers.length); i++) {
      const testBuddy = otherUsers[i];
      console.log(`\n🎯 Teste ${i + 1}: Tentando buddy ${testBuddy.name} (${testBuddy.id})`);
      
      const updateData = {
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        position: currentUser.position,
        department: currentUser.department,
        start_date: currentUser.start_date,
        status: currentUser.status,
        gestor_id: currentUser.gestor_id,
        buddy_id: testBuddy.id
      };
      
      console.log('📤 Dados para atualização:', {
        name: updateData.name,
        buddy_id: updateData.buddy_id,
        buddy_name: testBuddy.name
      });
      
      // Fazer a atualização
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
      
      // Verificar imediatamente
      const verifyResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyUser = verifyResponse.data;
      
      console.log('👤 Usuário após atualização:', {
        id: verifyUser.id,
        name: verifyUser.name,
        gestor_id: verifyUser.gestor_id,
        buddy_id: verifyUser.buddy_id
      });
      
      if (verifyUser.buddy_id === testBuddy.id) {
        console.log('✅ SUCESSO: Buddy foi atualizado!');
        break;
      } else {
        console.log('❌ FALHA: Buddy não foi atualizado!');
        console.log(`   Esperado: ${testBuddy.id}`);
        console.log(`   Atual: ${verifyUser.buddy_id}`);
      }
      
      // Aguardar um pouco entre os testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Testar com null
    console.log('\n🧪 Teste final: Tentando buddy_id = null...');
    const nullUpdateData = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      position: currentUser.position,
      department: currentUser.department,
      start_date: currentUser.start_date,
      status: currentUser.status,
      gestor_id: currentUser.gestor_id,
      buddy_id: null
    };
    
    const nullUpdateResponse = await axios.put(
      `${baseUrl}/api/users/${userId}?tenant=demo`,
      nullUpdateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Resposta da atualização com null:', nullUpdateResponse.data);
    
    // Verificar se foi atualizado para null
    const verifyNullResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const verifyNullUser = verifyNullResponse.data;
    
    console.log('👤 Usuário após atualização com null:', {
      id: verifyNullUser.id,
      name: verifyNullUser.name,
      gestor_id: verifyNullUser.gestor_id,
      buddy_id: verifyNullUser.buddy_id
    });
    
    if (verifyNullUser.buddy_id === null) {
      console.log('✅ SUCESSO: Buddy foi atualizado para null!');
    } else {
      console.log('❌ FALHA: Buddy não foi atualizado para null!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testBuddyIdSpecific();
