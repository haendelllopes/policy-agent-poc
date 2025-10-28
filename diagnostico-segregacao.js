// Script para diagnosticar segregação de trilhas
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function diagnosticarSegregacao(colaboradorId) {
  console.log('🔍 DIAGNÓSTICO DE SEGREGAÇÃO DE TRILHAS\n');
  console.log('Colaborador ID:', colaboradorId);
  console.log('='.repeat(80));
  
  try {
    // 1. Verificar dados do colaborador
    console.log('\n1️⃣ DADOS DO COLABORADOR:');
    const colaborador = await pool.query(`
      SELECT id, name, email, department_id, position_id,
             (SELECT name FROM departments WHERE id = users.department_id) as dept_name,
             (SELECT name FROM positions WHERE id = users.position_id) as pos_name
      FROM users
      WHERE id = $1
    `, [colaboradorId]);
    
    if (colaborador.rows.length === 0) {
      console.log('❌ Colaborador não encontrado');
      return;
    }
    
    const colab = colaborador.rows[0];
    console.log('✅ Nome:', colab.name);
    console.log('✅ Email:', colab.email);
    console.log('✅ Departamento ID:', colab.department_id);
    console.log('✅ Departamento Nome:', colab.dept_name);
    console.log('✅ Cargo ID:', colab.position_id);
    console.log('✅ Cargo Nome:', colab.pos_name);
    
    // 2. Verificar trilhas disponíveis
    console.log('\n2️⃣ TRILHAS DISPONÍVEIS NO SISTEMA:');
    const trilhasAll = await pool.query(`
      SELECT id, nome, ativo, segmentacao_tipo
      FROM trilhas
      WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = $1)
      ORDER BY nome
    `, [colaboradorId]);
    
    console.log(`✅ Total de trilhas: ${trilhasAll.rows.length}`);
    trilhasAll.rows.forEach(t => {
      console.log(`   - ${t.nome} (${t.ativo ? 'ativa' : 'inativa'}) [${t.segmentacao_tipo}]`);
    });
    
    // 3. Verificar trilha_segmentacao
    console.log('\n3️⃣ CONFIGURAÇÃO DE SEGREGAÇÃO:');
    for (const trilha of trilhasAll.rows) {
      const seg = await pool.query(`
        SELECT 
          ts.department_id,
          ts.position_id,
          ts.incluir,
          d.name as dept_name,
          p.name as pos_name
        FROM trilha_segmentacao ts
        LEFT JOIN departments d ON d.id = ts.department_id
        LEFT JOIN positions p ON p.id = ts.position_id
        WHERE ts.trilha_id = $1
      `, [trilha.id]);
      
      if (seg.rows.length > 0) {
        console.log(`\n📚 ${trilha.nome}:`);
        seg.rows.forEach(s => {
          if (s.position_id && s.department_id) {
            console.log(`   → ${s.dept_name} + ${s.pos_name} (AMBOS)`);
          } else if (s.department_id) {
            console.log(`   → ${s.dept_name} (Apenas Dept)`);
          } else if (s.position_id) {
            console.log(`   → ${s.pos_name} (Apenas Cargo)`);
          }
        });
      }
    }
    
    // 4. Testar função de acesso
    console.log('\n4️⃣ TESTE DA FUNÇÃO colaborador_tem_acesso_trilha():');
    for (const trilha of trilhasAll.rows) {
      const temAcesso = await pool.query(`
        SELECT colaborador_tem_acesso_trilha($1, $2) as tem_acesso
      `, [colaboradorId, trilha.id]);
      
      const acesso = temAcesso.rows[0].tem_acesso;
      console.log(`${acesso ? '✅' : '❌'} ${trilha.nome}: ${acesso ? 'TEM acesso' : 'SEM acesso'}`);
    }
    
    // 5. Verificar o que o endpoint retorna
    console.log('\n5️⃣ O QUE O ENDPOINT /api/colaborador/trilhas RETORNA:');
    const endpointResult = await pool.query(`
      SELECT 
        t.id, t.nome, t.descricao,
        CASE 
          WHEN ct.id IS NOT NULL THEN ct.status
          ELSE 'disponivel'
        END as status_colaborador
      FROM trilhas t
      LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id AND ct.colaborador_id = $2
      WHERE t.tenant_id = (SELECT tenant_id FROM users WHERE id = $2)
        AND t.ativo = true
        AND colaborador_tem_acesso_trilha($2, t.id) = true
      GROUP BY t.id, ct.id
      ORDER BY t.ordem, t.nome
    `, [colaboradorId, colaboradorId]);
    
    console.log(`✅ Endpoint retorna ${endpointResult.rows.length} trilhas:`);
    endpointResult.rows.forEach(t => {
      console.log(`   - ${t.nome}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

// Executar diagnóstico
const colaboradorId = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900'; // ID do colaborador nos logs
diagnosticarSegregacao(colaboradorId);

