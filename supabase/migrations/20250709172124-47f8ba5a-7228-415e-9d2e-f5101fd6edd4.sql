-- Remover a constraint antiga que impede múltiplas movimentações no mesmo dia
DROP INDEX IF EXISTS idx_movimentacoes_unique;

-- Criar nova constraint que permite múltiplas movimentações no mesmo dia
-- mas evita registros completamente idênticos (incluindo timestamp)
CREATE UNIQUE INDEX idx_movimentacoes_unique_with_timestamp 
ON public.movimentacoes (data_movimento, id_equipamento, tipo_movimento, data_criacao) 
WHERE (tipo_movimento <> 'entrada'::text);

-- Comentário explicativo
COMMENT ON INDEX idx_movimentacoes_unique_with_timestamp IS 
'Permite múltiplas movimentações no mesmo dia para o mesmo equipamento, 
desde que tenham timestamps diferentes (data_criacao)';