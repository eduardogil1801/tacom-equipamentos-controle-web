
-- Adicionar coluna nuvem na tabela frota
ALTER TABLE frota ADD COLUMN IF NOT EXISTS nuvem INTEGER DEFAULT 0;

-- Atualizar todos os equipamentos para a empresa TACOM SISTEMAS POA
UPDATE equipamentos 
SET id_empresa = (
  SELECT id FROM empresas 
  WHERE name ILIKE '%tacom%sistema%poa%' 
  LIMIT 1
)
WHERE id_empresa IS NOT NULL;

-- Limpar a tabela equipamentos para reimportação
DELETE FROM equipamentos;
