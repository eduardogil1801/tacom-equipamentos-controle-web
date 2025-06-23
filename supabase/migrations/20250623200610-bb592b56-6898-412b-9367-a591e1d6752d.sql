
-- Remover a constraint existente que está causando o problema
ALTER TABLE public.movimentacoes DROP CONSTRAINT IF EXISTS movimentacoes_tipo_movimento_check;

-- Adicionar a constraint correta para permitir todos os tipos de movimento utilizados
ALTER TABLE public.movimentacoes ADD CONSTRAINT movimentacoes_tipo_movimento_check 
CHECK (tipo_movimento IN (
  'entrada', 
  'saida', 
  'movimentacao', 
  'manutencao', 
  'aguardando_manutencao', 
  'danificado', 
  'indisponivel'
));
