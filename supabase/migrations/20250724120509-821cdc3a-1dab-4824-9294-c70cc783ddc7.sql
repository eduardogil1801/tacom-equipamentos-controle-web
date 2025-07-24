-- Remove a constraint existente
ALTER TABLE public.movimentacoes DROP CONSTRAINT movimentacoes_tipo_movimento_check;

-- Adiciona a nova constraint com os tipos de movimento adicionais
ALTER TABLE public.movimentacoes 
ADD CONSTRAINT movimentacoes_tipo_movimento_check 
CHECK (tipo_movimento = ANY (ARRAY[
  'entrada'::text, 
  'saida'::text, 
  'movimentacao'::text, 
  'manutencao'::text, 
  'aguardando_manutencao'::text, 
  'danificado'::text, 
  'indisponivel'::text, 
  'devolucao'::text,
  'envio_manutencao'::text,
  'retorno_manutencao'::text,
  'movimentacao_interna'::text
]));