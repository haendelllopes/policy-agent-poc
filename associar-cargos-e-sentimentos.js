require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function associarCargosESentimentos() {
  const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
  
  console.log('\n🎯 ASSOCIANDO CARGOS E ADICIONANDO SENTIMENTOS\n');
  console.log('='.repeat(70));
  
  // 1. Buscar cargos disponíveis
  console.log('📋 Buscando cargos disponíveis...\n');
  const positions = await pool.query('SELECT id, name FROM positions WHERE tenant_id = $1', [tenant_id]);
  console.log(`✅ ${positions.rows.length} cargos encontrados:\n`);
  positions.rows.forEach(p => console.log(`   - ${p.name}`));
  
  // 2. Buscar usuários
  console.log('\n👥 Buscando usuários...\n');
  const users = await pool.query('SELECT id, name FROM users WHERE tenant_id = $1 AND status = $2', [tenant_id, 'active']);
  console.log(`✅ ${users.rows.length} usuários encontrados\n`);
  
  // 3. Associar usuários aos cargos (distribuir)
  console.log('🔗 Associando usuários aos cargos...\n');
  
  const cargosMap = {};
  const cargosDisponiveis = ['Desenvolvedor', 'Analista', 'Gerente', 'Coordenador', 'Supervisor', 'Especialista'];
  
  // Selecionar os cargos que vamos usar
  const cargosParaUsar = positions.rows.filter(p => cargosDisponiveis.includes(p.name));
  
  users.rows.forEach((user, index) => {
    const cargo = cargosParaUsar[index % cargosParaUsar.length];
    cargosMap[user.id] = cargo;
  });
  
  let associados = 0;
  for (const [userId, cargo] of Object.entries(cargosMap)) {
    await pool.query('UPDATE users SET position_id = $1 WHERE id = $2', [cargo.id, userId]);
    associados++;
  }
  
  console.log(`✅ ${associados} usuários associados aos cargos!\n`);
  
  // 4. Adicionar sentimentos por cargo
  console.log('😊 Adicionando sentimentos por cargo...\n');
  
  const distribuicaoSentimentos = {
    'Desenvolvedor': { muito_positivo: 10, positivo: 6 },
    'Analista': { muito_positivo: 8, positivo: 5 },
    'Gerente': { muito_positivo: 6, positivo: 4 },
    'Coordenador': { muito_positivo: 5, positivo: 3 },
    'Supervisor': { muito_positivo: 4, positivo: 3 },
    'Especialista': { muito_positivo: 4, positivo: 2 }
  };
  
  let totalAnotacoes = 0;
  
  for (const [nomeCargo, quantidades] of Object.entries(distribuicaoSentimentos)) {
    const cargo = positions.rows.find(p => p.name === nomeCargo);
    if (!cargo) continue;
    
    const usuariosCargo = users.rows.filter(u => cargosMap[u.id] === cargo);
    
    if (usuariosCargo.length === 0) continue;
    
    console.log(`📝 ${nomeCargo} (${usuariosCargo.length} usuários):`);
    
    // Muito positivos
    for (let i = 0; i < quantidades.muito_positivo; i++) {
      const user = usuariosCargo[Math.floor(Math.random() * usuariosCargo.length)];
      
      await pool.query(`
        INSERT INTO agente_anotacoes (id, tenant_id, colaborador_id, tipo, titulo, anotacao, sentimento, intensidade_sentimento, tags, relevante, gerou_melhoria, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, false, NOW() - INTERVAL '${Math.floor(Math.random() * 6)} days', NOW())
      `, [
        uuidv4(), tenant_id, user.id, 'sentimento_empresa',
        `Feedback excepcional do ${nomeCargo} ${user.name}`,
        `Colaborador demonstrou grande satisfação e entusiasmo durante todo o processo`,
        'muito_positivo', 0.90 + Math.random() * 0.10, [nomeCargo.toLowerCase(), 'positivo']
      ]);
      totalAnotacoes++;
    }
    
    // Positivos
    for (let i = 0; i < quantidades.positivo; i++) {
      const user = usuariosCargo[Math.floor(Math.random() * usuariosCargo.length)];
      
      await pool.query(`
        INSERT INTO agente_anotacoes (id, tenant_id, colaborador_id, tipo, titulo, anotacao, sentimento, intensidade_sentimento, tags, relevante, gerou_melhoria, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, false, NOW() - INTERVAL '${Math.floor(Math.random() * 6)} days', NOW())
      `, [
        uuidv4(), tenant_id, user.id, 'sentimento_trilha',
        `${nomeCargo} ${user.name} satisfeito com trilha`,
        `Colaborador elogiou o conteúdo e relevância da trilha`,
        'positivo', 0.80 + Math.random() * 0.15, [nomeCargo.toLowerCase(), 'positivo']
      ]);
      totalAnotacoes++;
    }
    
    console.log(`   ✅ ${quantidades.muito_positivo + quantidades.positivo} anotações adicionadas`);
  }
  
  console.log(`\n✅ Total: ${totalAnotacoes} anotações adicionadas!\n`);
  
  // 5. Verificar resultado por cargo
  console.log('📊 Verificando sentimento por cargo...\n');
  console.log('='.repeat(70));
  
  const resultado = await pool.query(`
    SELECT 
      COALESCE(p.name, 'Sem Cargo') as cargo,
      AVG(CASE 
        WHEN aa.sentimento = 'muito_positivo' THEN 5
        WHEN aa.sentimento = 'positivo' THEN 4
        WHEN aa.sentimento = 'neutro' THEN 3
        WHEN aa.sentimento = 'negativo' THEN 2
        WHEN aa.sentimento = 'muito_negativo' THEN 1
        ELSE 3
      END) as sentimento_medio,
      COUNT(*) as total_anotacoes
    FROM agente_anotacoes aa
    JOIN users u ON aa.colaborador_id = u.id
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE aa.tenant_id = $1
      AND aa.created_at > NOW() - INTERVAL '7 days'
    GROUP BY p.name
    ORDER BY sentimento_medio DESC
  `, [tenant_id]);
  
  console.log('\n📋 Sentimento por Cargo (Últimos 7 dias):\n');
  console.table(resultado.rows.map(r => ({
    Cargo: r.cargo,
    'Média /5': parseFloat(r.sentimento_medio).toFixed(2),
    'Média /10': ((parseFloat(r.sentimento_medio) / 5) * 10).toFixed(2),
    'Anotações': r.total_anotacoes
  })));
  
  console.log('='.repeat(70));
  console.log('\n🎉 PROCESSO CONCLUÍDO!\n');
  console.log('📊 O gráfico "Sentimento por Cargo" agora deve ter dados visíveis!\n');
  
  await pool.end();
  process.exit();
}

associarCargosESentimentos();

