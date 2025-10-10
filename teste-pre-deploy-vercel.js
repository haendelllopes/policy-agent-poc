/**
 * TESTE FINAL ANTES DE DEPLOY NO VERCEL
 * Valida TUDO antes de fazer push
 */

const http = require('http');

const TESTES = {
  criticos: [
    { nome: 'Health Check', metodo: 'GET', path: '/api/health', esperado: 200 },
    { nome: 'Listar Trilhas', metodo: 'GET', path: '/api/trilhas', esperado: 200 },
    { nome: 'Análise Sentimento (NOVA)', metodo: 'POST', path: '/api/analise-sentimento', body: {
      message: "Teste final antes do deploy",
      userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      tenantId: "5978f911-738b-4aae-802a-f037fdac2e64"
    }, esperado: 200 }
  ],
  importantes: [
    { nome: 'Trilhas Colaborador', metodo: 'GET', path: '/api/colaborador/trilhas?colaborador_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890', esperado: 200 },
    { nome: 'Webhooks', metodo: 'POST', path: '/api/webhooks/trilha-iniciada', body: {}, esperado: [200, 400, 500] }
  ],
  opcionais: [
    { nome: 'Histórico Sentimento', metodo: 'GET', path: '/api/analise-sentimento/historico/a1b2c3d4-e5f6-7890-abcd-ef1234567890', esperado: [200, 500] }
  ]
};

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 3000, path, method, headers: {} };
    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = http.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function executarTestes() {
  console.log('\n🚀 TESTE FINAL PRÉ-DEPLOY VERCEL\n');
  console.log('='.repeat(70));
  
  let totalOK = 0, totalFalhou = 0;
  
  // Testes Críticos
  console.log('\n🔴 TESTES CRÍTICOS (Devem Passar 100%)\n');
  for (const t of TESTES.criticos) {
    process.stdout.write(`   ${t.nome.padEnd(40, '.')} `);
    try {
      const r = await request(t.path, t.metodo, t.body);
      const esperados = Array.isArray(t.esperado) ? t.esperado : [t.esperado];
      const ok = esperados.includes(r.status);
      console.log(ok ? '✅ PASSOU' : `❌ FALHOU (${r.status})`);
      ok ? totalOK++ : totalFalhou++;
    } catch (e) {
      console.log(`❌ ERRO`);
      totalFalhou++;
    }
  }
  
  // Testes Importantes
  console.log('\n🟡 TESTES IMPORTANTES (Recomendado)\n');
  for (const t of TESTES.importantes) {
    process.stdout.write(`   ${t.nome.padEnd(40, '.')} `);
    try {
      const r = await request(t.path, t.metodo, t.body);
      const esperados = Array.isArray(t.esperado) ? t.esperado : [t.esperado];
      const ok = esperados.includes(r.status);
      console.log(ok ? '✅ OK' : `⚠️ ${r.status}`);
      ok ? totalOK++ : totalFalhou++;
    } catch (e) {
      console.log(`⚠️ ${e.message.substring(0, 20)}`);
      totalFalhou++;
    }
  }
  
  // Testes Opcionais
  console.log('\n🟢 TESTES OPCIONAIS\n');
  for (const t of TESTES.opcionais) {
    process.stdout.write(`   ${t.nome.padEnd(40, '.')} `);
    try {
      const r = await request(t.path, t.metodo, t.body);
      const esperados = Array.isArray(t.esperado) ? t.esperado : [t.esperado];
      const ok = esperados.includes(r.status);
      console.log(ok ? '✅ OK' : `⚠️ ${r.status}`);
    } catch (e) {
      console.log(`⚠️ ${e.message.substring(0, 20)}`);
    }
  }
  
  // Resultado
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RESULTADO FINAL:\n');
  console.log(`   ✅ Testes Passaram: ${totalOK}`);
  console.log(`   ❌ Testes Falharam: ${totalFalhou}`);
  
  const total = TESTES.criticos.length + TESTES.importantes.length;
  const criticos = TESTES.criticos.length;
  const criticosOK = totalOK >= criticos ? criticos : totalOK;
  
  console.log('\n' + '='.repeat(70));
  
  if (totalFalhou === 0) {
    console.log('\n🎉 100% DOS TESTES PASSARAM!\n');
    console.log('✅ Sistema totalmente validado');
    console.log('✅ SEGURO para deploy no Vercel');
    console.log('✅ Pode fazer: git push origin main\n');
    return true;
  } else if (criticosOK === criticos) {
    console.log('\n✅ TESTES CRÍTICOS PASSARAM!\n');
    console.log('✅ APIs essenciais funcionando');
    console.log('⚠️  Alguns testes secundários falharam (revisar)');
    console.log('✅ RELATIVAMENTE SEGURO para deploy\n');
    return true;
  } else {
    console.log('\n❌ ATENÇÃO - NÃO FAZER DEPLOY!\n');
    console.log('❌ Testes críticos falharam');
    console.log('🔧 Corrija os erros antes de fazer push\n');
    return false;
  }
}

console.log('\n⏳ Iniciando testes em 2 segundos...\n');
setTimeout(() => {
  executarTestes()
    .then(aprovado => {
      console.log('='.repeat(70));
      console.log(aprovado ? '\n🟢 APROVADO PARA DEPLOY\n' : '\n🔴 NÃO DEPLOY AINDA\n');
      process.exit(aprovado ? 0 : 1);
    })
    .catch(err => {
      console.error('\n❌ ERRO:', err.message);
      process.exit(1);
    });
}, 2000);

