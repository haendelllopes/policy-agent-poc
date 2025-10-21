const axios = require('axios');

async function testGestorVsBuddy() {
  console.log('🧪 Testando diferença entre gestor_id e buddy_id...\n');
  
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
    const otherUsers = users.filter(u => u.id !== userId && u.status === 'active');
    
    if (otherUsers.length === 0) {
      console.log('❌ Não há outros usuários para testar!');
      return;
    }
    
    const testUser = otherUsers[0];
    console.log(`\n🎯 Usando usuário de teste: ${testUser.name} (${testUser.id})`);
    
    // TESTE 1: Atualizar apenas gestor_id
    console.log('\n🧪 TESTE 1: Atualizando apenas gestor_id...');
    const gestorUpdateData = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      position: currentUser.position,
      department: currentUser.department,
      start_date: currentUser.start_date,
      status: currentUser.status,
      gestor_id: testUser.id, // Mudar gestor
      buddy_id: currentUser.buddy_id // Manter buddy atual
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
    
    const gestorSuccess = verifyGestorUser.gestor_id === testUser.id;
    console.log(gestorSuccess ? '✅ SUCESSO: Gestor foi atualizado!' : '❌ FALHA: Gestor não foi atualizado!');
    
    // TESTE 2: Atualizar apenas buddy_id
    console.log('\n🧪 TESTE 2: Atualizando apenas buddy_id...');
    const buddyUpdateData = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      position: currentUser.position,
      department: currentUser.department,
      start_date: currentUser.start_date,
      status: currentUser.status,
      gestor_id: verifyGestorUser.gestor_id, // Manter gestor atualizado
      buddy_id: testUser.id // Mudar buddy
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
    
    const buddySuccess = verifyBuddyUser.buddy_id === testUser.id;
    console.log(buddySuccess ? '✅ SUCESSO: Buddy foi atualizado!' : '❌ FALHA: Buddy não foi atualizado!');
    
    // TESTE 3: Atualizar ambos ao mesmo tempo
    console.log('\n🧪 TESTE 3: Atualizando ambos ao mesmo tempo...');
    const bothUpdateData = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      position: currentUser.position,
      department: currentUser.department,
      start_date: currentUser.start_date,
      status: currentUser.status,
      gestor_id: testUser.id, // Mudar gestor
      buddy_id: testUser.id // Mudar buddy
    };
    
    const bothUpdateResponse = await axios.put(
      `${baseUrl}/api/users/${userId}?tenant=demo`,
      bothUpdateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Resposta da atualização de ambos:', bothUpdateResponse.data);
    
    // Verificar se ambos foram atualizados
    const verifyBothResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const verifyBothUser = verifyBothResponse.data;
    
    console.log('👤 Usuário após atualização de ambos:', {
      id: verifyBothUser.id,
      name: verifyBothUser.name,
      gestor_id: verifyBothUser.gestor_id,
      buddy_id: verifyBothUser.buddy_id
    });
    
    const bothGestorSuccess = verifyBothUser.gestor_id === testUser.id;
    const bothBuddySuccess = verifyBothUser.buddy_id === testUser.id;
    
    console.log(bothGestorSuccess ? '✅ SUCESSO: Gestor foi atualizado!' : '❌ FALHA: Gestor não foi atualizado!');
    console.log(bothBuddySuccess ? '✅ SUCESSO: Buddy foi atualizado!' : '❌ FALHA: Buddy não foi atualizado!');
    
    // RESUMO DOS TESTES
    console.log('\n📋 RESUMO DOS TESTES:');
    console.log(`Gestor (teste individual): ${gestorSuccess ? '✅' : '❌'}`);
    console.log(`Buddy (teste individual): ${buddySuccess ? '✅' : '❌'}`);
    console.log(`Gestor (teste conjunto): ${bothGestorSuccess ? '✅' : '❌'}`);
    console.log(`Buddy (teste conjunto): ${bothBuddySuccess ? '✅' : '❌'}`);
    
    // ANÁLISE
    console.log('\n🔍 ANÁLISE:');
    if (gestorSuccess && !buddySuccess) {
      console.log('🚨 PROBLEMA ESPECÍFICO: gestor_id funciona, buddy_id não funciona');
      console.log('💡 Possível causa: Problema específico com constraint ou trigger do buddy_id');
    } else if (!gestorSuccess && buddySuccess) {
      console.log('🚨 PROBLEMA ESPECÍFICO: buddy_id funciona, gestor_id não funciona');
      console.log('💡 Possível causa: Problema específico com constraint ou trigger do gestor_id');
    } else if (gestorSuccess && buddySuccess) {
      console.log('✅ AMBOS FUNCIONAM: Não há problema específico');
    } else {
      console.log('🚨 PROBLEMA GERAL: Nem gestor_id nem buddy_id funcionam');
      console.log('💡 Possível causa: Problema geral com constraints ou triggers');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGestorVsBuddy();
