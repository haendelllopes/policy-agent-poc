const axios = require('axios');

async function testDatabaseConstraints() {
  console.log('🧪 Testando constraints específicas do banco de dados...\n');
  
  try {
    const baseUrl = 'https://navigator-gules.vercel.app';
    const userId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    
    // TESTE 1: Verificar se o problema é específico do usuário
    console.log('🧪 TESTE 1: Verificando se o problema é específico do usuário...');
    
    // Buscar todos os usuários
    const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
    const users = usersResponse.data;
    
    console.log(`📊 Total de usuários: ${users.length}`);
    
    // Testar com diferentes usuários
    for (let i = 0; i < Math.min(3, users.length); i++) {
      const testUser = users[i];
      console.log(`\n🎯 Testando com usuário ${i + 1}: ${testUser.name} (${testUser.id})`);
      
      // Tentar alterar o buddy_id para um valor diferente
      const otherUser = users.find(u => u.id !== testUser.id);
      if (otherUser) {
        const testData = {
          name: testUser.name,
          email: testUser.email,
          phone: testUser.phone,
          position: testUser.position,
          department: testUser.department,
          start_date: testUser.start_date,
          status: testUser.status,
          gestor_id: testUser.gestor_id,
          buddy_id: otherUser.id
        };
        
        try {
          const updateResponse = await axios.put(
            `${baseUrl}/api/users/${testUser.id}?tenant=demo`,
            testData,
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Verificar se funcionou
          const verifyResponse = await axios.get(`${baseUrl}/api/users/${testUser.id}?tenant=demo`);
          const verifyUser = verifyResponse.data;
          
          const success = verifyUser.buddy_id === otherUser.id;
          console.log(success ? '✅ SUCESSO: Buddy_id foi atualizado!' : '❌ FALHA: Buddy_id não foi atualizado!');
          
          if (!success) {
            console.log(`   Esperado: ${otherUser.id}`);
            console.log(`   Atual: ${verifyUser.buddy_id}`);
          }
          
        } catch (error) {
          console.log('❌ ERRO na atualização:', error.response?.data || error.message);
        }
      }
    }
    
    // TESTE 2: Verificar se o problema é específico do campo buddy_id
    console.log('\n🧪 TESTE 2: Verificando se o problema é específico do campo buddy_id...');
    
    const testUser = users[0];
    const otherUser = users.find(u => u.id !== testUser.id);
    
    if (otherUser) {
      console.log(`🎯 Testando com usuário: ${testUser.name} (${testUser.id})`);
      
      // Tentar alterar apenas gestor_id
      const gestorData = {
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        position: testUser.position,
        department: testUser.department,
        start_date: testUser.start_date,
        status: testUser.status,
        gestor_id: otherUser.id,
        buddy_id: testUser.buddy_id // Manter o mesmo
      };
      
      try {
        const gestorResponse = await axios.put(
          `${baseUrl}/api/users/${testUser.id}?tenant=demo`,
          gestorData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Verificar se funcionou
        const verifyGestorResponse = await axios.get(`${baseUrl}/api/users/${testUser.id}?tenant=demo`);
        const verifyGestorUser = verifyGestorResponse.data;
        
        const gestorSuccess = verifyGestorUser.gestor_id === otherUser.id;
        console.log(gestorSuccess ? '✅ SUCESSO: Gestor_id foi atualizado!' : '❌ FALHA: Gestor_id não foi atualizado!');
        
        // Agora tentar alterar apenas buddy_id
        const buddyData = {
          name: testUser.name,
          email: testUser.email,
          phone: testUser.phone,
          position: testUser.position,
          department: testUser.department,
          start_date: testUser.start_date,
          status: testUser.status,
          gestor_id: verifyGestorUser.gestor_id, // Manter o atualizado
          buddy_id: otherUser.id // Alterar apenas buddy_id
        };
        
        const buddyResponse = await axios.put(
          `${baseUrl}/api/users/${testUser.id}?tenant=demo`,
          buddyData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Verificar se funcionou
        const verifyBuddyResponse = await axios.get(`${baseUrl}/api/users/${testUser.id}?tenant=demo`);
        const verifyBuddyUser = verifyBuddyResponse.data;
        
        const buddySuccess = verifyBuddyUser.buddy_id === otherUser.id;
        console.log(buddySuccess ? '✅ SUCESSO: Buddy_id foi atualizado!' : '❌ FALHA: Buddy_id não foi atualizado!');
        
        // RESUMO
        console.log('\n📋 RESUMO DOS TESTES:');
        console.log(`Gestor_id: ${gestorSuccess ? '✅' : '❌'}`);
        console.log(`Buddy_id: ${buddySuccess ? '✅' : '❌'}`);
        
        if (gestorSuccess && !buddySuccess) {
          console.log('\n🚨 PROBLEMA ESPECÍFICO: Apenas buddy_id não funciona');
          console.log('💡 Possível causa: Constraint específica no campo buddy_id');
        } else if (!gestorSuccess && !buddySuccess) {
          console.log('\n🚨 PROBLEMA GERAL: Nem gestor_id nem buddy_id funcionam');
          console.log('💡 Possível causa: Problema geral com constraints ou triggers');
        } else if (gestorSuccess && buddySuccess) {
          console.log('\n✅ AMBOS FUNCIONAM: Problema resolvido!');
        }
        
      } catch (error) {
        console.log('❌ ERRO nos testes:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDatabaseConstraints();
