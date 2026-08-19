
-- 1. Link app users to Supabase Auth accounts
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

CREATE OR REPLACE FUNCTION public.current_usuario_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.usuarios u ON u.id = up.user_id
    WHERE u.auth_user_id = auth.uid() AND up.user_type = 'administrador'
  )
$$;

-- 2. usuarios: no anon access, no password column exposure
DROP POLICY IF EXISTS "Permitir todas as operações de DELETE em usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir todas as operações de INSERT em usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir todas as operações de SELECT em usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir todas as operações de UPDATE em usuarios" ON public.usuarios;

REVOKE ALL ON public.usuarios FROM anon, authenticated;
GRANT SELECT (id, nome, sobrenome, email, username, ativo, data_criacao, data_atualizacao, must_change_password, is_temp_password, auth_user_id) ON public.usuarios TO authenticated;
GRANT UPDATE (nome, sobrenome, email, username, ativo, data_atualizacao) ON public.usuarios TO authenticated;
GRANT INSERT, DELETE ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;

CREATE POLICY "Authenticated users can view directory" ON public.usuarios
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own record or admins update any" ON public.usuarios
  FOR UPDATE TO authenticated USING (id = public.current_usuario_id() OR public.is_admin())
  WITH CHECK (id = public.current_usuario_id() OR public.is_admin());
CREATE POLICY "Admins can create users" ON public.usuarios
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete users" ON public.usuarios
  FOR DELETE TO authenticated USING (public.is_admin());

-- 3. Business tables: authenticated only
DROP POLICY IF EXISTS "Permitir todas as operações de DELETE em empresas" ON public.empresas;
DROP POLICY IF EXISTS "Permitir todas as operações de INSERT em empresas" ON public.empresas;
DROP POLICY IF EXISTS "Permitir todas as operações de SELECT em empresas" ON public.empresas;
DROP POLICY IF EXISTS "Permitir todas as operações de UPDATE em empresas" ON public.empresas;
DROP POLICY IF EXISTS "Permitir todas as operações de DELETE em equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Permitir todas as operações de INSERT em equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Permitir todas as operações de SELECT em equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Permitir todas as operações de UPDATE em equipamentos" ON public.equipamentos;
DROP POLICY IF EXISTS "Permitir todas as operações de DELETE em movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Permitir todas as operações de INSERT em movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Permitir todas as operações de SELECT em movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Permitir todas as operações de UPDATE em movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Allow delete on frota" ON public.frota;
DROP POLICY IF EXISTS "Allow insert on frota" ON public.frota;
DROP POLICY IF EXISTS "Allow select on frota" ON public.frota;
DROP POLICY IF EXISTS "Allow update on frota" ON public.frota;
DROP POLICY IF EXISTS "Authenticated users can manage frota data" ON public.frota;
DROP POLICY IF EXISTS "Everyone can view frota data" ON public.frota;
DROP POLICY IF EXISTS "Anyone can view estados" ON public.estados;
DROP POLICY IF EXISTS "Authenticated users can manage estados" ON public.estados;
DROP POLICY IF EXISTS "Anyone can view tipos_equipamento" ON public.tipos_equipamento;
DROP POLICY IF EXISTS "Authenticated users can manage tipos_equipamento" ON public.tipos_equipamento;
DROP POLICY IF EXISTS "Permitir atualização de tipos de manutenção" ON public.tipos_manutencao;
DROP POLICY IF EXISTS "Permitir exclusão de tipos de manutenção" ON public.tipos_manutencao;
DROP POLICY IF EXISTS "Permitir inserção de tipos de manutenção" ON public.tipos_manutencao;
DROP POLICY IF EXISTS "Permitir leitura de tipos de manutenção" ON public.tipos_manutencao;
DROP POLICY IF EXISTS "Todos podem visualizar categorias" ON public.categorias_manutencao;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar categorias" ON public.categorias_manutencao;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['empresas','equipamentos','movimentacoes','frota','estados','tipos_equipamento','tipos_manutencao','categorias_manutencao'] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Authenticated users can manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- 4. Roles and permissions: readable by authenticated, writable by admins
DROP POLICY IF EXISTS "Users can manage profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can manage permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.user_permissions;

REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.user_permissions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.user_permissions TO service_role;

CREATE POLICY "Authenticated can view profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage profiles" ON public.user_profiles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Authenticated can view permissions" ON public.user_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage permissions" ON public.user_permissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Chat: scope to the signed-in app user
DROP POLICY IF EXISTS "Users can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;

REVOKE ALL ON public.chat_conversations FROM anon;
REVOKE ALL ON public.chat_messages FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
GRANT ALL ON public.chat_messages TO service_role;

CREATE POLICY "Participants view conversations" ON public.chat_conversations
  FOR SELECT TO authenticated USING (user1_id = public.current_usuario_id() OR user2_id = public.current_usuario_id());
CREATE POLICY "Participants create conversations" ON public.chat_conversations
  FOR INSERT TO authenticated WITH CHECK (user1_id = public.current_usuario_id() OR user2_id = public.current_usuario_id());
CREATE POLICY "Participants update conversations" ON public.chat_conversations
  FOR UPDATE TO authenticated USING (user1_id = public.current_usuario_id() OR user2_id = public.current_usuario_id());
CREATE POLICY "Participants view messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (sender_id = public.current_usuario_id() OR receiver_id = public.current_usuario_id());
CREATE POLICY "Senders create messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = public.current_usuario_id());
CREATE POLICY "Receivers update messages" ON public.chat_messages
  FOR UPDATE TO authenticated USING (receiver_id = public.current_usuario_id());

-- 6. Settings and login profile: owner only, authenticated role
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.configuracoes;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.login;
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.login;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.login;

REVOKE ALL ON public.configuracoes FROM anon;
REVOKE ALL ON public.login FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.login TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
GRANT ALL ON public.login TO service_role;

CREATE POLICY "Users manage own settings" ON public.configuracoes
  FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Users view own login profile" ON public.login
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users create own login profile" ON public.login
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own login profile" ON public.login
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- 7. maintenance_rules already authenticated-scoped; ensure no anon grants
REVOKE ALL ON public.maintenance_rules FROM anon;
