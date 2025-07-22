-- Remover a restrição existente
ALTER TABLE public.movimentacoes DROP CONSTRAINT movimentacoes_tipo_movimento_check;

-- Adicionar nova restrição incluindo 'devolucao'
ALTER TABLE public.movimentacoes ADD CONSTRAINT movimentacoes_tipo_movimento_check 
CHECK (tipo_movimento = ANY (ARRAY['entrada'::text, 'saida'::text, 'movimentacao'::text, 'manutencao'::text, 'aguardando_manutencao'::text, 'danificado'::text, 'indisponivel'::text, 'devolucao'::text]));