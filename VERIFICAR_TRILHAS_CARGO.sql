-- Verificar trilhas configuradas para cargo "Desenvolvedor"
SELECT 
  ts.trilha_id,
  t.nome as trilha_nome,
  t.segmentacao_tipo,
  ts.position_id,
  ts.department_id,
  p.name as cargo_configurado,
  d.name as dept_configurado,
  ts.incluir
FROM trilha_segmentacao ts
JOIN trilhas t ON t.id = ts.trilha_id
LEFT JOIN positions p ON p.id = ts.position_id AND p.name ILIKE '%esenvolvedor%'
LEFT JOIN departments d ON d.id = ts.department_id
WHERE t.tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900')
ORDER BY t.nome;

