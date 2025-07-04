-- Atualizar status dos equipamentos para 'em_uso' apenas para empresas que NÃO são TACOM
UPDATE equipamentos 
SET status = 'em_uso' 
WHERE status = 'disponivel' 
AND id_empresa IN (
  SELECT id 
  FROM empresas 
  WHERE UPPER(name) NOT LIKE '%TACOM%'
);