
-- Verificar e corrigir a constraint de tipo_movimento na tabela movimentacoes
-- Primeiro, vamos ver qual constraint está causando o problema e ajustar os valores permitidos

-- Remover a constraint existente se houver
ALTER TABLE public.movimentacoes DROP CONSTRAINT IF EXISTS movimentacoes_tipo_movimento_check;

-- Adicionar a constraint correta para permitir os valores: entrada, saida, manutencao
ALTER TABLE public.movimentacoes ADD CONSTRAINT movimentacoes_tipo_movimento_check 
CHECK (tipo_movimento IN ('entrada', 'saida', 'manutencao'));
