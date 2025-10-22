/**
 * Teste Detalhado da Supabase Edge Function
 * Verifica se a função foi deployada corretamente
 */

require('dotenv').config();
const SUPABASE_URL = 'https://gxqwfltteimexngybwna.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const FUNCTION_NAME = 'clever-endpoint';

async function testarFuncaoDetalhado() {
  console.log('🔍 TESTE DETALHADO DA SUPABASE EDGE FUNCTION');
  console.log('='.repeat(60));

  // Verificar variáveis de ambiente
  console.log('\n🔑 VERIFICAÇÃO DE VARIÁVEIS:');
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada');

  if (!SUPABASE_ANON_KEY) {
    console.log('❌ SUPABASE_ANON_KEY não encontrada no .env');
    return;
  }

  // Teste 1: Verificar se a função existe
  console.log('\n🌐 TESTE 1: Verificar se a função existe');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 405) {
      console.log('✅ Função existe (Method Not Allowed é esperado para GET)');
    } else if (response.status === 404) {
      console.log('❌ Função não encontrada (404)');
      console.log('🔧 Possíveis soluções:');
      console.log('1. Verificar se o nome da função está correto');
      console.log('2. Verificar se o deploy foi concluído');
      console.log('3. Verificar se está usando o projeto correto');
    } else {
      console.log('ℹ️ Status inesperado:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Teste 2: Tentar POST com dados válidos
  console.log('\n📝 TESTE 2: POST com dados válidos');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Teste de embedding'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response:', responseText);

    if (response.status === 200) {
      console.log('✅ Função funcionando corretamente!');
    } else if (response.status === 500) {
      console.log('⚠️ Erro interno da função (500)');
      console.log('🔧 Verificar logs da função no Supabase Dashboard');
    } else if (response.status === 404) {
      console.log('❌ Função não encontrada');
    } else {
      console.log('ℹ️ Status:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Teste 3: Verificar outras funções
  console.log('\n🔍 TESTE 3: Verificar outras funções');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO TESTE DETALHADO');
  console.log('='.repeat(60));
  console.log('🔧 PRÓXIMOS PASSOS:');
  console.log('1. Verificar no Supabase Dashboard se a função foi deployada');
  console.log('2. Verificar se o nome da função está correto');
  console.log('3. Verificar se OPENAI_API_KEY está configurada');
  console.log('4. Verificar logs da função no Dashboard');
}

// Executar teste
testarFuncaoDetalhado();
