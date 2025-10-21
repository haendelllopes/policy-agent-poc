const axios = require('axios');

async function testDirectSQLQuery() {
  console.log('🧪 Testando query SQL direta...\n');
  
  try {
    const baseUrl = 'https://navigator-gules.vercel.app';
    const userId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    const newBuddyId = '97625a2b-ab7b-4f6f-bd52-be3aed47647d'; // Livia
    
    // Primeiro, verificar dados atuais
    console.log('📥 Verificando dados atuais...');
    const currentResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const currentUser = currentResponse.data;
    
    console.log('👤 Usuário atual:', {
      id: currentUser.id,
      name: currentUser.name,
      gestor_id: currentUser.gestor_id,
      buddy_id: currentUser.buddy_id
    });
    
    // Testar se o novo buddy existe
    console.log('\n🔍 Verificando se novo buddy existe...');
    const buddyResponse = await axios.get(`${baseUrl}/api/users/${newBuddyId}?tenant=demo`);
    const buddyUser = buddyResponse.data;
    
    console.log('👤 Buddy encontrado:', {
      id: buddyUser.id,
      name: buddyUser.name,
      status: buddyUser.status
    });
    
    if (!buddyUser) {
      console.log('❌ Buddy não encontrado!');
      return;
    }
    
    // Testar uma atualização mais simples - apenas o nome primeiro
    console.log('\n🧪 Testando atualização simples (apenas nome)...');
    const simpleUpdateData = {
      name: currentUser.name + ' (TESTE)',
      email: currentUser.email,
      phone: currentUser.phone,
      position: currentUser.position,
      department: currentUser.department,
      start_date: currentUser.start_date,
      status: currentUser.status,
      gestor_id: currentUser.gestor_id,
      buddy_id: currentUser.buddy_id // Manter o mesmo
    };
    
    const simpleUpdateResponse = await axios.put(
      `${baseUrl}/api/users/${userId}?tenant=demo`,
      simpleUpdateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Resposta da atualização simples:', simpleUpdateResponse.data);
    
    // Verificar se o nome foi atualizado
    const verifySimpleResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const verifySimpleUser = verifySimpleResponse.data;
    
    console.log('👤 Usuário após atualização simples:', {
      id: verifySimpleUser.id,
      name: verifySimpleUser.name,
      gestor_id: verifySimpleUser.gestor_id,
      buddy_id: verifySimpleUser.buddy_id
    });
    
    if (verifySimpleUser.name.includes('TESTE')) {
      console.log('✅ SUCESSO: Nome foi atualizado!');
      
      // Agora testar apenas o buddy_id
      console.log('\n🧪 Testando atualização apenas do buddy_id...');
      const buddyUpdateData = {
        name: currentUser.name, // Voltar nome original
        email: currentUser.email,
        phone: currentUser.phone,
        position: currentUser.position,
        department: currentUser.department,
        start_date: currentUser.start_date,
        status: currentUser.status,
        gestor_id: currentUser.gestor_id,
        buddy_id: newBuddyId // Mudar apenas o buddy
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
      
      if (verifyBuddyUser.buddy_id === newBuddyId) {
        console.log('✅ SUCESSO: Buddy foi atualizado!');
      } else {
        console.log('❌ FALHA: Buddy não foi atualizado!');
        console.log(`   Esperado: ${newBuddyId}`);
        console.log(`   Atual: ${verifyBuddyUser.buddy_id}`);
        
        // Testar com null
        console.log('\n🧪 Testando com buddy_id = null...');
        const nullUpdateData = {
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          position: currentUser.position,
          department: currentUser.department,
          start_date: currentUser.start_date,
          status: currentUser.status,
          gestor_id: currentUser.gestor_id,
          buddy_id: null // Tentar null
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
      }
      
    } else {
      console.log('❌ FALHA: Nome não foi atualizado!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDirectSQLQuery();
