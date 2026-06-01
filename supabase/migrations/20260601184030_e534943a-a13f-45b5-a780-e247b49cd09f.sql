
-- Fix: Function Search Path Mutable + restrict SECURITY DEFINER execute to service_role
-- Functions: get_current_user_id, get_user_full_name, get_user_full_name_improved, handle_new_user
-- (others already SET search_path TO 'public')

-- 1. Ensure search_path is set on all SECURITY DEFINER functions (already done for most; recreate explicitly safe)
ALTER FUNCTION public.get_current_user_id() SET search_path = '';
ALTER FUNCTION public.get_user_full_name(uuid) SET search_path = '';
ALTER FUNCTION public.get_user_full_name_improved(uuid) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.registrar_movimentacao() SET search_path = 'public';
ALTER FUNCTION public.registrar_movimentacao_v2() SET search_path = 'public';
ALTER FUNCTION public.registrar_movimentacao_v3() SET search_path = 'public';
ALTER FUNCTION public.registrar_movimentacao_v4() SET search_path = 'public';
ALTER FUNCTION public.registrar_movimentacao_v5() SET search_path = 'public';
ALTER FUNCTION public.update_conversation_timestamp() SET search_path = 'public';
ALTER FUNCTION public.calculate_frota_totals() SET search_path = 'public';

-- 2. Revoke EXECUTE from anon and authenticated on SECURITY DEFINER functions
-- These functions are not meant to be called directly from the client
REVOKE EXECUTE ON FUNCTION public.get_current_user_id() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_full_name(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_full_name_improved(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_full_name(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_full_name_improved(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
