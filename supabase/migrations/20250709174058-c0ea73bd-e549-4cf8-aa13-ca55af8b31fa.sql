-- Atualizar registros existentes que têm username para nome completo
UPDATE movimentacoes 
SET usuario_responsavel = (
  SELECT nome || ' ' || sobrenome 
  FROM usuarios 
  WHERE username = movimentacoes.usuario_responsavel
)
WHERE usuario_responsavel IN (
  SELECT username FROM usuarios WHERE usuarios.username = movimentacoes.usuario_responsavel
);

-- Atualizar registros que têm 'N/A' e foram criados por usuários logados
UPDATE movimentacoes 
SET usuario_responsavel = COALESCE(
  (SELECT nome || ' ' || sobrenome FROM usuarios WHERE id = auth.uid()),
  'Sistema'
)
WHERE usuario_responsavel = 'N/A' OR usuario_responsavel IS NULL;

-- Criar função para obter nome completo do usuário
CREATE OR REPLACE FUNCTION public.get_user_full_name(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  full_name text;
BEGIN
  SELECT nome || ' ' || sobrenome 
  INTO full_name
  FROM usuarios 
  WHERE id = user_id;
  
  RETURN COALESCE(full_name, 'Sistema');
END;
$$;

-- Atualizar a função de trigger para usar nome completo
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  empresa_origem_nome text;
  empresa_destino_nome text;
  current_user_name text;
BEGIN
  -- Obter nome completo do usuário atual (se logado)
  SELECT public.get_user_full_name(auth.uid()) INTO current_user_name;
  
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