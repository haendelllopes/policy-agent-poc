const axios = require('axios');

async function testAfterNewPolicy() {
  console.log('🧪 Testando após criar nova política específica para buddy_id...\n');
  
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
    
    // Buscar outro usuário para usar como buddy
    const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
    const users = usersResponse.data;
    const otherUser = users.find(u => u.id !== userId && u.status === 'active');
    
    if (otherUser) {
      console.log(`🎯 Usando usuário como buddy: ${otherUser.name} (${otherUser.id})`);
      
      // Tentar alterar apenas buddy_id
      const buddyUpdateData = {
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        position: currentUser.position,
        department: currentUser.department,
        start_date: currentUser.start_date,
        status: currentUser.status,
        gestor_id: currentUser.gestor_id, // Manter o mesmo
        buddy_id: otherUser.id // Alterar buddy_id
      };
      
      console.log('📤 Dados para atualização:', {
        name: buddyUpdateData.name,
        buddy_id: buddyUpdateData.buddy_id,
        buddy_name: otherUser.name
      });
      
      const buddyUpdateResponse = await axios.put(
        `${baseUrl}/api/users/${userId}?tenant=demo`,
        buddyUpdateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Resposta da atualização:', buddyUpdateResponse.data);
      
      // Verificar se funcionou
      const verifyResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyUser = verifyResponse.data;
      
      console.log('👤 Usuário após atualização:', {
        id: verifyUser.id,
        name: verifyUser.name,
        gestor_id: verifyUser.gestor_id,
        buddy_id: verifyUser.buddy_id
      });
      
      const success = verifyUser.buddy_id === otherUser.id;
      
      if (success) {
        console.log('🎉 SUCESSO: Buddy_id foi atualizado!');
        console.log('✅ A nova política funcionou!');
      } else {
        console.log('❌ FALHA: Buddy_id ainda não foi atualizado');
        console.log('🔍 Possíveis causas:');
        console.log('   - Política não foi criada corretamente');
        console.log('   - Há outra política conflitante');
        console.log('   - Problema mais profundo no banco de dados');
      }
      
      // Teste adicional: tentar alterar para null
      console.log('\n🧪 TESTE ADICIONAL: Tentando alterar buddy_id para null...');
      
      const nullUpdateData = {
        name: verifyUser.name,
        email: verifyUser.email,
        phone: verifyUser.phone,
        position: verifyUser.position,
        department: verifyUser.department,
        start_date: verifyUser.start_date,
        status: verifyUser.status,
        gestor_id: verifyUser.gestor_id,
        buddy_id: null // Alterar para null
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
      
      console.log('✅ Resposta da atualização (null):', nullUpdateResponse.data);
      
      // Verificar se funcionou
      const verifyNullResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyNullUser = verifyNullResponse.data;
      
      console.log('👤 Usuário após atualização (null):', {
        id: verifyNullUser.id,
        name: verifyNullUser.name,
        gestor_id: verifyNullUser.gestor_id,
        buddy_id: verifyNullUser.buddy_id
      });
      
      const nullSuccess = verifyNullUser.buddy_id === null;
      console.log(nullSuccess ? '✅ SUCESSO: Buddy_id foi alterado para null!' : '❌ FALHA: Buddy_id não foi alterado para null');
      
      // RESUMO FINAL
      console.log('\n📋 RESUMO FINAL:');
      console.log(`Buddy_id para outro usuário: ${success ? '✅' : '❌'}`);
      console.log(`Buddy_id para null: ${nullSuccess ? '✅' : '❌'}`);
      
      if (success && nullSuccess) {
        console.log('\n🎉 PROBLEMA RESOLVIDO! A política funcionou perfeitamente!');
      } else if (success || nullSuccess) {
        console.log('\n⚠️ PARCIALMENTE RESOLVIDO: Algumas alterações funcionam');
      } else {
        console.log('\n❌ PROBLEMA PERSISTE: A política não resolveu o problema');
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

testAfterNewPolicy();
