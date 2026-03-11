
-- Adicionar colunas de origem e destino na tabela movimentacoes
ALTER TABLE movimentacoes 
ADD COLUMN IF NOT EXISTS empresa_origem_nome TEXT,
ADD COLUMN IF NOT EXISTS empresa_destino_nome TEXT;
