
-- Corrigir status de equipamentos em empresas não-TACOM de 'disponivel' para 'em_uso'
UPDATE equipamentos 
SET status = 'em_uso', at_update = now()
WHERE id_empresa IN (
  SELECT id FROM empresas WHERE NOT name ILIKE '%TACOM%'
)
AND status = 'disponivel';
