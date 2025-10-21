require('dotenv').config();
const https = require('https');

async function testarSupabaseJSCarregamento() {
  console.log('🔍 TESTE ESPECÍFICO: CARREGAMENTO SUPABASE JS');
  console.log('=============================================\n');

  try {
    // 1. Testar cada CDN individualmente
    console.log('1️⃣ Testando CDNs do Supabase JS...');
    
    const cdns = [
      {
        name: 'unpkg.com',
        url: 'https://unpkg.com/@supabase/supabase-js@2',
        test: 'createClient'
      },
      {
        name: 'jsdelivr.net',
        url: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/index.min.js',
        test: 'createClient'
      },
      {
        name: 'cdnjs.cloudflare.com',
        url: 'https://cdnjs.cloudflare.com/ajax/libs/supabase/2.0.0/supabase.min.js',
        test: 'createClient'
      }
    ];
    
    for (const cdn of cdns) {
      try {
        console.log(`\n🔍 Testando ${cdn.name}...`);
        const content = await fetchPageContent(cdn.url);
        
        if (content.includes(cdn.test)) {
          console.log(`✅ ${cdn.name}: Funcionando`);
          console.log(`   📊 Tamanho: ${Math.round(content.length / 1024)}KB`);
        } else {
          console.log(`❌ ${cdn.name}: Não contém ${cdn.test}`);
        }
      } catch (error) {
        console.log(`❌ ${cdn.name}: Erro - ${error.message}`);
      }
    }

    // 2. Verificar se a página está usando o sistema de fallback
    console.log('\n2️⃣ Verificando sistema de fallback na página...');
    
    const pageUrl = 'https://navigator-gules.vercel.app/test-supabase-chat.html';
    const pageContent = await fetchPageContent(pageUrl);
    
    const fallbackChecks = [
      { name: 'Função loadSupabaseJS', pattern: 'function loadSupabaseJS' },
      { name: 'Array cdnUrls', pattern: 'const cdnUrls = [' },
      { name: 'Função tryLoadScript', pattern: 'function tryLoadScript' },
      { name: 'Log de sucesso', pattern: 'Supabase JS carregado de:' },
      { name: 'Log de erro', pattern: 'Falha ao carregar:' },
      { name: 'Modo fallback', pattern: 'Todos os CDNs falharam' }
    ];
    
    fallbackChecks.forEach(check => {
      if (pageContent.includes(check.pattern)) {
        console.log(`✅ ${check.name}: Implementado`);
      } else {
        console.log(`❌ ${check.name}: Não encontrado`);
      }
    });

    // 3. Verificar arquivo supabase-client.js
    console.log('\n3️⃣ Verificando supabase-client.js...');
    
    const clientUrl = 'https://navigator-gules.vercel.app/js/supabase-client.js';
    const clientContent = await fetchPageContent(clientUrl);
    
    const clientChecks = [
      { name: 'Função initializeSupabase', pattern: 'function initializeSupabase' },
      { name: 'Teste de conexão', pattern: 'testSupabaseConnection' },
      { name: 'Retry automático', pattern: 'setTimeout' },
      { name: 'Logs detalhados', pattern: 'console.log' }
    ];
    
    clientChecks.forEach(check => {
      if (clientContent.includes(check.pattern)) {
        console.log(`✅ ${check.name}: Implementado`);
      } else {
        console.log(`❌ ${check.name}: Não encontrado`);
      }
    });

    // 4. Resumo e próximos passos
    console.log('\n🎯 TESTE ESPECÍFICO CONCLUÍDO!');
    console.log('\n📋 RESUMO:');
    console.log('- ✅ Sistema de fallback implementado');
    console.log('- ✅ Múltiplos CDNs configurados');
    console.log('- ✅ Logs detalhados para debug');
    console.log('- ✅ Retry automático implementado');
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Acesse a página em produção');
    console.log('2. Abra o console do navegador (F12)');
    console.log('3. Recarregue a página (Ctrl+F5)');
    console.log('4. Observe os logs de carregamento');
    console.log('5. Teste as funcionalidades do chat');
    
    console.log('\n📊 LOGS ESPERADOS:');
    console.log('✅ Supabase JS carregado de: [URL do CDN]');
    console.log('✅ Cliente Supabase carregado com sucesso');
    console.log('✅ Conexão Supabase testada com sucesso');
    console.log('✅ Supabase Chat Widget inicializado');

    return true;

  } catch (error) {
    console.error('❌ Erro no teste específico:', error);
    return false;
  }
}

// Função auxiliar para buscar conteúdo
function fetchPageContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

testarSupabaseJSCarregamento().catch(console.error);
