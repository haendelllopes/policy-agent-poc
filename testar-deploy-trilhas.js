// Script para testar se o deploy da API de trilhas foi concluído
const https = require('https');

const testUrl = 'https://navigator-gules.vercel.app/api/trilhas-recomendadas/556291708483?sentimento=negativo';

console.log('🧪 Testando API de trilhas após deploy...');
console.log(`📡 URL: ${testUrl}`);

https.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('✅ API funcionando!');
        console.log(`📚 Trilhas encontradas: ${json.total}`);
        console.log('🎯 Primeira trilha:', json.trilhas[0]?.nome || 'Nenhuma');
      } catch (e) {
        console.log('⚠️ Resposta não é JSON válido');
        console.log('📄 Resposta:', data.substring(0, 200));
      }
    } else {
      console.log('❌ Erro na API');
      console.log('📄 Resposta:', data);
    }
  });
  
}).on('error', (err) => {
  console.error('❌ Erro de conexão:', err.message);
});

setTimeout(() => {
  console.log('\n⏰ Teste concluído. Se funcionou, o deploy está OK!');
}, 5000);

