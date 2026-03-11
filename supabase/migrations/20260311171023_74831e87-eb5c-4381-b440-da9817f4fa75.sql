-- Reconstruct origin/destination using chronological sequence per equipment
-- Logic: track where the equipment is at each point in time
DO $$
DECLARE
  equip_record RECORD;
  mov_record RECORD;
  current_location TEXT;
  entry_company TEXT;
  tacom_poa TEXT := 'TACOM SISTEMAS POA';
  tacom_ctg TEXT := 'TACOM PROJETOS (CTG)';
  tacom_sc TEXT := 'TACOM PROJETOS SC';
BEGIN
  -- For each equipment
  FOR equip_record IN 
    SELECT DISTINCT e.id as equip_id, emp.name as empresa_atual
    FROM equipamentos e
    JOIN empresas emp ON e.id_empresa = emp.id
    WHERE EXISTS (
      SELECT 1 FROM movimentacoes m 
      WHERE m.id_equipamento = e.id 
      AND m.empresa_origem_nome = m.empresa_destino_nome
      AND m.tipo_movimento NOT IN ('entrada', 'movimentacao_interna')
    )
  LOOP
    current_location := NULL;
    entry_company := NULL;
    
    -- Process movements chronologically
    FOR mov_record IN 
      SELECT m.id, m.tipo_movimento, m.empresa_origem_nome, m.empresa_destino_nome, m.data_criacao
      FROM movimentacoes m
      WHERE m.id_equipamento = equip_record.equip_id
      ORDER BY m.data_criacao ASC
    LOOP
      
      IF mov_record.tipo_movimento = 'entrada' THEN
        -- Entry: equipment arrives at its company
        current_location := mov_record.empresa_destino_nome;
        IF current_location IS NULL OR current_location = '' OR current_location = 'Entrada no sistema' THEN
          current_location := equip_record.empresa_atual;
        END IF;
        entry_company := current_location;
        CONTINUE;
      END IF;
      
      -- If we don't know current location yet, use equipment's current company
      IF current_location IS NULL THEN
        current_location := equip_record.empresa_atual;
        entry_company := current_location;
      END IF;
      
      -- Skip if origin != dest (already correct)
      IF mov_record.empresa_origem_nome IS DISTINCT FROM mov_record.empresa_destino_nome THEN
        -- Update current_location based on destination
        IF mov_record.empresa_destino_nome IS NOT NULL AND mov_record.empresa_destino_nome != '' THEN
          current_location := mov_record.empresa_destino_nome;
        END IF;
        CONTINUE;
      END IF;
      
      -- Fix records where origin = destination
      IF mov_record.tipo_movimento IN ('manutencao', 'envio_manutencao') THEN
        -- Equipment goes FROM current_location TO maintenance center
        -- Determine which TACOM based on proximity (if current is TACOM, use the other)
        IF current_location IN (tacom_poa, tacom_ctg, tacom_sc) THEN
          -- TACOM equipment: pick the other TACOM as destination
          IF current_location = tacom_poa THEN
            UPDATE movimentacoes SET empresa_origem_nome = current_location, empresa_destino_nome = tacom_ctg WHERE id = mov_record.id;
            current_location := tacom_ctg;
          ELSE
            UPDATE movimentacoes SET empresa_origem_nome = current_location, empresa_destino_nome = tacom_poa WHERE id = mov_record.id;
            current_location := tacom_poa;
          END IF;
        ELSE
          UPDATE movimentacoes SET empresa_origem_nome = current_location, empresa_destino_nome = tacom_poa WHERE id = mov_record.id;
          current_location := tacom_poa;
        END IF;
        
      ELSIF mov_record.tipo_movimento IN ('devolucao', 'retorno_manutencao') THEN
        -- Equipment returns FROM maintenance TO its company
        IF entry_company IS NOT NULL AND current_location != entry_company THEN
          UPDATE movimentacoes SET empresa_origem_nome = current_location, empresa_destino_nome = entry_company WHERE id = mov_record.id;
          current_location := entry_company;
        ELSIF current_location IN (tacom_poa, tacom_ctg, tacom_sc) THEN
          UPDATE movimentacoes SET empresa_origem_nome = current_location, empresa_destino_nome = entry_company WHERE id = mov_record.id;
          current_location := entry_company;
        ELSE
          -- Equipment at client, returning from TACOM
          UPDATE movimentacoes SET empresa_origem_nome = tacom_poa, empresa_destino_nome = current_location WHERE id = mov_record.id;
          -- current_location stays the same (equipment returns to where it belongs)
        END IF;
        
      ELSIF mov_record.tipo_movimento = 'movimentacao' THEN
        -- Generic movement: most likely FROM current TO somewhere else
        -- If at TACOM, going to client company
        IF current_location IN (tacom_poa, tacom_ctg, tacom_sc) THEN
          IF entry_company IS NOT NULL AND entry_company NOT IN (tacom_poa, tacom_ctg, tacom_sc) THEN
            UPDATE movimentacoes SET empresa_origem_nome = current_location, empresa_destino_nome = entry_company WHERE id = mov_record.id;
            current_location := entry_company;
          END IF;
        ELSE
          -- At client, going to TACOM
          UPDATE movimentacoes SET empresa_origem_nome = current_location, empresa_destino_nome = tacom_poa WHERE id = mov_record.id;
          current_location := tacom_poa;
        END IF;
        
      END IF;
      
    END LOOP;
  END LOOP;
END;
$$;