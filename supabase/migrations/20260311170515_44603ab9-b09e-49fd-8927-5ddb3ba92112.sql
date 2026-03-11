-- Fix empresa_origem_nome: replace "empresa ID: UUID" with actual company name
UPDATE movimentacoes m
SET empresa_origem_nome = emp.name
FROM empresas emp
WHERE m.empresa_origem_nome LIKE 'empresa ID:%'
AND emp.id::text = TRIM(REPLACE(m.empresa_origem_nome, 'empresa ID:', ''));

-- Fix empresa_destino_nome: replace "empresa ID: UUID" with actual company name
UPDATE movimentacoes m
SET empresa_destino_nome = emp.name
FROM empresas emp
WHERE m.empresa_destino_nome LIKE 'empresa ID:%'
AND emp.id::text = TRIM(REPLACE(m.empresa_destino_nome, 'empresa ID:', ''));

-- Also fix observacoes that contain UUIDs - extract and replace
UPDATE movimentacoes m
SET empresa_origem_nome = emp_orig.name
FROM empresas emp_orig
WHERE m.empresa_origem_nome IS NULL
AND m.observacoes LIKE '%Movimentado de empresa ID:%'
AND emp_orig.id::text = TRIM(substring(m.observacoes from 'Movimentado de empresa ID: ([^ ]+) para'));

UPDATE movimentacoes m
SET empresa_destino_nome = emp_dest.name
FROM empresas emp_dest
WHERE m.empresa_destino_nome IS NULL
AND m.observacoes LIKE '%para empresa ID:%'
AND emp_dest.id::text = TRIM(substring(m.observacoes from 'para empresa ID: ([^ |]+)'));