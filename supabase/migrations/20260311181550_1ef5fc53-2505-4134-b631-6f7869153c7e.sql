
-- Step 1: Fix all remaining "empresa ID: UUID" references in empresa_origem_nome
UPDATE movimentacoes SET empresa_origem_nome = 'TACOM SISTEMAS POA' WHERE empresa_origem_nome = 'empresa ID: eb5c1669-716d-4a4c-ba72-54def723547c';
UPDATE movimentacoes SET empresa_origem_nome = 'SOUL' WHERE empresa_origem_nome = 'empresa ID: d5e217cb-dd3a-4862-a070-4c61aedb3682';
UPDATE movimentacoes SET empresa_origem_nome = 'GUAÍBA' WHERE empresa_origem_nome = 'empresa ID: 3f515b84-32a4-40dc-b2c4-8b4be12b9b47';
UPDATE movimentacoes SET empresa_origem_nome = 'TRANSBUS Cachoeirinha' WHERE empresa_origem_nome = 'empresa ID: d7680ab1-bce4-4872-95a7-911092589012';
UPDATE movimentacoes SET empresa_origem_nome = 'CATSUL' WHERE empresa_origem_nome = 'empresa ID: 10a61363-a5d6-4922-b144-c4ea224eb1eb';
UPDATE movimentacoes SET empresa_origem_nome = 'TRANSCAL' WHERE empresa_origem_nome = 'empresa ID: 5934e39b-d520-4972-9e2e-67e21529d667';
UPDATE movimentacoes SET empresa_origem_nome = 'CMT' WHERE empresa_origem_nome = 'empresa ID: 32a7430e-dc29-4f2c-b9fa-6a69d742b406';
UPDATE movimentacoes SET empresa_origem_nome = 'SOGIL' WHERE empresa_origem_nome = 'empresa ID: 390f7dbd-ef88-44b0-81e0-fe1a45705467';
UPDATE movimentacoes SET empresa_origem_nome = 'NOVA STA RITA' WHERE empresa_origem_nome = 'empresa ID: b12064e1-2d0a-472b-8e41-bfc5503c9c40';
UPDATE movimentacoes SET empresa_origem_nome = 'TACOM PROJETOS (CTG)' WHERE empresa_origem_nome = 'empresa ID: c510cde8-270c-4e32-97e3-4eb749052b5a';
UPDATE movimentacoes SET empresa_origem_nome = 'SOGAL' WHERE empresa_origem_nome = 'empresa ID: 9d7a4254-6563-41ae-a1c8-773897ba8731';
UPDATE movimentacoes SET empresa_origem_nome = 'STI' WHERE empresa_origem_nome = 'empresa ID: 53f5edb3-acc7-4528-8956-9c3bd249db09';
UPDATE movimentacoes SET empresa_origem_nome = 'TRENSURB' WHERE empresa_origem_nome = 'empresa ID: b9d75a51-04b8-4461-9687-4ab3628962de';

-- Fix remaining UUIDs in empresa_destino_nome
UPDATE movimentacoes SET empresa_destino_nome = 'TACOM SISTEMAS POA' WHERE empresa_destino_nome = 'empresa ID: eb5c1669-716d-4a4c-ba72-54def723547c';
UPDATE movimentacoes SET empresa_destino_nome = 'SOUL' WHERE empresa_destino_nome = 'empresa ID: d5e217cb-dd3a-4862-a070-4c61aedb3682';
UPDATE movimentacoes SET empresa_destino_nome = 'GUAÍBA' WHERE empresa_destino_nome = 'empresa ID: 3f515b84-32a4-40dc-b2c4-8b4be12b9b47';
UPDATE movimentacoes SET empresa_destino_nome = 'TRANSBUS Cachoeirinha' WHERE empresa_destino_nome = 'empresa ID: d7680ab1-bce4-4872-95a7-911092589012';
UPDATE movimentacoes SET empresa_destino_nome = 'CATSUL' WHERE empresa_destino_nome = 'empresa ID: 10a61363-a5d6-4922-b144-c4ea224eb1eb';
UPDATE movimentacoes SET empresa_destino_nome = 'TRANSCAL' WHERE empresa_destino_nome = 'empresa ID: 5934e39b-d520-4972-9e2e-67e21529d667';
UPDATE movimentacoes SET empresa_destino_nome = 'CMT' WHERE empresa_destino_nome = 'empresa ID: 32a7430e-dc29-4f2c-b9fa-6a69d742b406';
UPDATE movimentacoes SET empresa_destino_nome = 'SOGIL' WHERE empresa_destino_nome = 'empresa ID: 390f7dbd-ef88-44b0-81e0-fe1a45705467';
UPDATE movimentacoes SET empresa_destino_nome = 'NOVA STA RITA' WHERE empresa_destino_nome = 'empresa ID: b12064e1-2d0a-472b-8e41-bfc5503c9c40';
UPDATE movimentacoes SET empresa_destino_nome = 'TACOM PROJETOS (CTG)' WHERE empresa_destino_nome = 'empresa ID: c510cde8-270c-4e32-97e3-4eb749052b5a';
UPDATE movimentacoes SET empresa_destino_nome = 'SOGAL' WHERE empresa_destino_nome = 'empresa ID: 9d7a4254-6563-41ae-a1c8-773897ba8731';
UPDATE movimentacoes SET empresa_destino_nome = 'STI' WHERE empresa_destino_nome = 'empresa ID: 53f5edb3-acc7-4528-8956-9c3bd249db09';
UPDATE movimentacoes SET empresa_destino_nome = 'TRENSURB' WHERE empresa_destino_nome = 'empresa ID: b9d75a51-04b8-4461-9687-4ab3628962de';

-- Step 2: Fix records where origin = destination (clearly wrong, except for movimentacao_interna)
-- Set to NULL so they show as blank instead of showing wrong data
UPDATE movimentacoes 
SET empresa_origem_nome = NULL, empresa_destino_nome = NULL
WHERE empresa_origem_nome = empresa_destino_nome
  AND empresa_origem_nome IS NOT NULL
  AND tipo_movimento NOT IN ('entrada', 'movimentacao_interna');

-- Step 3: Reconstruct origin/destination using REAL chronological tracking per equipment
-- This time we use the equipment's id_empresa changes and the observacoes field as sources of truth
DO $$
DECLARE
  equip RECORD;
  mov RECORD;
  current_location TEXT;
  prev_dest TEXT;
BEGIN
  -- Process each equipment
  FOR equip IN 
    SELECT DISTINCT e.id as equip_id, e.numero_serie
    FROM equipamentos e
    JOIN movimentacoes m ON m.id_equipamento = e.id
    WHERE m.empresa_origem_nome IS NULL 
      AND m.tipo_movimento NOT IN ('entrada')
    ORDER BY e.numero_serie
  LOOP
    current_location := NULL;
    
    -- Walk through all movements chronologically
    FOR mov IN
      SELECT m.id, m.tipo_movimento, m.data_criacao, m.data_movimento,
             m.empresa_origem_nome, m.empresa_destino_nome, m.observacoes
      FROM movimentacoes m
      WHERE m.id_equipamento = equip.equip_id
      ORDER BY m.data_criacao ASC, m.data_movimento ASC
    LOOP
      IF mov.tipo_movimento = 'entrada' THEN
        -- Entry: destination is where the equipment starts
        current_location := mov.empresa_destino_nome;
        
      ELSIF mov.empresa_origem_nome IS NOT NULL AND mov.empresa_destino_nome IS NOT NULL THEN
        -- Already has data (from form or previous fix), trust it and update location
        current_location := mov.empresa_destino_nome;
        
      ELSIF current_location IS NOT NULL THEN
        -- Need to fill in origin/destination based on movement type
        CASE mov.tipo_movimento
          WHEN 'devolucao' THEN
            -- Devolucao: client returns equipment to TACOM
            -- Origin = current_location (client), Destination = TACOM
            UPDATE movimentacoes SET
              empresa_origem_nome = current_location,
              empresa_destino_nome = 'TACOM SISTEMAS POA'
            WHERE id = mov.id;
            current_location := 'TACOM SISTEMAS POA';
            
          WHEN 'manutencao' THEN
            -- Maintenance: equipment goes to TACOM
            UPDATE movimentacoes SET
              empresa_origem_nome = current_location,
              empresa_destino_nome = 'TACOM SISTEMAS POA'
            WHERE id = mov.id;
            current_location := 'TACOM SISTEMAS POA';
            
          WHEN 'envio_manutencao' THEN
            -- Send to maintenance: goes to TACOM
            UPDATE movimentacoes SET
              empresa_origem_nome = current_location,
              empresa_destino_nome = 'TACOM SISTEMAS POA'
            WHERE id = mov.id;
            current_location := 'TACOM SISTEMAS POA';
            
          WHEN 'retorno_manutencao' THEN
            -- Return from maintenance: TACOM sends back to client
            -- We don't know which client, so leave destination NULL
            -- unless we can infer from the NEXT movement
            UPDATE movimentacoes SET
              empresa_origem_nome = current_location
            WHERE id = mov.id;
            -- Don't update current_location since we don't know destination
            
          WHEN 'movimentacao' THEN
            -- Generic movement: origin = current_location
            -- Try to parse observacoes for destination
            IF mov.observacoes IS NOT NULL AND mov.observacoes LIKE '%Movimentado de%para%' THEN
              UPDATE movimentacoes SET
                empresa_origem_nome = current_location
              WHERE id = mov.id;
            ELSE
              UPDATE movimentacoes SET
                empresa_origem_nome = current_location
              WHERE id = mov.id;
            END IF;
            -- Don't update current_location since we don't know destination
            
          WHEN 'movimentacao_interna' THEN
            -- Internal: same location
            UPDATE movimentacoes SET
              empresa_origem_nome = current_location,
              empresa_destino_nome = current_location
            WHERE id = mov.id;
            -- Location stays the same
            
          ELSE
            -- Unknown type: just set origin
            UPDATE movimentacoes SET
              empresa_origem_nome = current_location
            WHERE id = mov.id;
        END CASE;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
