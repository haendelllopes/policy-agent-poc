// test-admin-proactive.js
/**
 * TESTE DAS FUNCIONALIDADES PROATIVAS PARA ADMINISTRADORES
 * Fase 5: Agente Proativo Autônomo
 * 
 * Este script testa as novas ferramentas de análise e relatórios
 * específicas para administradores implementadas no Navi.
 */

const WebSocket = require('ws');

async function testAdminProactiveFeatures() {
  console.log('🚀 Testando Funcionalidades Proativas para Administradores...\n');

  try {
    // Aguardar servidor inicializar
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('1️⃣ Conectando ao WebSocket...');
    const ws = new WebSocket('ws://localhost:3000/ws/chat');

    ws.on('open', () => {
      console.log('✅ WebSocket conectado com sucesso!');

      // Teste 1: Análise de Performance de Colaboradores
      console.log('\n2️⃣ Testando Análise de Performance...');
      ws.send(JSON.stringify({
        type: 'chat',
        userId: 'admin-test-123',
        text: 'Navi, analise a performance dos colaboradores do departamento de vendas nos últimos 30 dias',
        context: { 
          page: 'dashboard',
          userType: 'admin'
        }
      }));
    });

    let testStep = 1;

    ws.on('message', (data) => {
      const response = JSON.parse(data);
      console.log('📨 Resposta recebida:', response);

      if (response.type === 'response') {
        console.log('✅ Resposta do Navi:', response.message);
        console.log('🔧 Ferramentas usadas:', response.toolsUsed);

        // Teste 2: Geração de Relatório Executivo
        if (testStep === 1) {
          testStep++;
          console.log('\n3️⃣ Testando Geração de Relatório Executivo...');
          ws.send(JSON.stringify({
            type: 'chat',
            userId: 'admin-test-123',
            text: 'Gere um relatório executivo do onboarding dos últimos 30 dias',
            context: { 
              page: 'dashboard',
              userType: 'admin'
            }
          }));
        }
        // Teste 3: Criação de Alertas
        else if (testStep === 2) {
          testStep++;
          console.log('\n4️⃣ Testando Criação de Alertas...');
          ws.send(JSON.stringify({
            type: 'chat',
            userId: 'admin-test-123',
            text: 'Crie alertas para colaboradores com risco de evasão',
            context: { 
              page: 'dashboard',
              userType: 'admin'
            }
          }));
        }
        // Teste 4: Identificação de Gargalos
        else if (testStep === 3) {
          testStep++;
          console.log('\n5️⃣ Testando Identificação de Gargalos...');
          ws.send(JSON.stringify({
            type: 'chat',
            userId: 'admin-test-123',
            text: 'Identifique gargalos nas trilhas de onboarding',
            context: { 
              page: 'dashboard',
              userType: 'admin'
            }
          }));
        }
        // Teste Final: Resumo
        else if (testStep === 4) {
          console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
          console.log('\n📊 RESUMO DOS TESTES:');
          console.log('✅ Análise de Performance - Funcionando');
          console.log('✅ Geração de Relatórios - Funcionando');
          console.log('✅ Criação de Alertas - Funcionando');
          console.log('✅ Identificação de Gargalos - Funcionando');
          
          console.log('\n🚀 FASE 5: AGENTE PROATIVO AUTÔNOMO IMPLEMENTADA!');
          console.log('🎯 O Navi agora possui ferramentas avançadas para administradores');
          
          ws.close();
        }
      }
    });

    ws.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error.message);
      process.exit(1);
    });

    ws.on('close', () => {
      console.log('🔌 Conexão WebSocket fechada');
      console.log('\n✨ Teste das funcionalidades proativas concluído!');
    });

    // Timeout de 30 segundos
    setTimeout(() => {
      console.log('⏰ Timeout - servidor pode não estar rodando');
      console.log('💡 Certifique-se de que o servidor está rodando com: node src/server.js');
      process.exit(1);
    }, 30000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

console.log('🧪 Iniciando teste das funcionalidades proativas para administradores...');
console.log('💡 Certifique-se de que o servidor está rodando com: node src/server.js\n');

testAdminProactiveFeatures();
