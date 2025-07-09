-- Remover movimentações duplicadas mantendo apenas a mais antiga de cada grupo
WITH movimentacoes_numeradas AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY data_movimento, id_equipamento, tipo_movimento 
           ORDER BY data_criacao ASC, id ASC
         ) as rn
  FROM movimentacoes
)
DELETE FROM movimentacoes 
WHERE id IN (
  SELECT id 
  FROM movimentacoes_numeradas 
  WHERE rn > 1
);

-- Criar índice único para prevenir futuras duplicações
CREATE UNIQUE INDEX IF NOT EXISTS idx_movimentacoes_unique 
ON movimentacoes (data_movimento, id_equipamento, tipo_movimento) 
WHERE tipo_movimento != 'entrada';