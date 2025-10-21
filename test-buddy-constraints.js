const axios = require('axios');

async function testBuddyConstraints() {
  console.log('🧪 Testando constraints de buddy...\n');
  
  try {
    const baseUrl = 'https://navigator-gules.vercel.app';
    
    // Buscar todos os usuários para verificar IDs válidos
    console.log('📋 Buscando todos os usuários...');
    const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
    const users = usersResponse.data;
    
    console.log('👥 Usuários disponíveis:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.id}) - Status: ${user.status}`);
    });
    
    // Verificar se os IDs que estamos usando realmente existem
    const targetUserId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    const newBuddyId = '97625a2b-ab7b-4f6f-bd52-be3aed47647d';
    
    const targetUser = users.find(u => u.id === targetUserId);
    const newBuddy = users.find(u => u.id === newBuddyId);
    
    console.log('\n🔍 Verificando usuários:');
    console.log('👤 Usuário alvo:', targetUser ? `${targetUser.name} (${targetUser.id})` : 'NÃO ENCONTRADO');
    console.log('👤 Novo buddy:', newBuddy ? `${newBuddy.name} (${newBuddy.id})` : 'NÃO ENCONTRADO');
    
    if (!targetUser) {
      console.log('❌ Usuário alvo não encontrado!');
      return;
    }
    
    if (!newBuddy) {
      console.log('❌ Novo buddy não encontrado!');
      return;
    }
    
    // Verificar se o novo buddy está ativo
    if (newBuddy.status !== 'active') {
      console.log(`⚠️ Novo buddy está com status: ${newBuddy.status}`);
    }
    
    // Testar com um buddy diferente que sabemos que existe
    const activeUsers = users.filter(u => u.status === 'active' && u.id !== targetUserId);
    const testBuddy = activeUsers[0];
    
    if (!testBuddy) {
      console.log('❌ Não há usuários ativos para testar buddy!');
      return;
    }
    
    console.log(`\n🎯 Testando com buddy: ${testBuddy.name} (${testBuddy.id})`);
    
    // Fazer o teste de atualização
    const updateData = {
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      position: targetUser.position,
      department: targetUser.department,
      start_date: targetUser.start_date,
      status: targetUser.status,
      gestor_id: targetUser.gestor_id,
      buddy_id: testBuddy.id
    };
    
    console.log('📤 Dados para atualização:', {
      name: updateData.name,
      buddy_id: updateData.buddy_id,
      buddy_name: testBuddy.name
    });
    
    // Fazer a atualização
    console.log('\n🔄 Fazendo PUT request...');
    const updateResponse = await axios.put(
      `${baseUrl}/api/users/${targetUserId}?tenant=demo`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Resposta da atualização:', updateResponse.data);
    
    // Verificar se foi atualizado
    console.log('\n🔍 Verificando se foi atualizado...');
    const verifyResponse = await axios.get(`${baseUrl}/api/users/${targetUserId}?tenant=demo`);
    const updatedUser = verifyResponse.data;
    
    console.log('👤 Usuário após atualização:', {
      id: updatedUser.id,
      name: updatedUser.name,
      buddy_id: updatedUser.buddy_id
    });
    
    // Verificar se o buddy foi realmente alterado
    if (updatedUser.buddy_id === testBuddy.id) {
      console.log('✅ SUCESSO: Buddy foi atualizado corretamente!');
    } else {
      console.log('❌ FALHA: Buddy não foi atualizado!');
      console.log(`   Esperado: ${testBuddy.id} (${testBuddy.name})`);
      console.log(`   Atual: ${updatedUser.buddy_id}`);
      
      // Tentar identificar o problema
      console.log('\n🔍 Investigando problema...');
      
      // Verificar se há algum problema com a query SQL
      console.log('📋 Verificando se há logs de erro no servidor...');
      
      // Testar com dados mais simples
      console.log('\n🧪 Testando com dados mais simples...');
      const simpleUpdateData = {
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        position: targetUser.position,
        department: targetUser.department,
        start_date: targetUser.start_date,
        status: targetUser.status,
        gestor_id: null, // Tentar null
        buddy_id: testBuddy.id
      };
      
      const simpleUpdateResponse = await axios.put(
        `${baseUrl}/api/users/${targetUserId}?tenant=demo`,
        simpleUpdateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Resposta da atualização simples:', simpleUpdateResponse.data);
      
      // Verificar novamente
      const finalVerifyResponse = await axios.get(`${baseUrl}/api/users/${targetUserId}?tenant=demo`);
      const finalUser = finalVerifyResponse.data;
      
      console.log('👤 Usuário após atualização simples:', {
        id: finalUser.id,
        name: finalUser.name,
        gestor_id: finalUser.gestor_id,
        buddy_id: finalUser.buddy_id
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testBuddyConstraints();
