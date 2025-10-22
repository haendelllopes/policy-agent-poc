const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const router = express.Router();

// Configurar Supabase Storage
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar multer para upload temporário
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'text/plain',
      'application/rtf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

/**
 * POST /api/upload/arquivo-trilha
 * Upload de arquivo para trilha
 */
router.post('/arquivo-trilha', upload.single('arquivo'), async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const { tipo_conteudo, trilha_id } = req.body;
    
    if (!tipo_conteudo) {
      return res.status(400).json({ error: 'Tipo de conteúdo é obrigatório' });
    }

    // Validar tipo de arquivo
    const isValidType = await query(`
      SELECT validar_tipo_arquivo_trilha($1, $2) as valido
    `, [req.file.mimetype, tipo_conteudo]);

    if (!isValidType.rows[0].valido) {
      return res.status(400).json({ 
        error: `Tipo de arquivo ${req.file.mimetype} não é compatível com ${tipo_conteudo}` 
      });
    }

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = `tenant_${tenant.id}/${fileName}`;

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('trilha-arquivos')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          size: req.file.size,
          uploadedAt: new Date().toISOString(),
          tenantId: tenant.id,
          trilhaId: trilha_id || null
        }
      });

    if (error) {
      console.error('Erro no upload Supabase:', error);
      return res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }

    // Gerar URL pública
    const publicUrl = await query(`
      SELECT obter_url_arquivo_trilha('trilha-arquivos', $1) as url
    `, [filePath]);

    console.log(`✅ Arquivo uploadado: ${req.file.originalname} -> ${filePath}`);

    res.json({
      success: true,
      file: {
        id: data.id,
        name: req.file.originalname,
        path: filePath,
        url: publicUrl.rows[0].url,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploaded_at: new Date().toISOString()
      },
      message: 'Arquivo uploadado com sucesso'
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/upload/arquivos-trilha-lote
 * Upload múltiplo de arquivos para trilha
 */
router.post('/arquivos-trilha-lote', upload.array('arquivos', 10), async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const { tipo_conteudo, trilha_id } = req.body;
    
    if (!tipo_conteudo) {
      return res.status(400).json({ error: 'Tipo de conteúdo é obrigatório' });
    }

    const uploadedFiles = [];
    const errors = [];

    // Processar cada arquivo
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Validar tipo de arquivo
        const isValidType = await query(`
          SELECT validar_tipo_arquivo_trilha($1, $2) as valido
        `, [file.mimetype, tipo_conteudo]);

        if (!isValidType.rows[0].valido) {
          errors.push({
            file: file.originalname,
            error: `Tipo de arquivo ${file.mimetype} não é compatível com ${tipo_conteudo}`
          });
          continue;
        }

        // Gerar nome único para o arquivo
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = `tenant_${tenant.id}/${fileName}`;

        // Upload para Supabase Storage
        const { data, error } = await supabase.storage
          .from('trilha-arquivos')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalname,
              size: file.size,
              uploadedAt: new Date().toISOString(),
              tenantId: tenant.id,
              trilhaId: trilha_id || null
            }
          });

        if (error) {
          errors.push({
            file: file.originalname,
            error: 'Erro ao fazer upload do arquivo'
          });
          continue;
        }

        // Gerar URL pública
        const publicUrl = await query(`
          SELECT obter_url_arquivo_trilha('trilha-arquivos', $1) as url
        `, [filePath]);

        uploadedFiles.push({
          id: data.id,
          name: file.originalname,
          path: filePath,
          url: publicUrl.rows[0].url,
          size: file.size,
          mimetype: file.mimetype,
          uploaded_at: new Date().toISOString()
        });

        console.log(`✅ Arquivo ${i + 1}/${req.files.length} uploadado: ${file.originalname}`);

      } catch (fileError) {
        console.error(`Erro no arquivo ${file.originalname}:`, fileError);
        errors.push({
          file: file.originalname,
          error: 'Erro interno do servidor'
        });
      }
    }

    res.json({
      success: uploadedFiles.length > 0,
      uploaded_files: uploadedFiles,
      errors: errors,
      total_uploaded: uploadedFiles.length,
      total_errors: errors.length,
      message: `${uploadedFiles.length} arquivo(s) uploadado(s) com sucesso`
    });

  } catch (error) {
    console.error('Erro no upload múltiplo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/upload/arquivos-trilha/:trilhaId
 * Listar arquivos de uma trilha
 */
router.get('/arquivos-trilha/:trilhaId', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const trilhaId = req.params.trilhaId;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar arquivos da trilha
    const { data, error } = await supabase.storage
      .from('trilha-arquivos')
      .list(`tenant_${tenant.id}`, {
        search: trilhaId
      });

    if (error) {
      console.error('Erro ao listar arquivos:', error);
      return res.status(500).json({ error: 'Erro ao listar arquivos' });
    }

    // Gerar URLs públicas
    const arquivosComUrls = await Promise.all(
      data.map(async (arquivo) => {
        const publicUrl = await query(`
          SELECT obter_url_arquivo_trilha('trilha-arquivos', $1) as url
        `, [`tenant_${tenant.id}/${arquivo.name}`]);

        return {
          id: arquivo.id,
          name: arquivo.name,
          size: arquivo.metadata?.size || 0,
          mimetype: arquivo.metadata?.mimetype || 'unknown',
          url: publicUrl.rows[0].url,
          created_at: arquivo.created_at
        };
      })
    );

    res.json({
      success: true,
      arquivos: arquivosComUrls,
      total: arquivosComUrls.length
    });

  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/upload/arquivo-trilha/:fileId
 * Deletar arquivo de trilha
 */
router.delete('/arquivo-trilha/:fileId', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const fileId = req.params.fileId;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar arquivo
    const { data: files, error: listError } = await supabase.storage
      .from('trilha-arquivos')
      .list(`tenant_${tenant.id}`);

    if (listError) {
      return res.status(500).json({ error: 'Erro ao buscar arquivo' });
    }

    const file = files.find(f => f.id === fileId);
    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Deletar arquivo
    const { error: deleteError } = await supabase.storage
      .from('trilha-arquivos')
      .remove([`tenant_${tenant.id}/${file.name}`]);

    if (deleteError) {
      console.error('Erro ao deletar arquivo:', deleteError);
      return res.status(500).json({ error: 'Erro ao deletar arquivo' });
    }

    console.log(`✅ Arquivo deletado: ${file.name}`);

    res.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
      file_id: fileId
    });

  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/upload/estatisticas-arquivos
 * Estatísticas de arquivos do tenant
 */
router.get('/estatisticas-arquivos', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT * FROM obter_estatisticas_arquivos_trilha($1)
    `, [tenant.id]);

    res.json({
      success: true,
      estatisticas: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
