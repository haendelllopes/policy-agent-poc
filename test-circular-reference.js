const axios = require('axios');

async function testCircularReference() {
  console.log('🧪 Testando constraint de referência circular...\n');
  
  try {
    const baseUrl = 'https://navigator-gules.vercel.app';
    const userId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    
    // Buscar dados atuais
    const currentResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const currentUser = currentResponse.data;
    
    console.log('👤 Usuário atual:', {
      id: currentUser.id,
      name: currentUser.name,
      gestor_id: currentUser.gestor_id,
      buddy_id: currentUser.buddy_id
    });
    
    // TESTE 1: Tentar fazer o usuário ser buddy de si mesmo
    console.log('\n🧪 TESTE 1: Tentando fazer o usuário ser buddy de si mesmo...');
    const selfBuddyData = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      position: currentUser.position,
      department: currentUser.department,
      start_date: currentUser.start_date,
      status: currentUser.status,
      gestor_id: currentUser.gestor_id,
      buddy_id: currentUser.id // Buddy de si mesmo
    };
    
    const selfBuddyResponse = await axios.put(
      `${baseUrl}/api/users/${userId}?tenant=demo`,
      selfBuddyData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Resposta da atualização (self-buddy):', selfBuddyResponse.data);
    
    // Verificar se funcionou
    const verifySelfResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const verifySelfUser = verifySelfResponse.data;
    
    console.log('👤 Usuário após tentativa de self-buddy:', {
      id: verifySelfUser.id,
      name: verifySelfUser.name,
      gestor_id: verifySelfUser.gestor_id,
      buddy_id: verifySelfUser.buddy_id
    });
    
    const selfBuddySuccess = verifySelfUser.buddy_id === currentUser.id;
    console.log(selfBuddySuccess ? '✅ SUCESSO: Self-buddy funcionou!' : '❌ FALHA: Self-buddy não funcionou!');
    
    // TESTE 2: Tentar fazer referência circular (A é buddy de B, B é buddy de A)
    console.log('\n🧪 TESTE 2: Tentando referência circular...');
    
    // Buscar outro usuário para fazer referência circular
    const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
    const users = usersResponse.data;
    const otherUser = users.find(u => u.id !== userId && u.status === 'active');
    
    if (otherUser) {
      console.log(`🎯 Usando usuário para referência circular: ${otherUser.name} (${otherUser.id})`);
      
      // Atualizar o usuário atual para ser buddy do outro usuário
      const circularData = {
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        position: currentUser.position,
        department: currentUser.department,
        start_date: currentUser.start_date,
        status: currentUser.status,
        gestor_id: currentUser.gestor_id,
        buddy_id: otherUser.id
      };
      
      const circularResponse = await axios.put(
        `${baseUrl}/api/users/${userId}?tenant=demo`,
        circularData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Resposta da atualização (circular):', circularResponse.data);
      
      // Verificar se funcionou
      const verifyCircularResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyCircularUser = verifyCircularResponse.data;
      
      console.log('👤 Usuário após tentativa circular:', {
        id: verifyCircularUser.id,
        name: verifyCircularUser.name,
        gestor_id: verifyCircularUser.gestor_id,
        buddy_id: verifyCircularUser.buddy_id
      });
      
      const circularSuccess = verifyCircularUser.buddy_id === otherUser.id;
      console.log(circularSuccess ? '✅ SUCESSO: Referência circular funcionou!' : '❌ FALHA: Referência circular não funcionou!');
      
      // TESTE 3: Tentar fazer o outro usuário ser buddy do usuário atual
      console.log('\n🧪 TESTE 3: Tentando fazer o outro usuário ser buddy do usuário atual...');
      
      const reverseCircularData = {
        name: otherUser.name,
        email: otherUser.email,
        phone: otherUser.phone,
        position: otherUser.position,
        department: otherUser.department,
        start_date: otherUser.start_date,
        status: otherUser.status,
        gestor_id: otherUser.gestor_id,
        buddy_id: userId // Buddy do usuário atual
      };
      
      const reverseCircularResponse = await axios.put(
        `${baseUrl}/api/users/${otherUser.id}?tenant=demo`,
        reverseCircularData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Resposta da atualização (reverse circular):', reverseCircularResponse.data);
      
      // Verificar se funcionou
      const verifyReverseResponse = await axios.get(`${baseUrl}/api/users/${otherUser.id}?tenant=demo`);
      const verifyReverseUser = verifyReverseResponse.data;
      
      console.log('👤 Outro usuário após tentativa reverse circular:', {
        id: verifyReverseUser.id,
        name: verifyReverseUser.name,
        gestor_id: verifyReverseUser.gestor_id,
        buddy_id: verifyReverseUser.buddy_id
      });
      
      const reverseCircularSuccess = verifyReverseUser.buddy_id === userId;
      console.log(reverseCircularSuccess ? '✅ SUCESSO: Reverse circular funcionou!' : '❌ FALHA: Reverse circular não funcionou!');
      
      // RESUMO DOS TESTES
      console.log('\n📋 RESUMO DOS TESTES:');
      console.log(`Self-buddy: ${selfBuddySuccess ? '✅' : '❌'}`);
      console.log(`Referência circular: ${circularSuccess ? '✅' : '❌'}`);
      console.log(`Reverse circular: ${reverseCircularSuccess ? '✅' : '❌'}`);
      
      // ANÁLISE
      console.log('\n🔍 ANÁLISE:');
      if (!selfBuddySuccess && !circularSuccess && !reverseCircularSuccess) {
        console.log('🚨 PROBLEMA: Nenhuma alteração de buddy_id funciona');
        console.log('💡 Possível causa: Constraint específica impede qualquer alteração de buddy_id');
      } else if (selfBuddySuccess && !circularSuccess && !reverseCircularSuccess) {
        console.log('🚨 PROBLEMA: Apenas self-buddy funciona');
        console.log('💡 Possível causa: Constraint impede referências para outros usuários');
      } else if (!selfBuddySuccess && circularSuccess && !reverseCircularSuccess) {
        console.log('🚨 PROBLEMA: Apenas referência circular funciona');
        console.log('💡 Possível causa: Constraint específica para self-reference');
      } else {
        console.log('✅ ALGUMAS ALTERAÇÕES FUNCIONAM: Problema mais específico');
      }
      
    } else {
      console.log('❌ Não foi possível encontrar outro usuário para teste');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCircularReference();
