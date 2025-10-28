/**
 * Script para adicionar sentimentos por cargo
 * Baseado nos cargos reais dos usuários na tabela users
 */

require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function melhorarSentimentoPorCargo() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 60000,
    statement_timeout: 60000
  });
  
  try {
    console.log('\n📊 MELHORANDO SENTIMENTO POR CARGO\n');
    console.log('='.repeat(70));
    
    const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
    
    // 1. Buscar usuários com seus cargos
    console.log('👥 Buscando usuários com seus cargos...\n');
    
    const usuariosComCargo = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.position_id,
        p.name as cargo
      FROM users u
      LEFT JOIN positions p ON u.position_id = p.id
      WHERE u.tenant_id = $1 
      AND u.status = 'active'
      AND u.position_id IS NOT NULL
      ORDER BY p.name
    `, [tenant_id]);
    
    console.log(`✅ ${usuariosComCargo.rows.length} usuários com cargo encontrados\n`);
    
    // 2. Agrupar por cargo
    const cargosMap = {};
    usuariosComCargo.rows.forEach(user => {
      const cargo = user.cargo || 'Sem Cargo';
      if (!cargosMap[cargo]) {
        cargosMap[cargo] = [];
      }
      cargosMap[cargo].push(user);
    });
    
    console.log('📋 Cargos encontrados:');
    Object.keys(cargosMap).forEach(cargo => {
      console.log(`   - ${cargo}: ${cargosMap[cargo].length} usuários`);
    });
    console.log('');
    
    // 3. Distribuir sentimentos positivos entre os cargos
    console.log('😊 Adicionando sentimentos positivos distribuídos por cargo...\n');
    
    const sentimentosPorCargo = {
      'Desenvolvedor': { muito_positivo: 8, positivo: 5 },
      'Designer': { muito_positivo: 6, positivo: 4 },
      'Analista de Marketing': { muito_positivo: 4, positivo: 3 },
      'QA': { muito_positivo: 3, positivo: 2 },
      'Analista de RH': { muito_positivo: 3, positivo: 2 },
      'Vendedor': { muito_positivo: 4, positivo: 3 },
      'Tech Lead': { muito_positivo: 2, positivo: 1 }
    };
    
    let totalInseridas = 0;
    
    for (const [cargo, quantidades] of Object.entries(sentimentosPorCargo)) {
      const usuarios = cargosMap[cargo];
      
      if (!usuarios || usuarios.length === 0) {
        console.log(`⚠️  Nenhum usuário encontrado para cargo: ${cargo}`);
        continue;
      }
      
      console.log(`📝 Adicionando sentimentos para: ${cargo}`);
      
      // Adicionar muito_positivo
      for (let i = 0; i < quantidades.muito_positivo; i++) {
        const user = usuarios[Math.floor(Math.random() * usuarios.length)];
        
        const anotacoesTemplate = [
          {
            tipo: 'sentimento_trilha',
            titulo: 'Feedback excelente sobre trilha',
            anotacao: `Colaborador ${user.name} demonstrou grande satisfação com o conteúdo da trilha e encontrou muito valor no processo de onboarding.`
          },
          {
            tipo: 'sentimento_empresa',
            titulo: 'Muito satisfeito com a cultura da empresa',
            anotacao: `Colaborador ${user.name} demonstrou grande entusiasmo com os valores e cultura organizacional da empresa.`
          },
          {
            tipo: 'observacao_geral',
            titulo: 'Colaborador extremamente engajado',
            anotacao: `Colaborador ${user.name} está participando ativamente e demonstra grande interesse e entusiasmo em todas as atividades.`
          }
        ];
        
        const template = anotacoesTemplate[Math.floor(Math.random() * anotacoesTemplate.length)];
        
        await pool.query(`
          INSERT INTO agente_anotacoes (
            id, tenant_id, colaborador_id, trilha_id,
            tipo, titulo, anotacao, sentimento, intensidade_sentimento,
            contexto, tags, relevante, gerou_melhoria, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, NOW() - INTERVAL '${Math.floor(Math.random() * 6)} days', NOW())
        `, [
          uuidv4(), tenant_id, user.id, null,
          template.tipo, template.titulo, template.anotacao,
          'muito_positivo', 0.92 + Math.random() * 0.08,
          JSON.stringify({ cargo, momento: 'onboarding_ativo' }),
          ['cargo', cargo, 'positivo'], true, false
        ]);
        
        totalInseridas++;
      }
      
      // Adicionar positivo
      for (let i = 0; i < quantidades.positivo; i++) {
        const user = usuarios[Math.floor(Math.random() * usuarios.length)];
        
        const anotacoesTemplate = [
          {
            tipo: 'sugestao_colaborador',
            titulo: 'Sugestão construtiva de melhoria',
            anotacao: `Colaborador ${user.name} ofereceu sugestões bem fundamentadas para aprimorar o processo de onboarding.`
          },
          {
            tipo: 'sentimento_empresa',
            titulo: 'Satisfeito com suporte recebido',
            anotacao: `Colaborador ${user.name} elogiou a qualidade do suporte e atenção recebida durante o processo.`
          }
        ];
        
        const template = anotacoesTemplate[Math.floor(Math.random() * anotacoesTemplate.length)];
        
        await pool.query(`
          INSERT INTO agente_anotacoes (
            id, tenant_id, colaborador_id, trilha_id,
            tipo, titulo, anotacao, sentimento, intensidade_sentimento,
            contexto, tags, relevante, gerou_melhoria, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, NOW() - INTERVAL '${Math.floor(Math.random() * 6)} days', NOW())
        `, [
          uuidv4(), tenant_id, user.id, null,
          template.tipo, template.titulo, template.anotacao,
          'positivo', 0.80 + Math.random() * 0.15,
          JSON.stringify({ cargo, momento: 'onboarding_ativo' }),
          ['cargo', cargo, 'positivo'], true, false
        ]);
        
        totalInseridas++;
      }
      
      console.log(`   ✅ ${quantidades.muito_positivo + quantidades.positivo} anotações adicionadas`);
    }
    
    console.log(`\n✅ Total: ${totalInseridas} anotações adicionadas por cargo!\n`);
    
    // 4. Verificar média por cargo
    console.log('📊 Verificando sentimento médio por cargo...\n');
    console.log('='.repeat(70));
    
    const resultadoPorCargo = await pool.query(`
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
    
    if (resultadoPorCargo.rows.length > 0) {
      console.log('\n📋 Sentimento por Cargo:\n');
      console.table(resultadoPorCargo.rows.map(r => ({
        Cargo: r.cargo,
        'Média': parseFloat(r.sentimento_medio).toFixed(2),
        'Escala 0-10': ((parseFloat(r.sentimento_medio) / 5) * 10).toFixed(2),
        'Anotações': r.total_anotacoes
      })));
    }
    
    console.log('='.repeat(70));
    console.log('\n🎉 PROCESSO CONCLUÍDO!\n');
    console.log('📊 Recarregue o dashboard para ver o gráfico "Sentimento por Cargo" atualizado!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

melhorarSentimentoPorCargo()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

