#!/usr/bin/env node

/**
 * Verificar Variáveis de Ambiente para Processamento de Conteúdos
 * Data: 2025-10-22
 */

require('dotenv').config();

function verificarVariaveis() {
  console.log('🔧 VERIFICANDO VARIÁVEIS DE AMBIENTE');
  console.log('====================================');
  console.log('Sistema: Processamento Automático de Conteúdos de Trilhas');
  console.log('Data:', new Date().toISOString());
  console.log('');

  const variaveisNecessarias = [
    {
      nome: 'OPENAI_API_KEY',
      descricao: 'Chave da API OpenAI para geração de embeddings',
      obrigatoria: true,
      exemplo: 'sk-...'
    },
    {
      nome: 'N8N_WEBHOOK_URL',
      descricao: 'URL do webhook N8N para processamento',
      obrigatoria: true,
      exemplo: 'https://hndll.app.n8n.cloud/webhook/onboarding'
    },
    {
      nome: 'SUPABASE_URL',
      descricao: 'URL do Supabase para banco de dados',
      obrigatoria: true,
      exemplo: 'https://xxx.supabase.co'
    },
    {
      nome: 'SUPABASE_SERVICE_KEY',
      descricao: 'Chave de serviço do Supabase',
      obrigatoria: true,
      exemplo: 'eyJ...'
    }
  ];

  let todasConfiguradas = true;

  console.log('📋 VERIFICAÇÃO DAS VARIÁVEIS:');
  console.log('==============================');

  variaveisNecessarias.forEach(variavel => {
    const valor = process.env[variavel.nome];
    const configurada = valor && valor.length > 0;

    if (configurada) {
      console.log(`✅ ${variavel.nome}: CONFIGURADA`);
      if (variavel.nome.includes('KEY') || variavel.nome.includes('SECRET')) {
        console.log(`   Valor: ${valor.substring(0, 10)}...`);
      } else {
        console.log(`   Valor: ${valor}`);
      }
    } else {
      console.log(`❌ ${variavel.nome}: NÃO CONFIGURADA`);
      console.log(`   Descrição: ${variavel.descricao}`);
      console.log(`   Exemplo: ${variavel.exemplo}`);
      if (variavel.obrigatoria) {
        todasConfiguradas = false;
      }
    }
    console.log('');
  });

  // Verificar variáveis opcionais
  console.log('📋 VARIÁVEIS OPCIONAIS:');
  console.log('========================');

  const variaveisOpcionais = [
    {
      nome: 'N8N_WEBHOOK_PROCESSAR_CONTEUDO',
      descricao: 'URL específica para processamento de conteúdos (fallback)',
      valor: process.env.N8N_WEBHOOK_PROCESSAR_CONTEUDO
    },
    {
      nome: 'OPENAI_MODEL',
      descricao: 'Modelo OpenAI para embeddings (padrão: text-embedding-3-small)',
      valor: process.env.OPENAI_MODEL || 'text-embedding-3-small'
    }
  ];

  variaveisOpcionais.forEach(variavel => {
    if (variavel.valor) {
      console.log(`✅ ${variavel.nome}: ${variavel.valor}`);
    } else {
      console.log(`ℹ️  ${variavel.nome}: Não configurada (usando padrão)`);
    }
  });

  console.log('');

  // Resumo final
  console.log('📊 RESUMO DA VERIFICAÇÃO:');
  console.log('==========================');

  if (todasConfiguradas) {
    console.log('🎉 TODAS AS VARIÁVEIS OBRIGATÓRIAS ESTÃO CONFIGURADAS!');
    console.log('');
    console.log('✅ Sistema pronto para processamento automático');
    console.log('✅ Embeddings serão gerados com OpenAI');
    console.log('✅ Webhooks serão enviados para N8N');
    console.log('✅ Dados serão salvos no Supabase');
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('1. Testar webhook de processamento');
    console.log('2. Configurar workflow N8N');
    console.log('3. Testar processamento completo');
  } else {
    console.log('❌ ALGUMAS VARIÁVEIS OBRIGATÓRIAS NÃO ESTÃO CONFIGURADAS!');
    console.log('');
    console.log('⚠️  AÇÕES NECESSÁRIAS:');
    console.log('1. Configure as variáveis faltantes no arquivo .env');
    console.log('2. Reinicie o servidor após configurar');
    console.log('3. Execute esta verificação novamente');
    console.log('');
    console.log('📝 EXEMPLO DE CONFIGURAÇÃO (.env):');
    console.log('OPENAI_API_KEY=sk-proj-...');
    console.log('N8N_WEBHOOK_URL=https://hndll.app.n8n.cloud/webhook/onboarding');
    console.log('SUPABASE_URL=https://xxx.supabase.co');
    console.log('SUPABASE_SERVICE_KEY=eyJ...');
  }

  return todasConfiguradas;
}

// Executar verificação
const sucesso = verificarVariaveis();
process.exit(sucesso ? 0 : 1);
