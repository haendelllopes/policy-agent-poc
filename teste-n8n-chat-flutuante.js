/**
 * Script de teste para simular o fluxo N8N de ativação do chat flutuante
 * 
 * Este script simula:
 * 1. Webhook recebido pelo N8N
 * 2. Busca dos dados do colaborador
 * 3. Ativação do chat flutuante para admin
 */

const axios = require('axios');

// Configuração
const BASE_URL = 'https://navigator-gules.vercel.app';
const TENANT = 'tenant-456';

// Dados simulando o webhook do N8N
const webhookData = {
  colaborador_id: 'colaborador-123', // ID do colaborador que precisa ser resolvido
  titulo: 'Não consegue acessar a plataforma há 2 dias',
  urgencia: 'CRÍTICA',
  categoria: 'Técnico',
  acao_sugerida: 'Verificar credenciais e resetar senha',
  anotacao_id: 'anot-789'
};

async function testarFluxoN8N() {
  console.log('🚀 Testando fluxo N8N de ativação do chat flutuante...\n');

  try {
    // PASSO 1: Simular busca dos dados do colaborador (como o N8N faria)
    console.log('📋 PASSO 1: Buscando dados do colaborador...');
    const colaboradorResponse = await axios.get(`${BASE_URL}/api/users/${webhookData.colaborador_id}`);
    
    if (colaboradorResponse.data.success) {
      const colaborador = colaboradorResponse.data.data;
      console.log('✅ Colaborador encontrado:', {
        id: colaborador.id,
        name: colaborador.name,
        tenant_id: colaborador.tenant_id
      });

      // PASSO 2: Simular busca do admin (como o N8N faria)
      console.log('\n👤 PASSO 2: Buscando admin do tenant...');
      const adminResponse = await axios.get(`${BASE_URL}/api/users?tenant_id=${colaborador.tenant_id}&role=admin`);
      
      if (adminResponse.data.success && adminResponse.data.data.length > 0) {
        const admin = adminResponse.data.data[0];
        console.log('✅ Admin encontrado:', {
          id: admin.id,
          name: admin.name,
          tenant_id: admin.tenant_id
        });

        // PASSO 3: Ativar chat flutuante (como o N8N faria)
        console.log('\n🚨 PASSO 3: Ativando chat flutuante para admin...');
        
        const chatData = {
          admin_id: admin.id,
          tenant_id: colaborador.tenant_id,
          tipo: 'urgencia_critica',
          colaborador_nome: colaborador.name,
          problema: webhookData.titulo,
          urgencia: webhookData.urgencia,
          categoria: webhookData.categoria,
          acao_sugerida: webhookData.acao_sugerida,
          anotacao_id: webhookData.anotacao_id
        };

        console.log('📤 Dados enviados:', chatData);

        const chatResponse = await axios.post(`${BASE_URL}/api/websocket/notify-admin`, chatData);
        
        if (chatResponse.data.success) {
          console.log('✅ Chat flutuante ativado com sucesso!');
          console.log('📱 Admin deve receber notificação urgente no chat flutuante');
          console.log('🔔 Modal de urgência deve aparecer automaticamente');
        } else {
          console.log('❌ Erro ao ativar chat flutuante:', chatResponse.data.error);
        }

      } else {
        console.log('❌ Nenhum admin encontrado para o tenant');
      }

    } else {
      console.log('❌ Colaborador não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Executar teste
testarFluxoN8N();
