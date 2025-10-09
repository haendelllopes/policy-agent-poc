const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const { query } = require('../db-pg');

/**
 * POST /api/quiz/gerar
 * Gerar questões de quiz com IA baseadas no conteúdo da trilha
 */
router.post('/gerar', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { trilha_id, colaborador_id } = req.body;

    if (!trilha_id || !colaborador_id) {
      return res.status(400).json({ error: 'trilha_id e colaborador_id são obrigatórios' });
    }
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Verificar se trilha existe e colaborador está aguardando quiz
    const progressoResult = await query(`
      SELECT ct.id, ct.status, t.nome, t.descricao
      FROM colaborador_trilhas ct
      JOIN trilhas t ON ct.trilha_id = t.id
      WHERE ct.trilha_id = $1 AND ct.colaborador_id = $2 AND t.tenant_id = $3
    `, [trilha_id, colaborador_id, tenant.id]);

    if (progressoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Progresso não encontrado' });
    }

    const progresso = progressoResult.rows[0];

    if (progresso.status !== 'aguardando_quiz') {
      return res.status(400).json({ error: 'Trilha não está pronta para quiz' });
    }

    // Buscar conteúdos da trilha para gerar contexto
    const conteudosResult = await query(`
      SELECT titulo, descricao, url
      FROM trilha_conteudos
      WHERE trilha_id = $1
      ORDER BY ordem
    `, [trilha_id]);

    const conteudos = conteudosResult.rows;

    // Gerar questões com OpenAI
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const contexto = `
Trilha: ${progresso.nome}
Descrição: ${progresso.descricao || 'N/A'}

Conteúdos estudados:
${conteudos.map((c, i) => `${i + 1}. ${c.titulo}${c.descricao ? ' - ' + c.descricao : ''}`).join('\n')}
    `.trim();

    const prompt = `Você é um especialista em criar questões de múltipla escolha para avaliações de onboarding corporativo.

Com base no seguinte conteúdo de uma trilha de onboarding:

${contexto}

Gere EXATAMENTE 5 questões de múltipla escolha com 4 alternativas cada (A, B, C, D).
As questões devem:
- Ser claras e objetivas
- Testar a compreensão do conteúdo
- Ter apenas UMA alternativa correta
- Ser relevantes para o contexto corporativo
- Variar em dificuldade

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem comentários):
{
  "questoes": [
    {
      "pergunta": "Texto da pergunta 1?",
      "alternativas": {
        "A": "Texto alternativa A",
        "B": "Texto alternativa B",
        "C": "Texto alternativa C",
        "D": "Texto alternativa D"
      },
      "correta": "A"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    const questoesText = completion.choices[0].message.content.trim();
    
    // Remover markdown se houver
    const cleanText = questoesText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const questoesData = JSON.parse(cleanText);

    // Validar estrutura
    if (!questoesData.questoes || questoesData.questoes.length !== 5) {
      throw new Error('IA não gerou 5 questões válidas');
    }

    // Calcular número da tentativa
    const tentativasResult = await query(`
      SELECT COUNT(*) as count 
      FROM quiz_tentativas 
      WHERE colaborador_trilha_id = $1
    `, [progresso.id]);

    const numeroTentativa = parseInt(tentativasResult.rows[0].count) + 1;

    // Salvar tentativa
    const tentativaId = uuidv4();
    await query(`
      INSERT INTO quiz_tentativas (
        id, colaborador_trilha_id, questoes, tentativa_numero
      ) VALUES ($1, $2, $3, $4)
    `, [tentativaId, progresso.id, JSON.stringify(questoesData.questoes), numeroTentativa]);

    // Remover respostas corretas antes de enviar ao cliente
    const questoesSemRespostas = questoesData.questoes.map(q => ({
      pergunta: q.pergunta,
      alternativas: q.alternativas
    }));

    res.json({
      tentativa_id: tentativaId,
      tentativa_numero: numeroTentativa,
      questoes: questoesSemRespostas
    });

  } catch (error) {
    console.error('Erro ao gerar quiz:', error);
    res.status(500).json({ error: 'Erro ao gerar quiz', details: error.message });
  }
});

/**
 * POST /api/quiz/submeter
 * Submeter respostas do quiz
 */
router.post('/submeter', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { tentativa_id, respostas } = req.body;

    const schema = z.object({
      tentativa_id: z.string().uuid(),
      respostas: z.array(z.string().regex(/^[A-D]$/))
    });

    const parse = schema.safeParse({ tentativa_id, respostas });
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    if (respostas.length !== 5) {
      return res.status(400).json({ error: 'Devem ser fornecidas exatamente 5 respostas' });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar tentativa
    const tentativaResult = await query(`
      SELECT qt.id, qt.questoes, qt.colaborador_trilha_id, qt.aprovado,
             ct.colaborador_id, ct.trilha_id
      FROM quiz_tentativas qt
      JOIN colaborador_trilhas ct ON qt.colaborador_trilha_id = ct.id
      JOIN trilhas t ON ct.trilha_id = t.id
      WHERE qt.id = $1 AND t.tenant_id = $2
    `, [tentativa_id, tenant.id]);

    if (tentativaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tentativa não encontrada' });
    }

    const tentativa = tentativaResult.rows[0];

    if (tentativa.aprovado !== null) {
      return res.status(400).json({ error: 'Esta tentativa já foi submetida' });
    }

    const questoes = tentativa.questoes;

    // Calcular nota
    let acertos = 0;
    for (let i = 0; i < 5; i++) {
      if (respostas[i] === questoes[i].correta) {
        acertos++;
      }
    }

    const nota = (acertos / 5) * 100;
    const aprovado = nota >= 60;

    // Atualizar tentativa
    await query(`
      UPDATE quiz_tentativas SET
        respostas = $1,
        nota = $2,
        aprovado = $3,
        updated_at = NOW()
      WHERE id = $4
    `, [JSON.stringify(respostas), nota, aprovado, tentativa_id]);

    // Se NÃO aprovado e nota muito baixa, enviar alerta para RH
    if (!aprovado && nota < 40) {
      const alertaResult = await query(`
        SELECT 
          u.name as colaborador_nome,
          t.nome as trilha_nome,
          qt.tentativa_numero,
          u_rh.email as rh_email,
          u_rh.phone as rh_phone
        FROM quiz_tentativas qt
        JOIN colaborador_trilhas ct ON qt.colaborador_trilha_id = ct.id
        JOIN users u ON ct.colaborador_id = u.id
        JOIN trilhas t ON ct.trilha_id = t.id
        LEFT JOIN users u_rh ON u_rh.tenant_id = u.tenant_id AND u_rh.role = 'admin'
        WHERE qt.id = $1
        LIMIT 1
      `, [tentativa_id]);

      if (alertaResult.rows.length > 0) {
        const alerta = alertaResult.rows[0];
        
        // Disparar webhook para n8n - alerta nota baixa
        try {
          await fetch(`${req.protocol}://${req.get('host')}/api/webhooks/alerta-nota-baixa?tenant=${req.tenantSubdomain}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              colaborador_nome: alerta.colaborador_nome,
              trilha_nome: alerta.trilha_nome,
              nota: nota,
              tentativa: alerta.tentativa_numero,
              rh_email: alerta.rh_email,
              rh_phone: alerta.rh_phone
            })
          });
        } catch (webhookError) {
          console.error('Erro ao enviar webhook alerta-nota-baixa:', webhookError);
        }
      }
    }

    // Se aprovado, atualizar progresso da trilha
    if (aprovado) {
      await query(`
        UPDATE colaborador_trilhas SET
          status = 'concluida',
          data_conclusao = NOW(),
          pontuacao_final = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [nota, tentativa.colaborador_trilha_id]);

      // Adicionar pontos à gamificação
      const pontosId = uuidv4();
      await query(`
        INSERT INTO gamificacao_pontos (
          id, colaborador_id, tipo, pontos, trilha_id, descricao
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        pontosId,
        tentativa.colaborador_id,
        'quiz_aprovado',
        Math.round(nota),
        tentativa.trilha_id,
        `Aprovado no quiz com ${nota}%`
      ]);

      // Atualizar pontuação total do usuário
      await query(`
        UPDATE users SET
          pontuacao_total = pontuacao_total + $1,
          updated_at = NOW()
        WHERE id = $2
      `, [Math.round(nota), tentativa.colaborador_id]);

      // Buscar dados do colaborador e trilha para webhook trilha-concluida
      const colaboradorResult = await query(`
        SELECT u.name, u.email, u.phone, t.nome as trilha_nome
        FROM users u
        JOIN trilhas t ON t.id = $2
        WHERE u.id = $1
      `, [tentativa.colaborador_id, tentativa.trilha_id]);

      if (colaboradorResult.rows.length > 0) {
        const dados = colaboradorResult.rows[0];
        
        // Disparar webhook para n8n - trilha concluída
        try {
          await fetch(`${req.protocol}://${req.get('host')}/api/webhooks/trilha-concluida?tenant=${req.tenantSubdomain}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              colaborador_id: tentativa.colaborador_id,
              colaborador_nome: dados.name,
              colaborador_email: dados.email,
              colaborador_phone: dados.phone,
              trilha_id: tentativa.trilha_id,
              trilha_nome: dados.trilha_nome,
              nota: nota,
              pontos: Math.round(nota)
            })
          });
        } catch (webhookError) {
          console.error('Erro ao enviar webhook trilha-concluida:', webhookError);
        }
      }

      // Verificar se todas as trilhas foram concluídas
      const todasConcluidasResult = await query(`
        SELECT 
          COUNT(DISTINCT t.id) as total_trilhas,
          COUNT(DISTINCT CASE WHEN ct.status = 'concluida' THEN t.id END) as trilhas_concluidas
        FROM trilhas t
        LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id AND ct.colaborador_id = $2
        WHERE t.tenant_id = $1 AND t.ativo = true
      `, [tenant.id, tentativa.colaborador_id]);

      const stats = todasConcluidasResult.rows[0];

      if (stats.total_trilhas === parseInt(stats.trilhas_concluidas)) {
        await query(`
          UPDATE users SET
            onboarding_status = 'concluido',
            onboarding_fim = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `, [tentativa.colaborador_id]);

        // Buscar dados do colaborador para webhook onboarding-completo
        const colaboradorCompleto = await query(`
          SELECT u.name, u.email, u.phone, u.pontuacao_total,
                 (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.pontuacao_total > u.pontuacao_total AND u2.tenant_id = u.tenant_id) as ranking_geral
          FROM users u
          WHERE u.id = $1
        `, [tentativa.colaborador_id]);

        if (colaboradorCompleto.rows.length > 0) {
          const dados = colaboradorCompleto.rows[0];
          
          // Disparar webhook para n8n - onboarding completo
          try {
            await fetch(`${req.protocol}://${req.get('host')}/api/webhooks/onboarding-completo?tenant=${req.tenantSubdomain}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                colaborador_id: tentativa.colaborador_id,
                colaborador_nome: dados.name,
                colaborador_email: dados.email,
                colaborador_phone: dados.phone,
                total_trilhas: stats.total_trilhas,
                pontuacao_total: dados.pontuacao_total,
                ranking_geral: dados.ranking_geral
              })
            });
          } catch (webhookError) {
            console.error('Erro ao enviar webhook onboarding-completo:', webhookError);
          }
        }
      }
    }

    res.json({
      nota,
      acertos,
      aprovado,
      message: aprovado 
        ? `Parabéns! Você foi aprovado com ${nota}% de acerto!`
        : `Você precisa revisar o conteúdo. Nota: ${nota}%. Tente novamente!`
    });

  } catch (error) {
    console.error('Erro ao submeter quiz:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/quiz/historico
 * Buscar histórico de tentativas de quiz
 */
router.get('/historico', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { colaborador_id, trilha_id } = req.query;

    if (!colaborador_id || !trilha_id) {
      return res.status(400).json({ error: 'colaborador_id e trilha_id são obrigatórios' });
    }
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT 
        qt.id, qt.nota, qt.aprovado, qt.tentativa_numero,
        qt.created_at
      FROM quiz_tentativas qt
      JOIN colaborador_trilhas ct ON qt.colaborador_trilha_id = ct.id
      JOIN trilhas t ON ct.trilha_id = t.id
      WHERE ct.colaborador_id = $1 AND ct.trilha_id = $2 AND t.tenant_id = $3
      ORDER BY qt.created_at DESC
    `, [colaborador_id, trilha_id, tenant.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/gamificacao/ranking
 * Buscar ranking geral de pontuação
 */
router.get('/ranking', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { department_id, position_id } = req.query;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    let whereClause = 'WHERE u.tenant_id = $1 AND u.onboarding_status IN ($2, $3)';
    const params = [tenant.id, 'em_andamento', 'concluido'];
    let paramIndex = 4;

    if (department_id) {
      whereClause += ` AND u.department_id = $${paramIndex}`;
      params.push(department_id);
      paramIndex++;
    }

    if (position_id) {
      whereClause += ` AND u.position_id = $${paramIndex}`;
      params.push(position_id);
    }

    const result = await query(`
      SELECT 
        u.id, u.name, u.pontuacao_total,
        p.name as position_name,
        d.name as department_name,
        u.onboarding_status,
        COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'concluida') as trilhas_concluidas,
        RANK() OVER (ORDER BY u.pontuacao_total DESC) as ranking
      FROM users u
      LEFT JOIN positions p ON u.position_id = p.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN colaborador_trilhas ct ON ct.colaborador_id = u.id
      ${whereClause}
      GROUP BY u.id, p.name, d.name
      ORDER BY u.pontuacao_total DESC
      LIMIT 50
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/gamificacao/meu-ranking
 * Buscar posição do colaborador no ranking
 */
router.get('/meu-ranking', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { colaborador_id } = req.query;

    if (!colaborador_id) {
      return res.status(400).json({ error: 'colaborador_id é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar dados do colaborador
    const userResult = await query(`
      SELECT 
        u.id, u.name, u.pontuacao_total,
        u.department_id, u.position_id,
        p.name as position_name,
        d.name as department_name
      FROM users u
      LEFT JOIN positions p ON u.position_id = p.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1 AND u.tenant_id = $2
    `, [colaborador_id, tenant.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const user = userResult.rows[0];

    // Ranking geral
    const rankingGeralResult = await query(`
      WITH ranked_users AS (
        SELECT id, pontuacao_total,
               RANK() OVER (ORDER BY pontuacao_total DESC) as ranking
        FROM users
        WHERE tenant_id = $1 AND onboarding_status IN ('em_andamento', 'concluido')
      )
      SELECT ranking, 
             (SELECT COUNT(*) FROM ranked_users) as total
      FROM ranked_users
      WHERE id = $2
    `, [tenant.id, colaborador_id]);

    const rankingGeral = rankingGeralResult.rows[0];

    // Ranking por departamento
    let rankingDepartamento = null;
    if (user.department_id) {
      const deptResult = await query(`
        WITH ranked_users AS (
          SELECT id, pontuacao_total,
                 RANK() OVER (ORDER BY pontuacao_total DESC) as ranking
          FROM users
          WHERE tenant_id = $1 AND department_id = $2 
            AND onboarding_status IN ('em_andamento', 'concluido')
        )
        SELECT ranking,
               (SELECT COUNT(*) FROM ranked_users) as total
        FROM ranked_users
        WHERE id = $3
      `, [tenant.id, user.department_id, colaborador_id]);

      if (deptResult.rows.length > 0) {
        rankingDepartamento = deptResult.rows[0];
      }
    }

    // Ranking por cargo
    let rankingCargo = null;
    if (user.position_id) {
      const posResult = await query(`
        WITH ranked_users AS (
          SELECT id, pontuacao_total,
                 RANK() OVER (ORDER BY pontuacao_total DESC) as ranking
          FROM users
          WHERE tenant_id = $1 AND position_id = $2
            AND onboarding_status IN ('em_andamento', 'concluido')
        )
        SELECT ranking,
               (SELECT COUNT(*) FROM ranked_users) as total
        FROM ranked_users
        WHERE id = $3
      `, [tenant.id, user.position_id, colaborador_id]);

      if (posResult.rows.length > 0) {
        rankingCargo = posResult.rows[0];
      }
    }

    res.json({
      colaborador: {
        id: user.id,
        name: user.name,
        pontuacao_total: user.pontuacao_total,
        position_name: user.position_name,
        department_name: user.department_name
      },
      ranking_geral: rankingGeral,
      ranking_departamento: rankingDepartamento,
      ranking_cargo: rankingCargo
    });

  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;


