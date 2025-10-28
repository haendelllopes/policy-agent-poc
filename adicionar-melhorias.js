/**
 * Script para adicionar sugestões de melhoria ao Navigator
 * Insere melhorias na tabela onboarding_improvements
 */

require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function adicionarMelhorias() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 60000,
    statement_timeout: 60000
  });
  
  try {
    console.log('\n💡 ADICIONANDO SUGESTÕES DE MELHORIA AO NAVIGATOR\n');
    console.log('='.repeat(70));
    
    const tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
    
    // Definir melhorias de exemplo
    const melhorias = [
      {
        categoria: 'feedback',
        prioridade: 'alta',
        titulo: 'Adicionar sistema de recompensas para trilhas concluídas',
        descricao: 'Colaboradores demonstraram maior engajamento quando há recompensas visuais. Sugerimos implementar badges, certificados digitais e ranking de pontuação.',
        contexto: JSON.stringify({ area: 'gamificação', metricas: ['taxa_conclusao', 'tempo_medio'] }),
        dados_analise: JSON.stringify({ 
          feedback_usuarios: 15,
          taxa_aceitacao: 87,
          tempo_medio_reducao: 30 
        }),
        status: 'sugerida',
        impacto_estimado: 'alto',
        esforco_estimado: 'medio'
      },
      {
        categoria: 'treinamento',
        prioridade: 'media',
        titulo: 'Adicionar vídeos explicativos sobre política de férias',
        descricao: 'Análise de conversas mostrou que 60% dos novos colaboradores têm dúvidas sobre política de férias. Criar vídeo de 5 minutos explicando o processo.',
        contexto: JSON.stringify({ trilha: 'benefícios', seção: 'férias' }),
        dados_analise: JSON.stringify({ 
          frequencia_pergunta: 45,
          tema: 'férias',
          meio_preferido: 'vídeo' 
        }),
        status: 'em_analise',
        impacto_estimado: 'medio',
        esforco_estimado: 'baixo'
      },
      {
        categoria: 'ferramenta',
        prioridade: 'alta',
        titulo: 'Melhorar navegação mobile do dashboard',
        descricao: 'Usuários estão relatando dificuldade para navegar no dashboard pelo celular. Layout atual não é responsivo o suficiente, causando abandono de trilhas em dispositivos móveis.',
        contexto: JSON.stringify({ plataforma: 'mobile', browser: 'chrome_mobile' }),
        dados_analise: JSON.stringify({ 
          taxa_abandono_mobile: 35,
          taxa_abandono_desktop: 12,
          usuarios_afetados: 23 
        }),
        status: 'aprovada',
        impacto_estimado: 'alto',
        esforco_estimado: 'alto'
      },
      {
        categoria: 'processo',
        prioridade: 'critica',
        titulo: 'Otimizar processo de aprovação de perguntas',
        descricao: 'Colaboradores estão esperando mais de 24h para respostas. Implementar sistema de respostas automáticas para perguntas frequentes e escalonamento inteligente para dúvidas complexas.',
        contexto: JSON.stringify({ fluxo: 'suporte', componente: 'chat' }),
        dados_analise: JSON.stringify({ 
          tempo_medio_resposta: 26.5,
          satisfacao_tempo: 42,
          perguntas_nao_respondidas: 8 
        }),
        status: 'pendente_aprovacao',
        impacto_estimado: 'muito_alto',
        esforco_estimado: 'medio',
        tipo_acao: 'otimizar_fluxo',
        alvo_colaborador_id: null,
        justificativa_ia: 'Análise de 120 conversas indica que 67% das perguntas são repetitivas e podem ser respondidas automaticamente',
        dados_acao: JSON.stringify({ 
          acoes: ['chatbot', 'base_conhecimento', 'escalonamento'],
          estimativa_reducao_tempo: 70 
        })
      },
      {
        categoria: 'ferramenta',
        prioridade: 'media',
        titulo: 'Implementar cache de conteúdos de trilhas',
        descricao: 'Carregamento lento de conteúdos está afetando a experiência do usuário. Implementar cache local e compressão de imagens/vídeos para reduzir tempo de carregamento.',
        contexto: JSON.stringify({ componente: 'trilhas', tipo: 'performance' }),
        dados_analise: JSON.stringify({ 
          tempo_carregamento_medio: 8.3,
          taxa_rejeicao: 15,
          usuarios_impactados: 45 
        }),
        status: 'sugerida',
        impacto_estimado: 'medio',
        esforco_estimado: 'baixo'
      },
      {
        categoria: 'comunicacao',
        prioridade: 'alta',
        titulo: 'Criar sistema de mentorias entre colaboradores',
        descricao: 'Novos colaboradores expressaram interesse em ter um "buddy" ou mentor. Sistema atual de buddy é manual. Sugerimos criar plataforma de match entre veteranos e novatos.',
        contexto: JSON.stringify({ programa: 'buddy', tipo: 'comunidade' }),
        dados_analise: JSON.stringify({ 
          interesse_mentoria: 78,
          entrevistados: 30,
          taxa_aceitacao_conceito: 92 
        }),
        status: 'sugerida',
        impacto_estimado: 'alto',
        esforco_estimado: 'alto'
      },
      {
        categoria: 'treinamento',
        prioridade: 'alta',
        titulo: 'Adicionar legendas e áudio descrição em vídeos',
        descricao: 'Implementar acessibilidade completa em vídeos de treinamento para colaboradores com deficiência auditiva ou visual. Isso beneficiará 12% dos colaboradores segundo dados de demografia.',
        contexto: JSON.stringify({ tipo: 'acessibilidade', conteudo: 'vídeos' }),
        dados_analise: JSON.stringify({ 
          usuarios_beneficiados: 12,
          requisito_legal: true,
          custo_implementacao: 'medio' 
        }),
        status: 'aprovada',
        impacto_estimado: 'muito_alto',
        esforco_estimado: 'alto'
      },
      {
        categoria: 'treinamento',
        prioridade: 'baixa',
        titulo: 'Adicionar glossário de termos técnicos',
        descricao: 'Colaboradores novos frequentemente pedem esclarecimentos sobre termos técnicos. Criar um glossário interativo que pode ser acessado em qualquer momento durante o onboarding.',
        contexto: JSON.stringify({ tipo: 'referencia', formato: 'glossario' }),
        dados_analise: JSON.stringify({ 
          termos_mais_pedidos: ['API', 'SDK', 'CI/CD', 'DevOps', 'Kubernetes'],
          frequencia: 32 
        }),
        status: 'sugerida',
        impacto_estimado: 'baixo',
        esforco_estimado: 'baixo'
      },
      {
        categoria: 'processo',
        prioridade: 'media',
        titulo: 'Automatizar envio de lembretes para trilhas pendentes',
        descricao: 'Reduzir atrasos no onboarding implementando sistema automático de lembretes via email e WhatsApp para trilhas próximas do prazo.',
        contexto: JSON.stringify({ tipo: 'automatizacao', canal: 'multi-canal' }),
        dados_analise: JSON.stringify({ 
          trilhas_atrasadas: 18,
          usuarios_sem_lembretes: 22,
          potencia_reducao_atraso: 45 
        }),
        status: 'em_analise',
        impacto_estimado: 'medio',
        esforco_estimado: 'baixo'
      },
      {
        categoria: 'comunicacao',
        prioridade: 'media',
        titulo: 'Implementar fórum de perguntas e respostas',
        descricao: 'Criar comunidade onde colaboradores podem ajudar uns aos outros respondendo perguntas. Isso reduz carga do suporte e cria senso de comunidade.',
        contexto: JSON.stringify({ tipo: 'comunidade', formato: 'forum' }),
        dados_analise: JSON.stringify({ 
          interesse_comunidade: 65,
          reducao_tickets_suporte: 35,
          engajamento_esperado: 'alto' 
        }),
        status: 'sugerida',
        impacto_estimado: 'medio',
        esforco_estimado: 'medio'
      }
    ];
    
    console.log(`📝 Preparando ${melhorias.length} sugestões de melhoria...\n`);
    
    let inseridas = 0;
    
    for (const melhoria of melhorias) {
      const params = [
        uuidv4(), // id
        tenant_id, // tenant_id
        melhoria.categoria,
        melhoria.prioridade,
        melhoria.titulo,
        melhoria.descricao,
        melhoria.contexto,
        melhoria.dados_analise,
        melhoria.status,
        melhoria.impacto_estimado,
        melhoria.esforco_estimado,
        null, // observacoes
        'ai_agent', // criado_por
        null, // analisado_por
        null, // data_analise
        null, // data_implementacao
        melhoria.tipo_acao || null,
        melhoria.alvo_colaborador_id || null,
        melhoria.justificativa_ia || null,
        melhoria.dados_acao || null
      ];
      
      await pool.query(`
        INSERT INTO onboarding_improvements (
          id, tenant_id, categoria, prioridade, titulo, descricao,
          contexto, dados_analise, status, impacto_estimado, esforco_estimado,
          observacoes, criado_por, analisado_por, data_analise, data_implementacao,
          tipo_acao, alvo_colaborador_id, justificativa_ia, dados_acao,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, params);
      
      inseridas++;
      console.log(`✅ ${inseridas}. ${melhoria.titulo}`);
    }
    
    console.log(`\n✅ ${inseridas} melhorias inseridas com sucesso!\n`);
    
    // Verificar melhorias inseridas
    console.log('🔍 Verificando melhorias inseridas...\n');
    console.log('='.repeat(70));
    
    const verificacao = await pool.query(`
      SELECT 
        id,
        categoria,
        prioridade,
        titulo,
        status,
        impacto_estimado,
        created_at
      FROM onboarding_improvements
      WHERE tenant_id = $1
      AND created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY created_at DESC
      LIMIT 20
    `, [tenant_id]);
    
    if (verificacao.rows.length > 0) {
      console.log(`\n✅ ${verificacao.rows.length} melhorias encontradas!\n`);
      console.table(verificacao.rows.map(m => ({
        Categoria: m.categoria,
        Prioridade: m.prioridade,
        Título: m.titulo.substring(0, 40) + '...',
        Status: m.status,
        Impacto: m.impacto_estimado || 'N/A'
      })));
    }
    
    console.log('='.repeat(70));
    console.log('\n🎉 PROCESSO CONCLUÍDO!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

adicionarMelhorias()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

