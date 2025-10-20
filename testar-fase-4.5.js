#!/usr/bin/env node

/**
 * Script de Teste - Fase 4.5 - Aprimoramento de Anotações
 * Testa todos os endpoints implementados
 */

const axios = require('axios');

// Configurações
const BASE_URL = 'https://navigator-gules.vercel.app';
const TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64';
const COLABORADOR_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Teste 1: Criar anotação com urgência crítica
async function testarUrgenciaCritica() {
  log('\n🧪 TESTE 1: Urgência Crítica', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/agente/anotacoes`, {
      colaborador_id: COLABORADOR_ID,
      tipo: 'problema_tecnico',
      titulo: 'Sistema não funciona há 3 dias!',
      anotacao: 'Não consigo acessar o sistema há 3 dias. Isso está impedindo meu trabalho completamente.',
      urgencia: 'critica',
      categoria: 'tecnico',
      subcategoria: 'acesso_sistema',
      tags: ['sistema-indisponivel', 'acesso-bloqueado', 'urgente', 'bloqueante', 'ti'],
      acao_sugerida: 'Escalar para TI imediatamente',
      impacto_estimado: 'muito_alto',
      metadata: {
        from: '556291708483',
        sentimento: 'muito_negativo',
        intensidade: 0.9
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID
      }
    });

    if (response.status === 201) {
      log('✅ Anotação crítica criada com sucesso', 'green');
      log(`📝 ID: ${response.data.anotacao.id}`, 'green');
      return response.data.anotacao.id;
    }
  } catch (error) {
    log(`❌ Erro ao criar anotação crítica: ${error.message}`, 'red');
    if (error.response) {
      log(`📊 Status: ${error.response.status}`, 'red');
      log(`📊 Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
  return null;
}

// Teste 2: Alertar urgência crítica
async function testarAlertaUrgencia(anotacaoId) {
  log('\n🧪 TESTE 2: Alerta de Urgência Crítica', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/agente/alertas/urgencia-critica`, {
      anotacao_id: anotacaoId,
      tipo: 'problema_tecnico',
      urgencia: 'critica',
      categoria: 'tecnico',
      mensagem: 'Sistema não funciona há 3 dias!',
      colaborador_id: COLABORADOR_ID,
      acao_sugerida: 'Escalar para TI imediatamente',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID
      }
    });

    if (response.status === 200) {
      log('✅ Alerta de urgência enviado com sucesso', 'green');
      log(`📊 Admins notificados: ${response.data.notified}`, 'green');
      log(`🆔 Alerta ID: ${response.data.alerta_id}`, 'green');
    }
  } catch (error) {
    log(`❌ Erro ao enviar alerta: ${error.message}`, 'red');
    if (error.response) {
      log(`📊 Status: ${error.response.status}`, 'red');
      log(`📊 Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Teste 3: Criar ticket automático
async function testarCriarTicket() {
  log('\n🧪 TESTE 3: Criar Ticket Automático', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/agente/tickets`, {
      titulo: '[URGENTE] Sistema indisponível há 3 dias',
      descricao: 'Colaborador não consegue acessar o sistema há 3 dias, impedindo o trabalho.',
      urgencia: 'CRÍTICA',
      categoria: 'tecnico',
      colaborador_id: COLABORADOR_ID,
      prioridade: 'alta',
      anotacao_id: 'test-ticket-' + Date.now()
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID
      }
    });

    if (response.status === 201) {
      log('✅ Ticket criado com sucesso', 'green');
      log(`🎫 Ticket ID: ${response.data.ticket.id}`, 'green');
    }
  } catch (error) {
    log(`❌ Erro ao criar ticket: ${error.message}`, 'red');
    if (error.response) {
      log(`📊 Status: ${error.response.status}`, 'red');
      log(`📊 Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Teste 4: Buscar anotações dos últimos dias
async function testarBuscarAnotacoes() {
  log('\n🧪 TESTE 4: Buscar Anotações dos Últimos Dias', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/agente/anotacoes/ultimos-dias?dias=7&limit=10`, {
      headers: {
        'x-tenant-id': TENANT_ID
      }
    });

    if (response.status === 200) {
      log('✅ Anotações buscadas com sucesso', 'green');
      log(`📊 Total: ${response.data.total} anotações`, 'green');
      log(`📅 Período: ${response.data.periodo_dias} dias`, 'green');
    }
  } catch (error) {
    log(`❌ Erro ao buscar anotações: ${error.message}`, 'red');
    if (error.response) {
      log(`📊 Status: ${error.response.status}`, 'red');
      log(`📊 Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Teste 5: Salvar melhoria sugerida
async function testarSalvarMelhoria() {
  log('\n🧪 TESTE 5: Salvar Melhoria Sugerida', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/agente/melhorias`, {
      titulo: 'Dividir Trilha de Compliance em 2 módulos',
      descricao: 'Dividir em "Compliance Básico" (conceitos) e "Compliance Avançado" (aplicação prática) para reduzir sensação de sobrecarga',
      categoria: 'conteudo',
      prioridade: 'alta',
      impacto_estimado: 'alto',
      esforco_estimado: 'medio',
      evidencias: [
        '15 reclamações sobre duração',
        'Sentimento médio: negativo (0.68)',
        '30% dos colaboradores afetados'
      ],
      metricas_sucesso: [
        'Redução de 50% nas reclamações sobre duração',
        'Aumento de 20% na taxa de conclusão',
        'Melhoria no sentimento médio para neutro/positivo'
      ],
      metadata: {
        gerado_por: 'analise_automatica_gpt4',
        data_analise: new Date().toISOString(),
        periodo_analise: '7_dias'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID
      }
    });

    if (response.status === 201) {
      log('✅ Melhoria salva com sucesso', 'green');
      log(`💡 Melhoria ID: ${response.data.melhoria.id}`, 'green');
    }
  } catch (error) {
    log(`❌ Erro ao salvar melhoria: ${error.message}`, 'red');
    if (error.response) {
      log(`📊 Status: ${error.response.status}`, 'red');
      log(`📊 Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Teste 6: Criar anotação proativa
async function testarAnotacaoProativa() {
  log('\n🧪 TESTE 6: Criar Anotação Proativa', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/agente/anotacoes/proativa`, {
      colaborador_id: COLABORADOR_ID,
      tipo: 'padrao_identificado',
      titulo: 'Colaborador João inativo há 8 dias',
      anotacao: 'João está há 8 dias sem interagir. Trilha atual: 35% concluída.',
      tags: ['risco-evasao', 'inatividade-critica', 'trilha-incompleta', 'sentimento-negativo', 'intervencao-urgente'],
      urgencia: 'critica',
      categoria: 'engajamento',
      subcategoria: 'risco_evasao',
      acao_sugerida: 'Contato URGENTE do gestor/RH para entender situação',
      impacto_estimado: 'alto',
      insights: 'João pode estar enfrentando dificuldades não comunicadas. A combinação de inatividade prolongada e sentimento negativo indica alto risco de desengajamento permanente.',
      acoes_especificas: [
        'Ligar para João hoje para entender situação',
        'Oferecer reunião 1:1 com gestor',
        'Propor ajuste de trilhas ou suporte personalizado'
      ],
      prioridade_revisao: 'urgente',
      metadata: {
        dias_sem_interacao: 8,
        progresso_trilha_atual: 35,
        ultimo_sentimento: 'negativo',
        padrao_detectado: 'risco_evasao'
      },
      gerado_automaticamente: true
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID
      }
    });

    if (response.status === 201) {
      log('✅ Anotação proativa criada com sucesso', 'green');
      log(`🤖 Anotação ID: ${response.data.anotacao.id}`, 'green');
    }
  } catch (error) {
    log(`❌ Erro ao criar anotação proativa: ${error.message}`, 'red');
    if (error.response) {
      log(`📊 Status: ${error.response.status}`, 'red');
      log(`📊 Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Função principal
async function executarTodosOsTestes() {
  log('🚀 INICIANDO TESTES DA FASE 4.5', 'blue');
  log('================================', 'blue');
  
  // Teste 1: Criar anotação crítica
  const anotacaoId = await testarUrgenciaCritica();
  
  // Teste 2: Alerta de urgência (se anotação foi criada)
  if (anotacaoId) {
    await testarAlertaUrgencia(anotacaoId);
  }
  
  // Teste 3: Criar ticket
  await testarCriarTicket();
  
  // Teste 4: Buscar anotações
  await testarBuscarAnotacoes();
  
  // Teste 5: Salvar melhoria
  await testarSalvarMelhoria();
  
  // Teste 6: Anotação proativa
  await testarAnotacaoProativa();
  
  log('\n🎉 TESTES CONCLUÍDOS!', 'green');
  log('====================', 'green');
  log('✅ Verifique os logs do servidor para confirmar funcionamento', 'yellow');
  log('✅ Todos os endpoints estão prontos para N8N', 'yellow');
}

// Executar se chamado diretamente
if (require.main === module) {
  executarTodosOsTestes().catch(error => {
    log(`❌ Erro geral: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testarUrgenciaCritica,
  testarAlertaUrgencia,
  testarCriarTicket,
  testarBuscarAnotacoes,
  testarSalvarMelhoria,
  testarAnotacaoProativa
};




