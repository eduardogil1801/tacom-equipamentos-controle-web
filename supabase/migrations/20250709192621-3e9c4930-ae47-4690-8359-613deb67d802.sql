-- Atualizar registros existentes que estão como "Sistema" para usar o usuário logado atual
UPDATE movimentacoes 
SET usuario_responsavel = public.get_user_full_name(auth.uid())
WHERE usuario_responsavel = 'Sistema' AND auth.uid() IS NOT NULL;

-- Se não conseguir obter o usuário atual, manter como estava
-- Isso garante que registros antigos sejam atualizados apenas quando há um usuário logado

-- Verificar se a função get_user_full_name está funcionando corretamente
-- e criar uma versão melhorada que sempre tenta obter o usuário logado
CREATE OR REPLACE FUNCTION public.get_user_full_name_improved(user_id uuid DEFAULT auth.uid())
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  full_name text;
BEGIN
  -- Primeiro tenta com o user_id fornecido
  IF user_id IS NOT NULL THEN
    SELECT nome || ' ' || sobrenome 
    INTO full_name
    FROM public.usuarios 
    WHERE id = user_id;
  END IF;
  
  -- Se não encontrou, tenta com auth.uid()
  IF full_name IS NULL THEN
    SELECT nome || ' ' || sobrenome 
    INTO full_name
    FROM public.usuarios 
    WHERE id = auth.uid();
  END IF;
  
  RETURN COALESCE(full_name, 'Usuário não identificado');
END;
$function$;

-- Atualizar a função do trigger para usar a versão melhorada
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_v5()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  empresa_origem_nome text;
  empresa_destino_nome text;
  current_user_name text;
BEGIN
  -- Sempre obter nome completo do usuário atual usando a função melhorada
  SELECT public.get_user_full_name_improved() INTO current_user_name;
  
  -- Fallback final (não deveria acontecer com a função melhorada)
  IF current_user_name IS NULL OR current_user_name = '' THEN
    current_user_name := 'Usuário não identificado';
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

-- Remover trigger antigo e aplicar o novo
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao_v4 ON equipamentos;

-- Criar novo trigger com a função v5
CREATE TRIGGER trigger_registrar_movimentacao_v5
  AFTER INSERT OR UPDATE ON equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_movimentacao_v5();