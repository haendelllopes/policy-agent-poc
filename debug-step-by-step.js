const axios = require('axios');

async function debugStepByStep() {
  console.log('🔍 DEBUGANDO PASSO A PASSO...\n');
  
  try {
    const baseUrl = 'https://navigator-gules.vercel.app';
    const userId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    
    // PASSO 1: Verificar se a API está funcionando
    console.log('🧪 PASSO 1: Verificando se a API está funcionando...');
    
    try {
      const healthResponse = await axios.get(`${baseUrl}/api/debug-env`);
      console.log('✅ API está funcionando:', healthResponse.data);
    } catch (error) {
      console.log('❌ API não está funcionando:', error.message);
      return;
    }
    
    // PASSO 2: Verificar se conseguimos buscar o usuário
    console.log('\n🧪 PASSO 2: Verificando se conseguimos buscar o usuário...');
    
    try {
      const userResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      console.log('✅ Usuário encontrado:', {
        id: userResponse.data.id,
        name: userResponse.data.name,
        gestor_id: userResponse.data.gestor_id,
        buddy_id: userResponse.data.buddy_id
      });
    } catch (error) {
      console.log('❌ Erro ao buscar usuário:', error.response?.data || error.message);
      return;
    }
    
    // PASSO 3: Verificar se conseguimos fazer UPDATE em campos básicos
    console.log('\n🧪 PASSO 3: Verificando se conseguimos fazer UPDATE em campos básicos...');
    
    try {
      const basicUpdateData = {
        name: 'Usuário teste',
        email: 'haendell@hotmail.com',
        phone: '+556291708483',
        position: 'Desenvolvedor Teste',
        department: 'Desenvolvimento Teste',
        start_date: '2025-10-01T00:00:00.000Z',
        status: 'active',
        gestor_id: '4ab6c765-bcfc-4280-84cd-3190fcf881c2',
        buddy_id: 'cdcd92e6-cded-4933-9822-ed39b5953cd0'
      };
      
      console.log('📤 Dados para UPDATE básico:', basicUpdateData);
      
      const basicUpdateResponse = await axios.put(
        `${baseUrl}/api/users/${userId}?tenant=demo`,
        basicUpdateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Resposta do UPDATE básico:', basicUpdateResponse.data);
      
      // Verificar se funcionou
      const verifyBasicResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
      const verifyBasicUser = verifyBasicResponse.data;
      
      console.log('👤 Usuário após UPDATE básico:', {
        id: verifyBasicUser.id,
        name: verifyBasicUser.name,
        position: verifyBasicUser.position,
        department: verifyBasicUser.department,
        gestor_id: verifyBasicUser.gestor_id,
        buddy_id: verifyBasicUser.buddy_id
      });
      
      const basicSuccess = verifyBasicUser.position === 'Desenvolvedor Teste' && 
                          verifyBasicUser.department === 'Desenvolvimento Teste';
      console.log(basicSuccess ? '✅ SUCESSO: Campos básicos foram atualizados!' : '❌ FALHA: Campos básicos não foram atualizados!');
      
    } catch (error) {
      console.log('❌ Erro no UPDATE básico:', error.response?.data || error.message);
      if (error.response?.data) {
        console.log('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
      }
      return;
    }
    
    // PASSO 4: Verificar se conseguimos fazer UPDATE apenas do gestor_id
    console.log('\n🧪 PASSO 4: Verificando se conseguimos fazer UPDATE apenas do gestor_id...');
    
    try {
      const usersResponse = await axios.get(`${baseUrl}/api/users?tenant=demo`);
      const users = usersResponse.data;
      const otherUser = users.find(u => u.id !== userId && u.status === 'active');
      
      if (otherUser) {
        const gestorUpdateData = {
          name: 'Usuário teste',
          email: 'haendell@hotmail.com',
          phone: '+556291708483',
          position: 'Desenvolvedor Teste',
          department: 'Desenvolvimento Teste',
          start_date: '2025-10-01T00:00:00.000Z',
          status: 'active',
          gestor_id: otherUser.id, // Alterar gestor_id
          buddy_id: 'cdcd92e6-cded-4933-9822-ed39b5953cd0' // Manter buddy_id
        };
        
        console.log('📤 Dados para UPDATE do gestor:', {
          name: gestorUpdateData.name,
          gestor_id: gestorUpdateData.gestor_id,
          gestor_name: otherUser.name
        });
        
        const gestorUpdateResponse = await axios.put(
          `${baseUrl}/api/users/${userId}?tenant=demo`,
          gestorUpdateData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Resposta do UPDATE do gestor:', gestorUpdateResponse.data);
        
        // Verificar se funcionou
        const verifyGestorResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
        const verifyGestorUser = verifyGestorResponse.data;
        
        console.log('👤 Usuário após UPDATE do gestor:', {
          id: verifyGestorUser.id,
          name: verifyGestorUser.name,
          gestor_id: verifyGestorUser.gestor_id,
          buddy_id: verifyGestorUser.buddy_id
        });
        
        const gestorSuccess = verifyGestorUser.gestor_id === otherUser.id;
        console.log(gestorSuccess ? '✅ SUCESSO: Gestor_id foi atualizado!' : '❌ FALHA: Gestor_id não foi atualizado!');
        
        // PASSO 5: Verificar se conseguimos fazer UPDATE apenas do buddy_id
        console.log('\n🧪 PASSO 5: Verificando se conseguimos fazer UPDATE apenas do buddy_id...');
        
        const buddyUpdateData = {
          name: 'Usuário teste',
          email: 'haendell@hotmail.com',
          phone: '+556291708483',
          position: 'Desenvolvedor Teste',
          department: 'Desenvolvimento Teste',
          start_date: '2025-10-01T00:00:00.000Z',
          status: 'active',
          gestor_id: verifyGestorUser.gestor_id, // Manter gestor_id
          buddy_id: otherUser.id // Alterar buddy_id
        };
        
        console.log('📤 Dados para UPDATE do buddy:', {
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
        
        console.log('✅ Resposta do UPDATE do buddy:', buddyUpdateResponse.data);
        
        // Verificar se funcionou
        const verifyBuddyResponse = await axios.get(`${baseUrl}/api/users/${userId}?tenant=demo`);
        const verifyBuddyUser = verifyBuddyResponse.data;
        
        console.log('👤 Usuário após UPDATE do buddy:', {
          id: verifyBuddyUser.id,
          name: verifyBuddyUser.name,
          gestor_id: verifyBuddyUser.gestor_id,
          buddy_id: verifyBuddyUser.buddy_id
        });
        
        const buddySuccess = verifyBuddyUser.buddy_id === otherUser.id;
        console.log(buddySuccess ? '✅ SUCESSO: Buddy_id foi atualizado!' : '❌ FALHA: Buddy_id não foi atualizado!');
        
        // RESUMO FINAL
        console.log('\n📋 RESUMO FINAL DO DEBUG:');
        console.log(`API funcionando: ✅`);
        console.log(`Buscar usuário: ✅`);
        console.log(`UPDATE campos básicos: ${basicSuccess ? '✅' : '❌'}`);
        console.log(`UPDATE gestor_id: ${gestorSuccess ? '✅' : '❌'}`);
        console.log(`UPDATE buddy_id: ${buddySuccess ? '✅' : '❌'}`);
        
        if (!buddySuccess) {
          console.log('\n🚨 PROBLEMA CONFIRMADO: Buddy_id não funciona');
          console.log('💡 Próximos passos:');
          console.log('   1. Verificar logs do Vercel');
          console.log('   2. Verificar políticas de RLS');
          console.log('   3. Verificar constraints do banco de dados');
        }
        
      } else {
        console.log('❌ Não foi possível encontrar outro usuário para teste');
      }
      
    } catch (error) {
      console.log('❌ Erro no UPDATE do gestor/buddy:', error.response?.data || error.message);
      if (error.response?.data) {
        console.log('📋 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error.message);
  }
}

debugStepByStep();
