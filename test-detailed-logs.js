const axios = require('axios');

async function testWithDetailedLogs() {
  console.log('🔍 TESTANDO COM LOGS DETALHADOS...\n');
  
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
    
    // Buscar outro usuário
    const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
    const users = usersResponse.data;
    const otherUser = users.find(u => u.id !== userId && u.status === 'active');
    
    if (otherUser) {
      console.log(`🎯 Usando usuário como buddy: ${otherUser.name} (${otherUser.id})`);
      
      // TESTE 1: Tentar alterar buddy_id para outro usuário
      console.log('\n🧪 TESTE 1: Alterando buddy_id para outro usuário...');
      
      const buddyUpdateData = {
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
      
      console.log('📤 Dados enviados:', {
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
      
      console.log('📥 Resposta da API:', buddyUpdateResponse.data);
      
      // Verificar imediatamente após o UPDATE
      const verifyResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyUser = verifyResponse.data;
      
      console.log('👤 Usuário após UPDATE:', {
        id: verifyUser.id,
        name: verifyUser.name,
        gestor_id: verifyUser.gestor_id,
        buddy_id: verifyUser.buddy_id
      });
      
      const success = verifyUser.buddy_id === otherUser.id;
      console.log(success ? '✅ SUCESSO: Buddy_id foi atualizado!' : '❌ FALHA: Buddy_id não foi atualizado!');
      
      if (!success) {
        console.log(`   Esperado: ${otherUser.id}`);
        console.log(`   Atual: ${verifyUser.buddy_id}`);
        console.log(`   Diferença: ${verifyUser.buddy_id !== otherUser.id ? 'SIM' : 'NÃO'}`);
      }
      
      // TESTE 2: Tentar alterar buddy_id para null
      console.log('\n🧪 TESTE 2: Alterando buddy_id para null...');
      
      const nullUpdateData = {
        name: verifyUser.name,
        email: verifyUser.email,
        phone: verifyUser.phone,
        position: verifyUser.position,
        department: verifyUser.department,
        start_date: verifyUser.start_date,
        status: verifyUser.status,
        gestor_id: verifyUser.gestor_id,
        buddy_id: null
      };
      
      console.log('📤 Dados enviados (null):', {
        name: nullUpdateData.name,
        buddy_id: nullUpdateData.buddy_id
      });
      
      const nullUpdateResponse = await axios.put(
        `${baseUrl}/api/users/${userId}?tenant=demo`,
        nullUpdateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📥 Resposta da API (null):', nullUpdateResponse.data);
      
      // Verificar imediatamente após o UPDATE
      const verifyNullResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyNullUser = verifyNullResponse.data;
      
      console.log('👤 Usuário após UPDATE (null):', {
        id: verifyNullUser.id,
        name: verifyNullUser.name,
        gestor_id: verifyNullUser.gestor_id,
        buddy_id: verifyNullUser.buddy_id
      });
      
      const nullSuccess = verifyNullUser.buddy_id === null;
      console.log(nullSuccess ? '✅ SUCESSO: Buddy_id foi alterado para null!' : '❌ FALHA: Buddy_id não foi alterado para null!');
      
      if (!nullSuccess) {
        console.log(`   Esperado: null`);
        console.log(`   Atual: ${verifyNullUser.buddy_id}`);
        console.log(`   Diferença: ${verifyNullUser.buddy_id !== null ? 'SIM' : 'NÃO'}`);
      }
      
      // TESTE 3: Tentar alterar buddy_id para o valor atual (deve funcionar)
      console.log('\n🧪 TESTE 3: Alterando buddy_id para o valor atual...');
      
      const sameUpdateData = {
        name: verifyNullUser.name,
        email: verifyNullUser.email,
        phone: verifyNullUser.phone,
        position: verifyNullUser.position,
        department: verifyNullUser.department,
        start_date: verifyNullUser.start_date,
        status: verifyNullUser.status,
        gestor_id: verifyNullUser.gestor_id,
        buddy_id: verifyNullUser.buddy_id // Mesmo valor atual
      };
      
      console.log('📤 Dados enviados (mesmo valor):', {
        name: sameUpdateData.name,
        buddy_id: sameUpdateData.buddy_id
      });
      
      const sameUpdateResponse = await axios.put(
        `${baseUrl}/api/users/${userId}?tenant=demo`,
        sameUpdateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📥 Resposta da API (mesmo valor):', sameUpdateResponse.data);
      
      // Verificar imediatamente após o UPDATE
      const verifySameResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifySameUser = verifySameResponse.data;
      
      console.log('👤 Usuário após UPDATE (mesmo valor):', {
        id: verifySameUser.id,
        name: verifySameUser.name,
        gestor_id: verifySameUser.gestor_id,
        buddy_id: verifySameUser.buddy_id
      });
      
      const sameSuccess = verifySameUser.buddy_id === sameUpdateData.buddy_id;
      console.log(sameSuccess ? '✅ SUCESSO: Buddy_id foi mantido!' : '❌ FALHA: Buddy_id foi alterado!');
      
      // RESUMO FINAL
      console.log('\n📋 RESUMO FINAL DOS TESTES:');
      console.log(`Buddy_id para outro usuário: ${success ? '✅' : '❌'}`);
      console.log(`Buddy_id para null: ${nullSuccess ? '✅' : '❌'}`);
      console.log(`Buddy_id para mesmo valor: ${sameSuccess ? '✅' : '❌'}`);
      
      // ANÁLISE
      console.log('\n🔍 ANÁLISE:');
      if (success && nullSuccess && sameSuccess) {
        console.log('🎉 TODOS OS TESTES PASSARAM: Problema resolvido!');
      } else if (!success && !nullSuccess && sameSuccess) {
        console.log('🚨 PROBLEMA ESPECÍFICO: Buddy_id só funciona com o valor atual');
        console.log('💡 Possível causa: Constraint que impede alteração para valores diferentes');
      } else if (!success && !nullSuccess && !sameSuccess) {
        console.log('🚨 PROBLEMA GERAL: Nenhuma alteração de buddy_id funciona');
        console.log('💡 Possível causa: Constraint geral ou política de RLS');
      } else {
        console.log('🚨 PROBLEMA PARCIAL: Algumas alterações funcionam, outras não');
        console.log('💡 Possível causa: Constraint com condições específicas');
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

testWithDetailedLogs();
