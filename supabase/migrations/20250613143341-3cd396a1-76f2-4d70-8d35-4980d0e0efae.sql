
-- Aplicar as correções das políticas RLS do chat
-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.chat_conversations;

-- Habilitar RLS nas tabelas de chat
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Criar função para obter ID do usuário atual de forma segura
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Políticas CORRIGIDAS para chat_messages
CREATE POLICY "Users can view their own messages" ON public.chat_messages
  FOR SELECT USING (
    sender_id = get_current_user_id() OR 
    receiver_id = get_current_user_id()
  );

CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = get_current_user_id()
  );

CREATE POLICY "Users can update their received messages" ON public.chat_messages
  FOR UPDATE USING (
    receiver_id = get_current_user_id()
  );

-- Políticas CORRIGIDAS para chat_conversations
CREATE POLICY "Users can view their conversations" ON public.chat_conversations
  FOR SELECT USING (
    user1_id = get_current_user_id() OR 
    user2_id = get_current_user_id()
  );

CREATE POLICY "Users can create conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (
    user1_id = get_current_user_id() OR 
    user2_id = get_current_user_id()
  );

CREATE POLICY "Users can update conversations" ON public.chat_conversations
  FOR UPDATE USING (
    user1_id = get_current_user_id() OR 
    user2_id = get_current_user_id()
  );
