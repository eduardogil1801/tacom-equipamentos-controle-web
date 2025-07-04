-- Corrigir função trigger para não mostrar IDs técnicos e usar usuário logado como responsável
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_v2()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
DECLARE
  empresa_origem_nome text;
  empresa_destino_nome text;
  current_user_name text;
BEGIN
  -- Obter nome do usuário atual (se logado)
  SELECT COALESCE(nome || ' ' || sobrenome, 'Sistema') 
  INTO current_user_name
  FROM usuarios 
  WHERE id = auth.uid();
  
  -- Se não encontrou usuário, usar 'Sistema'
  IF current_user_name IS NULL THEN
    current_user_name := 'Sistema';
  END IF;

  -- Se é um INSERT, registra entrada
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.movimentacoes (id_equipamento, tipo_movimento, data_movimento, observacoes, usuario_responsavel)
    VALUES (NEW.id, 'entrada', NEW.data_entrada, 'Entrada automática do equipamento', current_user_name);
    RETURN NEW;
  END IF;
  
  -- Se é um UPDATE e empresa mudou, registra movimentação
  IF TG_OP = 'UPDATE' AND OLD.id_empresa != NEW.id_empresa THEN
    -- Buscar nomes das empresas
    SELECT name INTO empresa_origem_nome FROM empresas WHERE id = OLD.id_empresa;
    SELECT name INTO empresa_destino_nome FROM empresas WHERE id = NEW.id_empresa;
    
    INSERT INTO public.movimentacoes (id_equipamento, tipo_movimento, data_movimento, observacoes, usuario_responsavel)
    VALUES (NEW.id, 'movimentacao', CURRENT_DATE, 
            CONCAT('Movimentado de ', COALESCE(empresa_origem_nome, 'empresa não identificada'), ' para ', COALESCE(empresa_destino_nome, 'empresa não identificada')), 
            current_user_name);
    RETURN NEW;
  END IF;
  
  -- Se é um UPDATE e data_saida foi alterada, registra saída
  IF TG_OP = 'UPDATE' AND OLD.data_saida IS NULL AND NEW.data_saida IS NOT NULL THEN
    INSERT INTO public.movimentacoes (id_equipamento, tipo_movimento, data_movimento, observacoes, usuario_responsavel)
    VALUES (NEW.id, 'saida', NEW.data_saida, 'Saída automática do equipamento', current_user_name);
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$function$;