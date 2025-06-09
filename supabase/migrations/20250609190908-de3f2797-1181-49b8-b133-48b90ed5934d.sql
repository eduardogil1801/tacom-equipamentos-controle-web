
-- Adicionar coluna nuvem na tabela frota se não existir
ALTER TABLE frota ADD COLUMN IF NOT EXISTS nuvem INTEGER DEFAULT 0;

-- Atualizar registros existentes para que nuvem seja igual ao total
UPDATE frota SET nuvem = total WHERE nuvem IS NULL OR nuvem = 0;
