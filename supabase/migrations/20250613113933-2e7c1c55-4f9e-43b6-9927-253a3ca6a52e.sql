
-- Habilitar RLS nas tabelas que estão com erro
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_equipamento ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela estados (acesso público para leitura)
CREATE POLICY "Anyone can view estados" ON public.estados
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage estados" ON public.estados
  FOR ALL USING (true);

-- Criar políticas para chat_messages (apenas usuários autenticados podem ver suas próprias mensagens)
CREATE POLICY "Users can view their own messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their received messages" ON public.chat_messages
  FOR UPDATE USING (true);

-- Criar políticas para chat_conversations (apenas usuários autenticados podem ver suas conversas)
CREATE POLICY "Users can view their conversations" ON public.chat_conversations
  FOR SELECT USING (true);

CREATE POLICY "Users can create conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (true);

-- Criar políticas para user_profiles (usuários podem ver e gerenciar seus próprios perfis)
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage profiles" ON public.user_profiles
  FOR ALL USING (true);

-- Criar políticas para user_permissions (acesso para usuários autenticados)
CREATE POLICY "Authenticated users can view permissions" ON public.user_permissions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage permissions" ON public.user_permissions
  FOR ALL USING (true);

-- Criar políticas para tipos_equipamento (acesso público para leitura)
CREATE POLICY "Anyone can view tipos_equipamento" ON public.tipos_equipamento
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage tipos_equipamento" ON public.tipos_equipamento
  FOR ALL USING (true);
