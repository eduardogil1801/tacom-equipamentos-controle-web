
-- Reconstruct all movement history by tracking equipment location chronologically
-- Rules:
-- entrada: no origin, dest = initial company
-- devolucao: FROM non-TACOM client TO TACOM (never TACOM as origin)
-- manutencao/envio_manutencao: FROM client TO TACOM
-- retorno_manutencao: FROM TACOM TO client
-- movimentacao: origin→dest (inferred from context)
-- movimentacao_interna: stays at same location
-- saida: leaves system

DO $$
DECLARE
  equip RECORD;
  mov RECORD;
  current_location text;
  last_client_location text;
  dest text;
  parsed_origin text;
  parsed_dest text;
BEGIN
  -- Process each equipment
  FOR equip IN 
    SELECT DISTINCT id_equipamento 
    FROM movimentacoes 
    WHERE id_equipamento IS NOT NULL
  LOOP
    current_location := NULL;
    last_client_location := NULL;
    
    -- Process movements chronologically
    FOR mov IN 
      SELECT m.id, m.tipo_movimento, m.observacoes, 
             m.empresa_destino_nome as old_dest, 
             m.empresa_origem_nome as old_origin,
             emp.name as equip_current_company
      FROM movimentacoes m
      LEFT JOIN equipamentos e ON m.id_equipamento = e.id
      LEFT JOIN empresas emp ON e.id_empresa = emp.id
      WHERE m.id_equipamento = equip.id_equipamento
      ORDER BY m.data_criacao ASC, m.data_movimento ASC
    LOOP
      -- Try to parse origin/dest from observacoes "Movimentado de X para Y"
      parsed_origin := NULL;
      parsed_dest := NULL;
      IF mov.observacoes IS NOT NULL AND mov.observacoes ~ 'Movimentado de' THEN
        parsed_origin := trim(substring(mov.observacoes from 'Movimentado de (.+?) para '));
        parsed_dest := trim(substring(mov.observacoes from ' para ([^|]+)'));
      END IF;

      IF mov.tipo_movimento = 'entrada' THEN
        -- Entry: determine initial company
        dest := COALESCE(
          NULLIF(mov.old_dest, 'Entrada no sistema'),
          parsed_dest,
          mov.equip_current_company
        );
        
        UPDATE movimentacoes SET 
          empresa_origem_nome = NULL,
          empresa_destino_nome = dest
        WHERE id = mov.id;
        
        current_location := dest;
        IF current_location IS NOT NULL AND current_location NOT ILIKE '%tacom%' THEN
          last_client_location := current_location;
        END IF;
        
      ELSIF mov.tipo_movimento = 'movimentacao_interna' THEN
        -- Internal: stays at same location
        UPDATE movimentacoes SET 
          empresa_origem_nome = current_location,
          empresa_destino_nome = current_location
        WHERE id = mov.id;
        -- current_location stays the same
        
      ELSIF mov.tipo_movimento = 'devolucao' THEN
        -- Devolucao = client returning equipment TO TACOM
        -- Origin must be non-TACOM, Destination must be TACOM
        IF current_location IS NOT NULL AND current_location NOT ILIKE '%tacom%' THEN
          -- Normal case: from client to TACOM
          UPDATE movimentacoes SET
            empresa_origem_nome = current_location,
            empresa_destino_nome = 'TACOM SISTEMAS POA'
          WHERE id = mov.id;
          last_client_location := current_location;
          current_location := 'TACOM SISTEMAS POA';
        ELSIF current_location ILIKE '%tacom%' THEN
          -- Equipment is at TACOM - might be between TACOM locations
          -- Check if parsed info helps
          IF parsed_origin IS NOT NULL AND parsed_dest IS NOT NULL THEN
            UPDATE movimentacoes SET
              empresa_origem_nome = parsed_origin,
              empresa_destino_nome = parsed_dest
            WHERE id = mov.id;
            current_location := parsed_dest;
          ELSE
            -- Between TACOM locations
            dest := CASE 
              WHEN current_location = 'TACOM SISTEMAS POA' THEN 'TACOM PROJETOS (CTG)'
              ELSE 'TACOM SISTEMAS POA'
            END;
            UPDATE movimentacoes SET
              empresa_origem_nome = current_location,
              empresa_destino_nome = dest
            WHERE id = mov.id;
            current_location := dest;
          END IF;
        ELSE
          -- current_location is null, use what we have
          UPDATE movimentacoes SET
            empresa_origem_nome = COALESCE(parsed_origin, last_client_location, mov.equip_current_company),
            empresa_destino_nome = 'TACOM SISTEMAS POA'
          WHERE id = mov.id;
          current_location := 'TACOM SISTEMAS POA';
        END IF;
        
      ELSIF mov.tipo_movimento IN ('manutencao', 'envio_manutencao') THEN
        -- Goes to TACOM for maintenance
        -- If parsed info available, use it
        IF parsed_origin IS NOT NULL AND parsed_dest IS NOT NULL THEN
          UPDATE movimentacoes SET
            empresa_origem_nome = parsed_origin,
            empresa_destino_nome = parsed_dest
          WHERE id = mov.id;
          IF current_location NOT ILIKE '%tacom%' THEN
            last_client_location := current_location;
          END IF;
          current_location := parsed_dest;
        ELSE
          dest := 'TACOM SISTEMAS POA';
          UPDATE movimentacoes SET
            empresa_origem_nome = current_location,
            empresa_destino_nome = dest
          WHERE id = mov.id;
          IF current_location IS NOT NULL AND current_location NOT ILIKE '%tacom%' THEN
            last_client_location := current_location;
          END IF;
          current_location := dest;
        END IF;
        
      ELSIF mov.tipo_movimento = 'retorno_manutencao' THEN
        -- Returns from TACOM to client
        IF parsed_origin IS NOT NULL AND parsed_dest IS NOT NULL THEN
          UPDATE movimentacoes SET
            empresa_origem_nome = parsed_origin,
            empresa_destino_nome = parsed_dest
          WHERE id = mov.id;
          current_location := parsed_dest;
        ELSE
          dest := COALESCE(last_client_location, mov.equip_current_company);
          -- Ensure dest is not TACOM
          IF dest ILIKE '%tacom%' THEN
            dest := mov.equip_current_company;
          END IF;
          UPDATE movimentacoes SET
            empresa_origem_nome = current_location,
            empresa_destino_nome = dest
          WHERE id = mov.id;
          current_location := dest;
        END IF;
        IF current_location IS NOT NULL AND current_location NOT ILIKE '%tacom%' THEN
          last_client_location := current_location;
        END IF;
        
      ELSIF mov.tipo_movimento = 'movimentacao' THEN
        -- General movement
        IF parsed_origin IS NOT NULL AND parsed_dest IS NOT NULL THEN
          -- Use parsed info from observacoes
          UPDATE movimentacoes SET
            empresa_origem_nome = parsed_origin,
            empresa_destino_nome = parsed_dest
          WHERE id = mov.id;
          IF parsed_origin NOT ILIKE '%tacom%' THEN
            last_client_location := parsed_origin;
          END IF;
          current_location := parsed_dest;
        ELSE
          -- Infer destination
          IF current_location IS NOT NULL AND current_location ILIKE '%tacom%' THEN
            -- At TACOM, going to client
            dest := COALESCE(last_client_location, mov.equip_current_company);
            IF dest ILIKE '%tacom%' AND dest = current_location THEN
              -- Try old_dest
              dest := COALESCE(NULLIF(mov.old_dest, current_location), mov.equip_current_company);
            END IF;
          ELSE
            -- At client, going somewhere (likely TACOM or another client)
            IF mov.old_dest IS NOT NULL AND mov.old_dest != current_location THEN
              dest := mov.old_dest;
            ELSE
              dest := 'TACOM SISTEMAS POA';
            END IF;
          END IF;
          
          UPDATE movimentacoes SET
            empresa_origem_nome = current_location,
            empresa_destino_nome = dest
          WHERE id = mov.id;
          
          IF current_location IS NOT NULL AND current_location NOT ILIKE '%tacom%' THEN
            last_client_location := current_location;
          END IF;
          current_location := dest;
        END IF;
        IF current_location IS NOT NULL AND current_location NOT ILIKE '%tacom%' THEN
          last_client_location := current_location;
        END IF;
        
      ELSIF mov.tipo_movimento = 'saida' THEN
        UPDATE movimentacoes SET
          empresa_origem_nome = current_location,
          empresa_destino_nome = 'Saída do sistema'
        WHERE id = mov.id;
        
      END IF;
    END LOOP;
  END LOOP;
END $$;
