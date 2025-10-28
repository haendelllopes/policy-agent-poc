-- Execute isto no Supabase e me mostre os resultados

-- VER DADOS DO COLABORADOR
SELECT 'COLABORADOR:' as tipo, id, name, position_id, department_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

-- VER CARGO DO COLABORADOR
SELECT 'CARGO DO COLABORADOR:' as tipo, p.id, p.name FROM positions p JOIN users u ON u.position_id = p.id WHERE u.id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

-- VER TODAS AS TRILHAS
SELECT 'TRILHAS:' as tipo, id, nome, ativo, segmentacao_tipo FROM trilhas WHERE ativo = true ORDER BY nome;

-- VER CONFIGURAÇÃO DE SEGREGAÇÃO DE TODAS AS TRILHAS
SELECT 'SEGREGAÇÃO:' as tipo, ts.trilha_id, t.nome, ts.department_id, ts.position_id, ts.incluir FROM trilha_segmentacao ts JOIN trilhas t ON t.id = ts.trilha_id ORDER BY t.nome;

-- TESTE DA FUNÇÃO
SELECT 'TESTE:' as tipo, t.id, t.nome, colaborador_tem_acesso_trilha('b2b1f3da-0ea0-445e-ba7f-0cd95e663900', t.id) as acesso FROM trilhas t WHERE t.ativo = true ORDER BY t.nome;

