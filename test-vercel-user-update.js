const axios = require('axios');

async function testVercelUserUpdate() {
  console.log('🧪 Testando atualização de usuário no Vercel...\n');
  
  try {
    const userId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    const baseUrl = 'https://navigator-gules.vercel.app';
    
    // Primeiro, buscar dados atuais do usuário
    console.log('📥 Buscando dados atuais do usuário...');
    const userResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const currentUser = userResponse.data;
    
    console.log('👤 Usuário atual:', {
      id: currentUser.id,
      name: currentUser.name,
      gestor_id: currentUser.gestor_id,
      buddy_id: currentUser.buddy_id
    });
    
    // Buscar lista de usuários para escolher um buddy diferente
    console.log('\n📋 Buscando lista de usuários...');
    const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
    const users = usersResponse.data;
    
    console.log('👥 Usuários disponíveis:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.id})`);
    });
    
    // Escolher um buddy diferente (se houver)
    const availableBuddies = users.filter(user => user.id !== currentUser.id);
    const newBuddy = availableBuddies.length > 0 ? availableBuddies[0] : null;
    
    if (!newBuddy) {
      console.log('❌ Não há outros usuários para testar buddy');
      return;
    }
    
    console.log(`\n🎯 Testando mudança de buddy para: ${newBuddy.name} (${newBuddy.id})`);
    
    // Preparar dados para atualização
    const updateData = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      position: currentUser.position,
      department: currentUser.department,
      start_date: currentUser.start_date,
      status: currentUser.status,
      gestor_id: currentUser.gestor_id, // Manter o mesmo
      buddy_id: newBuddy.id // Mudar para novo buddy
    };
    
    console.log('📤 Dados para atualização:', {
      name: updateData.name,
      gestor_id: updateData.gestor_id,
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
    
    // Verificar se realmente foi atualizado
    console.log('\n🔍 Verificando se foi realmente atualizado...');
    const verifyResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const updatedUser = verifyResponse.data;
    
    console.log('👤 Usuário após atualização:', {
      id: updatedUser.id,
      name: updatedUser.name,
      gestor_id: updatedUser.gestor_id,
      buddy_id: updatedUser.buddy_id
    });
    
    // Verificar se o buddy foi realmente alterado
    if (updatedUser.buddy_id === newBuddy.id) {
      console.log('✅ SUCESSO: Buddy foi atualizado corretamente!');
    } else {
      console.log('❌ FALHA: Buddy não foi atualizado!');
      console.log(`   Esperado: ${newBuddy.id}`);
      console.log(`   Atual: ${updatedUser.buddy_id}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testVercelUserUpdate();
