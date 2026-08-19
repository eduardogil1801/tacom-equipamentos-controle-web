GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_manutencao TO authenticated;
GRANT ALL ON public.categorias_manutencao TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamentos TO authenticated;
GRANT ALL ON public.equipamentos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estados TO authenticated;
GRANT ALL ON public.estados TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.frota TO authenticated;
GRANT ALL ON public.frota TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.login TO authenticated;
GRANT ALL ON public.login TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_rules TO authenticated;
GRANT ALL ON public.maintenance_rules TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes TO authenticated;
GRANT ALL ON public.movimentacoes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_equipamento TO authenticated;
GRANT ALL ON public.tipos_equipamento TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_manutencao TO authenticated;
GRANT ALL ON public.tipos_manutencao TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

GRANT SELECT (id, nome, sobrenome, email, ativo, data_criacao, data_atualizacao, username, must_change_password, is_temp_password, auth_user_id) ON public.usuarios TO authenticated;
GRANT UPDATE (nome, sobrenome, email, ativo, data_atualizacao, username, must_change_password, is_temp_password) ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT EXECUTE ON FUNCTION public.current_usuario_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_full_name(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_full_name_improved(uuid) TO authenticated, service_role;