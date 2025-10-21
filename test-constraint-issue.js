const axios = require('axios');

async function testConstraintIssue() {
  console.log('🧪 Testando problema de constraint...\n');
  
  try {
    const baseUrl = 'https://navigator-gules.vercel.app';
    const userId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    
    // Buscar todos os usuários
    console.log('📋 Buscando todos os usuários...');
    const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
    const users = usersResponse.data;
    
    console.log('👥 Usuários disponíveis:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.id}) - Status: ${user.status}`);
    });
    
    // Testar com um usuário que não é o próprio usuário
    const targetUser = users.find(u => u.id === userId);
    const otherUsers = users.filter(u => u.id !== userId && u.status === 'active');
    
    if (otherUsers.length === 0) {
      console.log('❌ Não há outros usuários para testar!');
      return;
    }
    
    const testBuddy = otherUsers[0];
    console.log(`\n🎯 Testando com buddy: ${testBuddy.name} (${testBuddy.id})`);
    
    // Testar se há algum problema específico com a constraint
    // Vamos tentar uma abordagem diferente: atualizar apenas um campo por vez
    
    console.log('\n🧪 Teste 1: Atualizando apenas gestor_id...');
    const gestorUpdateData = {
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      position: targetUser.position,
      department: targetUser.department,
      start_date: targetUser.start_date,
      status: targetUser.status,
      gestor_id: testBuddy.id, // Mudar gestor
      buddy_id: targetUser.buddy_id // Manter buddy atual
    };
    
    const gestorUpdateResponse = await axios.put(
      `${baseUrl}/api/users/${userId}?tenant=demo`,
      gestorUpdateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Resposta da atualização do gestor:', gestorUpdateResponse.data);
    
    // Verificar se o gestor foi atualizado
    const verifyGestorResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const verifyGestorUser = verifyGestorResponse.data;
    
    console.log('👤 Usuário após atualização do gestor:', {
      id: verifyGestorUser.id,
      name: verifyGestorUser.name,
      gestor_id: verifyGestorUser.gestor_id,
      buddy_id: verifyGestorUser.buddy_id
    });
    
    if (verifyGestorUser.gestor_id === testBuddy.id) {
      console.log('✅ SUCESSO: Gestor foi atualizado!');
      
      // Agora testar buddy
      console.log('\n🧪 Teste 2: Atualizando apenas buddy_id...');
      const buddyUpdateData = {
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        position: targetUser.position,
        department: targetUser.department,
        start_date: targetUser.start_date,
        status: targetUser.status,
        gestor_id: verifyGestorUser.gestor_id, // Manter gestor atualizado
        buddy_id: testBuddy.id // Mudar buddy
      };
      
      const buddyUpdateResponse = await axios.put(
        `${baseUrl}/api/users/${userId}?tenant=demo`,
        buddyUpdateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Resposta da atualização do buddy:', buddyUpdateResponse.data);
      
      // Verificar se o buddy foi atualizado
      const verifyBuddyResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyBuddyUser = verifyBuddyResponse.data;
      
      console.log('👤 Usuário após atualização do buddy:', {
        id: verifyBuddyUser.id,
        name: verifyBuddyUser.name,
        gestor_id: verifyBuddyUser.gestor_id,
        buddy_id: verifyBuddyUser.buddy_id
      });
      
      if (verifyBuddyUser.buddy_id === testBuddy.id) {
        console.log('✅ SUCESSO: Buddy foi atualizado!');
      } else {
        console.log('❌ FALHA: Buddy não foi atualizado!');
        console.log(`   Esperado: ${testBuddy.id}`);
        console.log(`   Atual: ${verifyBuddyUser.buddy_id}`);
      }
      
    } else {
      console.log('❌ FALHA: Gestor não foi atualizado!');
      console.log(`   Esperado: ${testBuddy.id}`);
      console.log(`   Atual: ${verifyGestorUser.gestor_id}`);
      
      // Testar com null
      console.log('\n🧪 Teste 3: Tentando atualizar gestor_id para null...');
      const nullGestorUpdateData = {
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        position: targetUser.position,
        department: targetUser.department,
        start_date: targetUser.start_date,
        status: targetUser.status,
        gestor_id: null, // Tentar null
        buddy_id: targetUser.buddy_id
      };
      
      const nullGestorUpdateResponse = await axios.put(
        `${baseUrl}/api/users/${userId}?tenant=demo`,
        nullGestorUpdateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Resposta da atualização com gestor null:', nullGestorUpdateResponse.data);
      
      // Verificar se foi atualizado para null
      const verifyNullGestorResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyNullGestorUser = verifyNullGestorResponse.data;
      
      console.log('👤 Usuário após atualização com gestor null:', {
        id: verifyNullGestorUser.id,
        name: verifyNullGestorUser.name,
        gestor_id: verifyNullGestorUser.gestor_id,
        buddy_id: verifyNullGestorUser.buddy_id
      });
      
      if (verifyNullGestorUser.gestor_id === null) {
        console.log('✅ SUCESSO: Gestor foi atualizado para null!');
      } else {
        console.log('❌ FALHA: Gestor não foi atualizado para null!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testConstraintIssue();
