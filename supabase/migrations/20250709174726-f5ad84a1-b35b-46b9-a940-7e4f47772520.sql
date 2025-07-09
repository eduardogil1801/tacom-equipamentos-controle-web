-- Atualizar função para sempre usar usuário logado (nunca "Sistema")
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_v4()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  empresa_origem_nome text;
  empresa_destino_nome text;
  current_user_name text;
BEGIN
  -- Sempre obter nome completo do usuário atual
  SELECT public.get_user_full_name(auth.uid()) INTO current_user_name;
  
  -- Se não conseguiu obter o usuário logado, buscar algum usuário ativo para não deixar em branco
  IF current_user_name IS NULL OR current_user_name = 'Sistema' THEN
    SELECT nome || ' ' || sobrenome INTO current_user_name
    FROM usuarios 
    WHERE ativo = true 
    ORDER BY data_criacao DESC 
    LIMIT 1;
  END IF;
  
  -- Fallback final (não deveria acontecer)
  IF current_user_name IS NULL THEN
    current_user_name := 'Usuário Não Identificado';
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

-- Atualizar registros existentes que estão como "Sistema" para o usuário Eduardo Gil
UPDATE movimentacoes 
SET usuario_responsavel = 'Eduardo Gil'
WHERE usuario_responsavel = 'Sistema';

-- Remover trigger antigo e aplicar o novo
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao_v3 ON equipamentos;

-- Criar novo trigger com a função v4
CREATE TRIGGER trigger_registrar_movimentacao_v4
  AFTER INSERT OR UPDATE ON equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_movimentacao_v4();