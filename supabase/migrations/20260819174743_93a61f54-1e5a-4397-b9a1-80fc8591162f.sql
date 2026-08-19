UPDATE public.equipamentos AS e
SET estado = emp.estado,
    at_update = now()
FROM public.empresas AS emp
WHERE e.id_empresa = emp.id
  AND emp.estado IS NOT NULL
  AND trim(emp.estado) <> ''
  AND lower(trim(COALESCE(e.estado, ''))) IS DISTINCT FROM lower(trim(emp.estado));