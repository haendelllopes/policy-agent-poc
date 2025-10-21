const axios = require('axios');

async function testRLSPolicies() {
  console.log('🧪 Testando se o problema é causado por políticas de RLS...\n');
  
  try {
    const baseUrl = 'https://navigator-gules.vercel.app';
    const userId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    
    // TESTE 1: Verificar se conseguimos fazer UPDATE em outros campos
    console.log('🧪 TESTE 1: Verificando se conseguimos fazer UPDATE em outros campos...');
    
    const currentResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const currentUser = currentResponse.data;
    
    console.log('👤 Usuário atual:', {
      id: currentUser.id,
      name: currentUser.name,
      position: currentUser.position,
      department: currentUser.department,
      gestor_id: currentUser.gestor_id,
      buddy_id: currentUser.buddy_id
    });
    
    // Tentar alterar apenas campos básicos (não gestor_id/buddy_id)
    const basicUpdateData = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      position: 'Desenvolvedor Senior', // Alterar posição
      department: 'Tecnologia', // Alterar departamento
      start_date: currentUser.start_date,
      status: currentUser.status,
      gestor_id: currentUser.gestor_id, // Manter o mesmo
      buddy_id: currentUser.buddy_id // Manter o mesmo
    };
    
    const basicUpdateResponse = await axios.put(
      `${baseUrl}/api/users/${userId}?tenant=demo`,
      basicUpdateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Resposta da atualização básica:', basicUpdateResponse.data);
    
    // Verificar se funcionou
    const verifyBasicResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
    const verifyBasicUser = verifyBasicResponse.data;
    
    console.log('👤 Usuário após atualização básica:', {
      id: verifyBasicUser.id,
      name: verifyBasicUser.name,
      position: verifyBasicUser.position,
      department: verifyBasicUser.department,
      gestor_id: verifyBasicUser.gestor_id,
      buddy_id: verifyBasicUser.buddy_id
    });
    
    const basicSuccess = verifyBasicUser.position === 'Desenvolvedor Senior' && 
                        verifyBasicUser.department === 'Tecnologia';
    console.log(basicSuccess ? '✅ SUCESSO: Campos básicos foram atualizados!' : '❌ FALHA: Campos básicos não foram atualizados!');
    
    // TESTE 2: Tentar alterar apenas gestor_id
    console.log('\n🧪 TESTE 2: Tentando alterar apenas gestor_id...');
    
    const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
    const users = usersResponse.data;
    const otherUser = users.find(u => u.id !== userId && u.status === 'active');
    
    if (otherUser) {
      const gestorUpdateData = {
        name: verifyBasicUser.name,
        email: verifyBasicUser.email,
        phone: verifyBasicUser.phone,
        position: verifyBasicUser.position,
        department: verifyBasicUser.department,
        start_date: verifyBasicUser.start_date,
        status: verifyBasicUser.status,
        gestor_id: otherUser.id, // Alterar gestor_id
        buddy_id: verifyBasicUser.buddy_id // Manter buddy_id
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
      
      // Verificar se funcionou
      const verifyGestorResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyGestorUser = verifyGestorResponse.data;
      
      console.log('👤 Usuário após atualização do gestor:', {
        id: verifyGestorUser.id,
        name: verifyGestorUser.name,
        gestor_id: verifyGestorUser.gestor_id,
        buddy_id: verifyGestorUser.buddy_id
      });
      
      const gestorSuccess = verifyGestorUser.gestor_id === otherUser.id;
      console.log(gestorSuccess ? '✅ SUCESSO: Gestor_id foi atualizado!' : '❌ FALHA: Gestor_id não foi atualizado!');
      
      // TESTE 3: Tentar alterar apenas buddy_id
      console.log('\n🧪 TESTE 3: Tentando alterar apenas buddy_id...');
      
      const buddyUpdateData = {
        name: verifyGestorUser.name,
        email: verifyGestorUser.email,
        phone: verifyGestorUser.phone,
        position: verifyGestorUser.position,
        department: verifyGestorUser.department,
        start_date: verifyGestorUser.start_date,
        status: verifyGestorUser.status,
        gestor_id: verifyGestorUser.gestor_id, // Manter gestor_id
        buddy_id: otherUser.id // Alterar buddy_id
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
      
      // Verificar se funcionou
      const verifyBuddyResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyBuddyUser = verifyBuddyResponse.data;
      
      console.log('👤 Usuário após atualização do buddy:', {
        id: verifyBuddyUser.id,
        name: verifyBuddyUser.name,
        gestor_id: verifyBuddyUser.gestor_id,
        buddy_id: verifyBuddyUser.buddy_id
      });
      
      const buddySuccess = verifyBuddyUser.buddy_id === otherUser.id;
      console.log(buddySuccess ? '✅ SUCESSO: Buddy_id foi atualizado!' : '❌ FALHA: Buddy_id não foi atualizado!');
      
      // RESUMO FINAL
      console.log('\n📋 RESUMO FINAL DOS TESTES:');
      console.log(`Campos básicos (position, department): ${basicSuccess ? '✅' : '❌'}`);
      console.log(`Gestor_id: ${gestorSuccess ? '✅' : '❌'}`);
      console.log(`Buddy_id: ${buddySuccess ? '✅' : '❌'}`);
      
      // ANÁLISE
      console.log('\n🔍 ANÁLISE:');
      if (basicSuccess && gestorSuccess && buddySuccess) {
        console.log('✅ TODOS OS TESTES PASSARAM: Problema resolvido!');
      } else if (basicSuccess && !gestorSuccess && !buddySuccess) {
        console.log('🚨 PROBLEMA ESPECÍFICO: Apenas campos de referência (gestor_id, buddy_id) não funcionam');
        console.log('💡 Causa provável: Política de RLS específica para campos de referência');
      } else if (!basicSuccess && !gestorSuccess && !buddySuccess) {
        console.log('🚨 PROBLEMA GERAL: Nenhum UPDATE funciona');
        console.log('💡 Causa provável: Política de RLS geral impede UPDATE');
      } else {
        console.log('🚨 PROBLEMA PARCIAL: Alguns campos funcionam, outros não');
        console.log('💡 Causa provável: Política de RLS com condições específicas');
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

testRLSPolicies();
