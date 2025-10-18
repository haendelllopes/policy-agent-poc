/**
 * Middleware para garantir que tenant_id está presente nas requisições
 * Evita vazamento de dados entre tenants diferentes
 * 
 * Suporta tenant_id de 3 fontes:
 * 1. Query string: ?tenant_id=uuid
 * 2. Body: { tenant_id: "uuid" }
 * 3. Subdomain: tenant.exemplo.com → resolve tenant_id
 */

async function requireTenant(req, res, next) {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    // Prioridade 1: tenant_id direto (query ou body)
    let tenantId = req.query.tenant_id || req.body.tenant_id;
    
    // Prioridade 2: Resolver de tenantSubdomain
    if (!tenantId && req.tenantSubdomain) {
      try {
        const tenant = await getTenantBySubdomain(req.tenantSubdomain);
        if (tenant && tenant.id) {
          tenantId = tenant.id;
          req.tenantId = tenantId;
          console.log(`✅ Tenant resolvido via subdomain: ${req.tenantSubdomain} → ${tenantId}`);
        }
      } catch (subdomainError) {
        console.warn(`⚠️  Erro ao resolver subdomain: ${subdomainError.message}`);
      }
    }
    
    // Prioridade 3: Resolver de Authorization header (futuro - JWT)
    // TODO: Implementar quando houver autenticação com tokens
    
    // Validação final
    if (!tenantId) {
      console.error(`❌ tenant_id ausente na requisição: ${req.method} ${req.path}`);
      return res.status(400).json({ 
        error: 'tenant_id é obrigatório',
        hint: 'Passe tenant_id via query string (?tenant_id=uuid) ou no body da requisição',
        path: req.path,
        method: req.method
      });
    }
    
    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error(`❌ tenant_id inválido (não é UUID): ${tenantId}`);
      return res.status(400).json({ 
        error: 'tenant_id inválido',
        hint: 'tenant_id deve ser um UUID válido',
        received: tenantId
      });
    }
    
    // Armazenar no request para uso posterior
    req.tenantId = tenantId;
    console.log(`✅ tenant_id validado: ${tenantId}`);
    
    next();
  } catch (error) {
    console.error('❌ Erro no middleware requireTenant:', error);
    res.status(500).json({ 
      error: 'Erro ao validar tenant',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { requireTenant };
