-- Adicionar coluna categoria_defeito na tabela tipos_manutencao
-- DR = Defeito Reclamado, DE = Defeito Encontrado, null = Manutenção normal
ALTER TABLE public.tipos_manutencao 
ADD COLUMN IF NOT EXISTS categoria_defeito text;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.tipos_manutencao.categoria_defeito IS 'Categoria do defeito: DR = Defeito Reclamado, DE = Defeito Encontrado, null = Manutenção normal';

-- Criar índice para melhorar performance de consultas por categoria_defeito
CREATE INDEX IF NOT EXISTS idx_tipos_manutencao_categoria_defeito 
ON public.tipos_manutencao(categoria_defeito) 
WHERE categoria_defeito IS NOT NULL;