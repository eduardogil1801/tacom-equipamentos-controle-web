-- Remover o índice único que está impedindo múltiplas movimentações no mesmo dia
DROP INDEX IF EXISTS idx_movimentacoes_unique_with_timestamp;

-- Criar um novo índice que permite múltiplas movimentações no mesmo dia
-- mas impede apenas inserções completamente duplicadas (mesmo equipamento, mesmo tipo, mesma data, mesmo timestamp exato)
CREATE UNIQUE INDEX idx_movimentacoes_no_duplicates 
ON movimentacoes (id_equipamento, tipo_movimento, data_movimento, data_criacao);

-- Criar índice simples para performance nas consultas
CREATE INDEX idx_movimentacoes_equipamento_data 
ON movimentacoes (id_equipamento, data_movimento DESC);

CREATE INDEX idx_movimentacoes_tipo_data 
ON movimentacoes (tipo_movimento, data_movimento DESC);