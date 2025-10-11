/**
 * ROTAS: Segmentação de Trilhas
 * 
 * Endpoints para gerenciar segmentação de trilhas por cargo e departamento
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

// Middleware de autenticação
const authenticate = async (req, res, next) => {
  const DEFAULT_TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64';
  req.tenantId = req.query.tenantId || req.params.tenantId || req.body?.tenantId || req.headers['x-tenant-id'] || DEFAULT_TENANT_ID;
  req.userId = req.query.userId || req.params.userId || req.body?.userId || req.headers['x-user-id'] || 'mock-user-id';
  next();
};

/**
 * GET /api/trilhas/:id/segmentacao
 * Buscar configuração de segmentação de uma trilha
 */
router.get('/:id/segmentacao', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar trilha
    const trilhaResult = await query(
      `SELECT 
        id, nome, segmentacao_tipo, segmentacao_config
       FROM trilhas 
       WHERE id = $1`,
      [id]
    );

    if (trilhaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    const trilha = trilhaResult.rows[0];

    // Buscar segmentações na tabela trilha_segmentacao
    const segmentacoesResult = await query(
      `SELECT 
        ts.id,
        ts.department_id,
        ts.position_id,
        ts.incluir,
        d.name as department_name,
        p.name as position_name
       FROM trilha_segmentacao ts
       LEFT JOIN departments d ON d.id = ts.department_id
       LEFT JOIN positions p ON p.id = ts.position_id
       WHERE ts.trilha_id = $1`,
      [id]
    );

    // Separar departamentos e cargos
    const departamentos = segmentacoesResult.rows
      .filter(s => s.department_id && !s.position_id)
      .map(s => ({
        id: s.id,
        department_id: s.department_id,
        department_name: s.department_name,
        incluir: s.incluir
      }));

    const cargos = segmentacoesResult.rows
      .filter(s => s.position_id && !s.department_id)
      .map(s => ({
        id: s.id,
        position_id: s.position_id,
        position_name: s.position_name,
        incluir: s.incluir
      }));

    const combinacoes = segmentacoesResult.rows
      .filter(s => s.department_id && s.position_id)
      .map(s => ({
        id: s.id,
        department_id: s.department_id,
        department_name: s.department_name,
        position_id: s.position_id,
        position_name: s.position_name,
        incluir: s.incluir
      }));

    res.json({
      success: true,
      trilha_id: trilha.id,
      trilha_nome: trilha.nome,
      segmentacao_tipo: trilha.segmentacao_tipo,
      segmentacao_config: trilha.segmentacao_config,
      departamentos,
      cargos,
      combinacoes
    });

  } catch (error) {
    console.error('Erro ao buscar segmentação:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar segmentação',
      details: error.message 
    });
  }
});

/**
 * PUT /api/trilhas/:id/segmentacao
 * Atualizar segmentação de uma trilha
 */
router.put('/:id/segmentacao', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      segmentacao_tipo,
      department_ids = [],
      position_ids = []
    } = req.body;

    // Validar tipo de segmentação
    const tiposValidos = ['todos', 'departamentos', 'cargos', 'departamentos_cargos'];
    if (!tiposValidos.includes(segmentacao_tipo)) {
      return res.status(400).json({ 
        error: `Tipo de segmentação inválido. Use: ${tiposValidos.join(', ')}` 
      });
    }

    // Validar que pelo menos um critério está definido (exceto "todos")
    if (segmentacao_tipo !== 'todos') {
      if (segmentacao_tipo === 'departamentos' && department_ids.length === 0) {
        return res.status(400).json({ 
          error: 'Selecione pelo menos um departamento' 
        });
      }
      if (segmentacao_tipo === 'cargos' && position_ids.length === 0) {
        return res.status(400).json({ 
          error: 'Selecione pelo menos um cargo' 
        });
      }
      if (segmentacao_tipo === 'departamentos_cargos' && 
          (department_ids.length === 0 || position_ids.length === 0)) {
        return res.status(400).json({ 
          error: 'Selecione pelo menos um departamento E um cargo' 
        });
      }
    }

    // Iniciar transação
    const client = await query('BEGIN');

    try {
      // 1. Atualizar trilha
      await query(
        `UPDATE trilhas 
         SET segmentacao_tipo = $1,
             segmentacao_config = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [
          segmentacao_tipo,
          JSON.stringify({ department_ids, position_ids }),
          id
        ]
      );

      // 2. Limpar segmentações antigas
      await query(
        `DELETE FROM trilha_segmentacao WHERE trilha_id = $1`,
        [id]
      );

      // 3. Inserir novas segmentações
      if (segmentacao_tipo === 'departamentos') {
        for (const deptId of department_ids) {
          await query(
            `INSERT INTO trilha_segmentacao (trilha_id, department_id, incluir)
             VALUES ($1, $2, true)`,
            [id, deptId]
          );
        }
      } else if (segmentacao_tipo === 'cargos') {
        for (const posId of position_ids) {
          await query(
            `INSERT INTO trilha_segmentacao (trilha_id, position_id, incluir)
             VALUES ($1, $2, true)`,
            [id, posId]
          );
        }
      } else if (segmentacao_tipo === 'departamentos_cargos') {
        // Criar combinação de cada departamento com cada cargo
        for (const deptId of department_ids) {
          for (const posId of position_ids) {
            await query(
              `INSERT INTO trilha_segmentacao (trilha_id, department_id, position_id, incluir)
               VALUES ($1, $2, $3, true)`,
              [id, deptId, posId]
            );
          }
        }
      }

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Segmentação atualizada com sucesso',
        trilha_id: id,
        segmentacao_tipo,
        departamentos_count: department_ids.length,
        cargos_count: position_ids.length
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Erro ao atualizar segmentação:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar segmentação',
      details: error.message 
    });
  }
});

/**
 * POST /api/trilhas/:id/segmentacao/departamentos
 * Adicionar departamentos à trilha
 */
router.post('/:id/segmentacao/departamentos', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { department_ids } = req.body;

    if (!Array.isArray(department_ids) || department_ids.length === 0) {
      return res.status(400).json({ 
        error: 'Informe pelo menos um department_id' 
      });
    }

    // Verificar se trilha existe
    const trilhaCheck = await query('SELECT id FROM trilhas WHERE id = $1', [id]);
    if (trilhaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    // Inserir departamentos
    for (const deptId of department_ids) {
      await query(
        `INSERT INTO trilha_segmentacao (trilha_id, department_id, incluir)
         VALUES ($1, $2, true)
         ON CONFLICT (trilha_id, department_id, position_id) 
         DO UPDATE SET incluir = true`,
        [id, deptId]
      );
    }

    res.json({
      success: true,
      message: `${department_ids.length} departamento(s) adicionado(s)`,
      department_ids
    });

  } catch (error) {
    console.error('Erro ao adicionar departamentos:', error);
    res.status(500).json({ 
      error: 'Erro ao adicionar departamentos',
      details: error.message 
    });
  }
});

/**
 * POST /api/trilhas/:id/segmentacao/cargos
 * Adicionar cargos à trilha
 */
router.post('/:id/segmentacao/cargos', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { position_ids } = req.body;

    if (!Array.isArray(position_ids) || position_ids.length === 0) {
      return res.status(400).json({ 
        error: 'Informe pelo menos um position_id' 
      });
    }

    // Verificar se trilha existe
    const trilhaCheck = await query('SELECT id FROM trilhas WHERE id = $1', [id]);
    if (trilhaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    // Inserir cargos
    for (const posId of position_ids) {
      await query(
        `INSERT INTO trilha_segmentacao (trilha_id, position_id, incluir)
         VALUES ($1, $2, true)
         ON CONFLICT (trilha_id, department_id, position_id) 
         DO UPDATE SET incluir = true`,
        [id, posId]
      );
    }

    res.json({
      success: true,
      message: `${position_ids.length} cargo(s) adicionado(s)`,
      position_ids
    });

  } catch (error) {
    console.error('Erro ao adicionar cargos:', error);
    res.status(500).json({ 
      error: 'Erro ao adicionar cargos',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/trilhas/:id/segmentacao/:segId
 * Remover segmentação específica
 */
router.delete('/:id/segmentacao/:segId', authenticate, async (req, res) => {
  try {
    const { id, segId } = req.params;

    // Verificar se segmentação existe
    const segCheck = await query(
      `SELECT id FROM trilha_segmentacao 
       WHERE id = $1 AND trilha_id = $2`,
      [segId, id]
    );

    if (segCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Segmentação não encontrada' });
    }

    // Deletar
    await query(
      `DELETE FROM trilha_segmentacao WHERE id = $1`,
      [segId]
    );

    res.json({
      success: true,
      message: 'Segmentação removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover segmentação:', error);
    res.status(500).json({ 
      error: 'Erro ao remover segmentação',
      details: error.message 
    });
  }
});

/**
 * GET /api/trilhas/colaborador/:userId
 * Buscar trilhas disponíveis para um colaborador (com segmentação)
 */
router.get('/colaborador/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar trilhas usando a função de acesso
    const result = await query(
      `SELECT 
        t.*,
        colaborador_tem_acesso_trilha($1, t.id) as tem_acesso,
        (SELECT COUNT(*) FROM trilha_conteudos WHERE trilha_id = t.id) as total_conteudos
       FROM trilhas t
       WHERE t.tenant_id = (SELECT tenant_id FROM users WHERE id = $1)
         AND t.ativo = true
         AND colaborador_tem_acesso_trilha($1, t.id) = true
       ORDER BY t.ordem, t.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      colaborador_id: userId,
      total: result.rows.length,
      trilhas: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar trilhas do colaborador:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar trilhas',
      details: error.message 
    });
  }
});

/**
 * GET /api/trilhas/:id/preview-acesso
 * Preview de quantos colaboradores terão acesso à trilha
 */
router.get('/:id/preview-acesso', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar trilha
    const trilhaResult = await query(
      `SELECT segmentacao_tipo, tenant_id FROM trilhas WHERE id = $1`,
      [id]
    );

    if (trilhaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    const trilha = trilhaResult.rows[0];

    // Contar colaboradores com acesso
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM users u
       WHERE u.tenant_id = $1
         AND u.role = 'colaborador'
         AND colaborador_tem_acesso_trilha(u.id, $2) = true`,
      [trilha.tenant_id, id]
    );

    // Buscar alguns exemplos de colaboradores
    const exemplosResult = await query(
      `SELECT 
        u.id, u.name, u.email,
        d.name as department_name,
        p.name as position_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN positions p ON p.id = u.position_id
       WHERE u.tenant_id = $1
         AND u.role = 'colaborador'
         AND colaborador_tem_acesso_trilha(u.id, $2) = true
       LIMIT 10`,
      [trilha.tenant_id, id]
    );

    res.json({
      success: true,
      trilha_id: id,
      segmentacao_tipo: trilha.segmentacao_tipo,
      total_colaboradores_com_acesso: parseInt(countResult.rows[0].total),
      exemplos: exemplosResult.rows
    });

  } catch (error) {
    console.error('Erro ao gerar preview:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar preview',
      details: error.message 
    });
  }
});

module.exports = router;

