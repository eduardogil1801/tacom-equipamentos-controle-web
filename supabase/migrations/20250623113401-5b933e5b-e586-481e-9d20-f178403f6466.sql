
-- Corrigir função get_current_user_id com search_path seguro
CREATE OR REPLACE FUNCTION public.get_current_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN auth.uid();
END;
$function$;

-- Corrigir função registrar_movimentacao_v2 com search_path seguro
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_v2()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  -- Se é um INSERT, registra entrada
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.movimentacoes (id_equipamento, tipo_movimento, data_movimento, observacoes, usuario_responsavel)
    VALUES (NEW.id, 'entrada', NEW.data_entrada, 'Entrada automática do equipamento', 'Sistema');
    RETURN NEW;
  END IF;
  
  -- Se é um UPDATE e empresa mudou, registra movimentação
  IF TG_OP = 'UPDATE' AND OLD.id_empresa != NEW.id_empresa THEN
    INSERT INTO public.movimentacoes (id_equipamento, tipo_movimento, data_movimento, observacoes, usuario_responsavel)
    VALUES (NEW.id, 'movimentacao', CURRENT_DATE, 
            CONCAT('Movimentado de empresa ID: ', OLD.id_empresa, ' para empresa ID: ', NEW.id_empresa), 
            'Sistema');
    RETURN NEW;
  END IF;
  
  -- Se é um UPDATE e data_saida foi alterada, registra saída
  IF TG_OP = 'UPDATE' AND OLD.data_saida IS NULL AND NEW.data_saida IS NOT NULL THEN
    INSERT INTO public.movimentacoes (id_equipamento, tipo_movimento, data_movimento, observacoes, usuario_responsavel)
    VALUES (NEW.id, 'saida', NEW.data_saida, 'Saída automática do equipamento', 'Sistema');
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Corrigir função update_conversation_timestamp com search_path seguro
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  -- Atualizar ou criar conversa
  INSERT INTO public.chat_conversations (user1_id, user2_id, last_message_at)
  VALUES (
    LEAST(NEW.sender_id, NEW.receiver_id),
    GREATEST(NEW.sender_id, NEW.receiver_id),
    NEW.created_at
  )
  ON CONFLICT (user1_id, user2_id)
  DO UPDATE SET last_message_at = NEW.created_at;
  
  RETURN NEW;
END;
$function$;

-- Corrigir função registrar_movimentacao com search_path seguro
CREATE OR REPLACE FUNCTION public.registrar_movimentacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  -- Se é um INSERT, registra entrada
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.movimentacoes (id_equipamento, tipo_movimento, data_movimento, observacoes)
    VALUES (NEW.id, 'entrada', NEW.data_entrada, 'Entrada automática do equipamento');
    RETURN NEW;
  END IF;
  
  -- Se é um UPDATE e data_saida foi alterada, registra saída
  IF TG_OP = 'UPDATE' AND OLD.data_saida IS NULL AND NEW.data_saida IS NOT NULL THEN
    INSERT INTO public.movimentacoes (id_equipamento, tipo_movimento, data_movimento, observacoes)
    VALUES (NEW.id, 'saida', NEW.data_saida, 'Saída automática do equipamento');
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$function$;
