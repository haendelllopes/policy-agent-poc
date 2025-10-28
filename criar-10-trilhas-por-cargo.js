/**
 * Script para criar 10 trilhas direcionadas por cargo
 * Cada trilha terá conteúdo específico e será segmentada por cargo
 */

require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function criarTrilhasPorCargo() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 60000,
    statement_timeout: 60000
  });
  
  try {
    console.log('\n🎯 CRIANDO 10 TRILHAS DIRECIONADAS POR CARGO\n');
    console.log('='.repeat(70));
    
    const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
    
    // 1. Buscar cargos existentes
    console.log('📋 Buscando cargos disponíveis...\n');
    const positions = await pool.query(
      'SELECT id, name FROM positions WHERE tenant_id = $1 ORDER BY name',
      [tenant_id]
    );
    
    console.log(`✅ ${positions.rows.length} cargos encontrados:\n`);
    positions.rows.forEach(p => console.log(`   - ${p.name} (${p.id})`));
    console.log('');
    
    // 2. Definir trilhas por cargo
    const trilhasPorCargo = [
      {
        nome: 'Onboarding Desenvolvedor',
        descricao: 'Trilha completa de integração para desenvolvedores na empresa',
        cargos: ['Desenvolvedor'],
        conteudos: [
          { tipo: 'link', titulo: 'Repositório Git da Empresa', descricao: 'Acesse o repositório principal no GitHub', url: 'https://github.com', ordem: 1, obrigatorio: true },
          { tipo: 'documento', titulo: 'Guia de Padrões de Código', descricao: 'Documentação sobre padrões de código e boas práticas', url: 'https://docs.google.com', ordem: 2, obrigatorio: true },
          { tipo: 'video', titulo: 'Arquitetura do Sistema', descricao: 'Vídeo explicativo sobre a arquitetura', url: 'https://youtube.com', ordem: 3, obrigatorio: true },
          { tipo: 'link', titulo: 'Ambiente de Desenvolvimento', descricao: 'Configuração do ambiente local', url: 'https://dev.example.com', ordem: 4, obrigatorio: false }
        ],
        prazo: 10
      },
      {
        nome: 'Fundamentos de Análise',
        descricao: 'Trilha introdutória para analistas de negócio',
        cargos: ['Analista'],
        conteudos: [
          { tipo: 'documento', titulo: 'Processo de Análise de Requisitos', descricao: 'Como analisar e documentar requisitos', url: 'https://docs.example.com/analise', ordem: 1, obrigatorio: true },
          { tipo: 'link', titulo: 'Ferramentas de Análise', descricao: 'Acesse as ferramentas de análise disponíveis', url: 'https://tools.example.com', ordem: 2, obrigatorio: true },
          { tipo: 'video', titulo: 'Workshop: Levantamento de Requisitos', descricao: 'Workshop online sobre levantamento', url: 'https://youtube.com/workshop', ordem: 3, obrigatorio: true },
          { tipo: 'documento', titulo: 'Templates de Documentação', descricao: 'Templates para documentação de processos', url: 'https://templates.example.com', ordem: 4, obrigatorio: false }
        ],
        prazo: 7
      },
      {
        nome: 'Liderança e Gestão de Equipes',
        descricao: 'Desenvolvimento de habilidades de liderança para gerentes',
        cargos: ['Gerente'],
        conteudos: [
          { tipo: 'video', titulo: 'Fundamentos de Liderança', descricao: 'Princípios básicos de liderança', url: 'https://youtube.com/lideranca', ordem: 1, obrigatorio: true },
          { tipo: 'documento', titulo: 'Gestão de Performance', descricao: 'Como avaliar e desenvolver pessoas', url: 'https://docs.example.com/performance', ordem: 2, obrigatorio: true },
          { tipo: 'link', titulo: 'Ferramentas de Gestão', descricao: 'Dashboard de gestão de equipes', url: 'https://gestao.example.com', ordem: 3, obrigatorio: true },
          { tipo: 'video', titulo: 'Coaching e Mentoria', descricao: 'Técnicas de coaching para equipes', url: 'https://youtube.com/coaching', ordem: 4, obrigatorio: false }
        ],
        prazo: 14
      },
      {
        nome: 'Coordenação de Projetos',
        descricao: 'Trilha para coordenadores de projetos',
        cargos: ['Coordenador'],
        conteudos: [
          { tipo: 'documento', titulo: 'Metodologias Ágeis', descricao: 'Scrum, Kanban e outras metodologias', url: 'https://docs.example.com/agile', ordem: 1, obrigatorio: true },
          { tipo: 'link', titulo: 'Ferramentas de Projeto', descricao: 'Jira, Trello e outras ferramentas', url: 'https://project.example.com', ordem: 2, obrigatorio: true },
          { tipo: 'video', titulo: 'Planejamento de Projetos', descricao: 'Como planejar e executar projetos', url: 'https://youtube.com/planning', ordem: 3, obrigatorio: true }
        ],
        prazo: 10
      },
      {
        nome: 'Supervisão Operacional',
        descricao: 'Trilha para supervisores',
        cargos: ['Supervisor'],
        conteudos: [
          { tipo: 'documento', titulo: 'Operações do Dia a Dia', descricao: 'Rotinas operacionais', url: 'https://docs.example.com/ops', ordem: 1, obrigatorio: true },
          { tipo: 'link', titulo: 'Dashboard Operacional', descricao: 'Acompanhamento de métricas', url: 'https://ops.example.com', ordem: 2, obrigatorio: true },
          { tipo: 'video', titulo: 'Resolução de Problemas', descricao: 'Como lidar com problemas operacionais', url: 'https://youtube.com/troubleshooting', ordem: 3, obrigatorio: true }
        ],
        prazo: 7
      },
      {
        nome: 'Especialização Técnica',
        descricao: 'Trilha para especialistas',
        cargos: ['Especialista'],
        conteudos: [
          { tipo: 'documento', titulo: 'Domínio Técnico Avançado', descricao: 'Conceitos avançados da área', url: 'https://docs.example.com/advanced', ordem: 1, obrigatorio: true },
          { tipo: 'link', titulo: 'Biblioteca Técnica', descricao: 'Recursos técnicos avançados', url: 'https://tech.example.com', ordem: 2, obrigatorio: true },
          { tipo: 'video', titulo: 'Workshops Técnicos', descricao: 'Vídeos de workshops técnicos', url: 'https://youtube.com/tech', ordem: 3, obrigatorio: true }
        ],
        prazo: 14
      },
      {
        nome: 'Onboarding Geral',
        descricao: 'Trilha geral para todos os colaboradores',
        cargos: ['Desenvolvedor', 'Analista', 'Gerente', 'Coordenador', 'Supervisor', 'Especialista'],
        conteudos: [
          { tipo: 'documento', titulo: 'Cultura e Valores da Empresa', descricao: 'Conheça nossa cultura e valores', url: 'https://docs.example.com/cultura', ordem: 1, obrigatorio: true },
          { tipo: 'video', titulo: 'Boas-vindas da Diretoria', descricao: 'Mensagem de boas-vindas', url: 'https://youtube.com/welcome', ordem: 2, obrigatorio: true },
          { tipo: 'link', titulo: 'Benefícios e Políticas', descricao: 'Descubra seus benefícios', url: 'https://benefits.example.com', ordem: 3, obrigatorio: true },
          { tipo: 'documento', titulo: 'Manual do Colaborador', descricao: 'Manual completo do colaborador', url: 'https://docs.example.com/manual', ordem: 4, obrigatorio: true }
        ],
        prazo: 5
      },
      {
        nome: 'Segurança e Compliance',
        descricao: 'Trilha obrigatória sobre segurança',
        cargos: ['Desenvolvedor', 'Analista', 'Gerente'],
        conteudos: [
          { tipo: 'documento', titulo: 'Política de Segurança', descricao: 'Políticas e procedimentos de segurança', url: 'https://docs.example.com/security', ordem: 1, obrigatorio: true },
          { tipo: 'video', titulo: 'Treinamento de Segurança', descricao: 'Treinamento sobre segurança da informação', url: 'https://youtube.com/security', ordem: 2, obrigatorio: true },
          { tipo: 'link', titulo: 'Certificação de Segurança', descricao: 'Realize o teste de segurança', url: 'https://security.example.com', ordem: 3, obrigatorio: true }
        ],
        prazo: 3
      },
      {
        nome: 'Comunicação e Colaboração',
        descricao: 'Desenvolvimento de habilidades de comunicação',
        cargos: ['Gerente', 'Coordenador', 'Supervisor'],
        conteudos: [
          { tipo: 'video', titulo: 'Comunicação Eficaz', descricao: 'Técnicas de comunicação no ambiente corporativo', url: 'https://youtube.com/comunicacao', ordem: 1, obrigatorio: true },
          { tipo: 'documento', titulo: 'Ferramentas de Colaboração', descricao: 'Slack, Teams e outras ferramentas', url: 'https://docs.example.com/collab', ordem: 2, obrigatorio: true },
          { tipo: 'link', titulo: 'Boas Práticas de Colaboração', descricao: 'Dicas para trabalho em equipe', url: 'https://collab.example.com', ordem: 3, obrigatorio: true }
        ],
        prazo: 7
      },
      {
        nome: 'Inovação e Tendências',
        descricao: 'Fique atualizado com as últimas tendências',
        cargos: ['Desenvolvedor', 'Analista', 'Especialista'],
        conteudos: [
          { tipo: 'link', titulo: 'Newsletter de Tecnologia', descricao: 'Fique por dentro das novidades', url: 'https://news.example.com', ordem: 1, obrigatorio: false },
          { tipo: 'video', titulo: 'Tendências do Mercado', descricao: 'Análise das principais tendências', url: 'https://youtube.com/trends', ordem: 2, obrigatorio: false },
          { tipo: 'documento', titulo: 'Ecossistema de Inovação', descricao: 'Conheça nosso ecossistema', url: 'https://docs.example.com/innovation', ordem: 3, obrigatorio: false }
        ],
        prazo: 0 // Sem prazo definido
      }
    ];
    
    console.log(`📚 Criando ${trilhasPorCargo.length} trilhas...\n`);
    
    // 3. Buscar próxima ordem disponível
    const ordemResult = await pool.query(`
      SELECT COALESCE(MAX(ordem), 0) + 1 as proxima_ordem
      FROM trilhas
      WHERE tenant_id = $1
    `, [tenant_id]);
    let ordem_atual = parseInt(ordemResult.rows[0].proxima_ordem);
    
    // 4. Inserir trilhas e conteúdos
    for (const trilha of trilhasPorCargo) {
      const trilha_id = uuidv4();
      
      // Inserir trilha
      await pool.query(`
        INSERT INTO trilhas (id, tenant_id, nome, descricao, prazo_dias, ordem, ativo, segmentacao_tipo, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, 'cargos', NOW(), NOW())
      `, [
        trilha_id,
        tenant_id,
        trilha.nome,
        trilha.descricao,
        trilha.prazo || 7,
        ordem_atual++
      ]);
      
      console.log(`✅ Trilha criada: ${trilha.nome}`);
      
      // Inserir conteúdos
      for (const conteudo of trilha.conteudos) {
        const conteudo_id = uuidv4();
        
        await pool.query(`
          INSERT INTO trilha_conteudos (id, trilha_id, tipo, titulo, descricao, url, ordem, obrigatorio, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          conteudo_id,
          trilha_id,
          conteudo.tipo,
          conteudo.titulo,
          conteudo.descricao,
          conteudo.url,
          conteudo.ordem,
          conteudo.obrigatorio
        ]);
      }
      
      console.log(`   📄 ${trilha.conteudos.length} conteúdos adicionados`);
      
      // Associar a cargo(s)
      for (const cargoNome of trilha.cargos) {
        const cargo = positions.rows.find(p => p.name === cargoNome);
        
        if (cargo) {
          await pool.query(`
            INSERT INTO trilha_segmentacao (id, trilha_id, position_id, incluir, created_at)
            VALUES (gen_random_uuid(), $1, $2, true, NOW())
          `, [trilha_id, cargo.id]);
          
          console.log(`   👔 Associada ao cargo: ${cargoNome}`);
        }
      }
      
      console.log('');
    }
    
    console.log('='.repeat(70));
    console.log('\n🎉 TRILHAS CRIADAS COM SUCESSO!\n');
    console.log(`✅ ${trilhasPorCargo.length} trilhas criadas`);
    console.log('✅ Conteúdos adicionados');
    console.log('✅ Segmentação por cargo configurada');
    console.log('\n📊 As trilhas agora estão disponíveis no sistema e serão direcionadas automaticamente pelo chat!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

criarTrilhasPorCargo()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

