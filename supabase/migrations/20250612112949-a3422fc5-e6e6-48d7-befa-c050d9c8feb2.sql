
-- Limpar dados padrão inseridos anteriormente
DELETE FROM public.tipos_equipamento;

-- Inserir tipos únicos da tabela equipamentos na tabela tipos_equipamento
INSERT INTO public.tipos_equipamento (nome)
SELECT DISTINCT tipo
FROM public.equipamentos
WHERE tipo IS NOT NULL AND tipo != ''
ON CONFLICT DO NOTHING;
