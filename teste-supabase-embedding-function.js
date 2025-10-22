/**
 * Teste da Supabase Edge Function para Embeddings
 * Testa a função localmente antes do deploy
 */

const SUPABASE_URL = 'https://gxqwfltteimexngybwna.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testarEmbeddingFunction() {
  console.log('🧪 TESTANDO SUPABASE EDGE FUNCTION PARA EMBEDDINGS');
  console.log('='.repeat(60));

  try {
    // Teste 1: Texto simples
    console.log('\n📝 TESTE 1: Texto simples');
    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/generate-embedding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Este é um teste de geração de embedding para o sistema de trilhas.'
      })
    });

    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Sucesso:', result1.success);
    console.log('Dimensões:', result1.dimensions);
    console.log('Modelo:', result1.model);

    if (result1.success) {
      console.log('✅ Teste 1 PASSOU');
    } else {
      console.log('❌ Teste 1 FALHOU:', result1.error);
    }

    // Teste 2: Texto longo
    console.log('\n📄 TESTE 2: Texto longo');
    const textoLongo = `
      Este é um documento de exemplo para testar a geração de embeddings.
      O sistema de trilhas precisa processar diferentes tipos de conteúdo:
      - Documentos PDF
      - Vídeos com transcrição
      - Links da internet
      - Textos diversos
      
      A função deve ser capaz de gerar embeddings consistentes para todos esses tipos.
      Isso permitirá busca semântica eficiente no sistema.
    `;

    const response2 = await fetch(`${SUPABASE_URL}/functions/v1/generate-embedding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: textoLongo
      })
    });

    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Sucesso:', result2.success);
    console.log('Dimensões:', result2.dimensions);

    if (result2.success) {
      console.log('✅ Teste 2 PASSOU');
    } else {
      console.log('❌ Teste 2 FALHOU:', result2.error);
    }

    // Teste 3: Texto vazio (deve falhar)
    console.log('\n🚫 TESTE 3: Texto vazio (deve falhar)');
    const response3 = await fetch(`${SUPABASE_URL}/functions/v1/generate-embedding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: ''
      })
    });

    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Sucesso:', result3.success);

    if (!result3.success && response3.status === 400) {
      console.log('✅ Teste 3 PASSOU (falhou como esperado)');
    } else {
      console.log('❌ Teste 3 FALHOU (deveria ter falhado)');
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));
    
    const testesPassaram = [
      result1.success,
      result2.success,
      !result3.success && response3.status === 400
    ].filter(Boolean).length;

    console.log(`✅ Testes que passaram: ${testesPassaram}/3`);
    
    if (testesPassaram === 3) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!');
      console.log('🚀 Função pronta para uso no N8N!');
    } else {
      console.log('\n⚠️ ALGUNS TESTES FALHARAM!');
      console.log('🔧 Verifique a configuração da função.');
    }

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Verificar se SUPABASE_ANON_KEY está configurada');
    console.log('2. Verificar se a função foi deployada');
    console.log('3. Verificar se OPENAI_API_KEY está configurada no Supabase');
  }
}

// Executar teste
testarEmbeddingFunction();
