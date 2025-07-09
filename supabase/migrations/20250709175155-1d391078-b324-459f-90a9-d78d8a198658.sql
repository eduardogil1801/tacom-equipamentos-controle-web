-- Corrigir função para ter search_path seguro
CREATE OR REPLACE FUNCTION public.get_user_full_name(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  full_name text;
BEGIN
  SELECT nome || ' ' || sobrenome 
  INTO full_name
  FROM public.usuarios 
  WHERE id = user_id;
  
  RETURN COALESCE(full_name, 'Sistema');
END;
$$;