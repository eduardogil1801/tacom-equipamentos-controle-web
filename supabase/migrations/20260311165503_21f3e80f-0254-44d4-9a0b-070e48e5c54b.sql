
-- Step 1: Preencher registros que já têm "Movimentado de X para Y" nas observacoes
UPDATE movimentacoes 
SET 
  empresa_origem_nome = TRIM(substring(observacoes from 'Movimentado de (.+?) para ')),
  empresa_destino_nome = TRIM(
    CASE 
      WHEN observacoes LIKE '%|%' THEN substring(observacoes from 'para ([^|]+)')
      ELSE substring(observacoes from 'para (.+)$')
    END
  )
WHERE observacoes LIKE '%Movimentado de%'
AND empresa_origem_nome IS NULL;

-- Step 2: Para "entrada" - destino é a empresa atual do equipamento naquele momento
-- Como é a entrada inicial, usamos a empresa atual do equipamento
UPDATE movimentacoes m
SET 
  empresa_origem_nome = 'Entrada no sistema',
  empresa_destino_nome = emp.name
FROM equipamentos e
JOIN empresas emp ON e.id_empresa = emp.id
WHERE m.id_equipamento = e.id
AND m.tipo_movimento = 'entrada'
AND m.empresa_destino_nome IS NULL;

-- Step 3: Reconstruir origem/destino para movimentações restantes
-- Usando a sequência cronológica: a empresa destino de um movimento = empresa origem do próximo
DO $$
DECLARE
  equip_record RECORD;
  mov_record RECORD;
  prev_destino TEXT;
  current_company TEXT;
BEGIN
  -- Para cada equipamento
  FOR equip_record IN 
    SELECT DISTINCT e.id, emp.name as empresa_atual
    FROM equipamentos e
    JOIN empresas emp ON e.id_empresa = emp.id
  LOOP
    -- Processar movimentações do mais recente para o mais antigo
    prev_destino := equip_record.empresa_atual;
    
    FOR mov_record IN 
      SELECT m.id, m.tipo_movimento, m.empresa_origem_nome, m.empresa_destino_nome, m.observacoes
      FROM movimentacoes m
      WHERE m.id_equipamento = equip_record.id
      ORDER BY m.data_criacao DESC
    LOOP
      -- Se já tem destino preenchido, usar como referência
      IF mov_record.empresa_destino_nome IS NOT NULL AND mov_record.empresa_destino_nome != '' THEN
        prev_destino := mov_record.empresa_origem_nome;
        CONTINUE;
      END IF;
      
      -- Preencher destino com o que sabemos
      IF mov_record.tipo_movimento = 'entrada' THEN
        -- Entrada: já deveria estar preenchida pelo Step 2
        CONTINUE;
      END IF;
      
      -- Para outros tipos: destino = prev_destino (empresa que o equipamento estava DEPOIS desse movimento)
      UPDATE movimentacoes
      SET empresa_destino_nome = prev_destino
      WHERE id = mov_record.id
      AND empresa_destino_nome IS NULL;
      
      -- Não sabemos a origem com certeza, deixar como NULL por enquanto
      
    END LOOP;
  END LOOP;
END;
$$;

-- Step 4: Preencher origens restantes usando a sequência cronológica (do mais antigo para o mais recente)
-- A origem de um movimento = o destino do movimento anterior
DO $$
DECLARE
  equip_record RECORD;
  mov_record RECORD;
  prev_destino TEXT;
BEGIN
  FOR equip_record IN 
    SELECT DISTINCT id FROM equipamentos
  LOOP
    prev_destino := NULL;
    
    FOR mov_record IN 
      SELECT m.id, m.empresa_origem_nome, m.empresa_destino_nome, m.tipo_movimento
      FROM movimentacoes m
      WHERE m.id_equipamento = equip_record.id
      ORDER BY m.data_criacao ASC
    LOOP
      -- Se não tem origem mas sabemos o destino anterior
      IF (mov_record.empresa_origem_nome IS NULL OR mov_record.empresa_origem_nome = '') 
         AND prev_destino IS NOT NULL 
         AND mov_record.tipo_movimento != 'entrada' THEN
        UPDATE movimentacoes
        SET empresa_origem_nome = prev_destino
        WHERE id = mov_record.id;
      END IF;
      
      -- Atualizar prev_destino
      IF mov_record.empresa_destino_nome IS NOT NULL AND mov_record.empresa_destino_nome != '' THEN
        prev_destino := mov_record.empresa_destino_nome;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
