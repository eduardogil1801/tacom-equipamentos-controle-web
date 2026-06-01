UPDATE public.equipamentos e
SET status = 'em_uso'
FROM public.empresas emp
WHERE emp.id = e.id_empresa
  AND e.status IN ('aguardando_manutencao','manutencao','em_analise')
  AND UPPER(emp.name) NOT LIKE '%TACOM%';