
-- Habilitar RLS nas tabelas de chat
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_messages
CREATE POLICY "Users can view their own messages" ON public.chat_messages
  FOR SELECT USING (
    sender_id IN (SELECT id FROM public.usuarios WHERE id = sender_id) OR
    receiver_id IN (SELECT id FROM public.usuarios WHERE id = receiver_id)
  );

CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM public.usuarios WHERE id = sender_id)
  );

CREATE POLICY "Users can update their received messages" ON public.chat_messages
  FOR UPDATE USING (
    receiver_id IN (SELECT id FROM public.usuarios WHERE id = receiver_id)
  );

-- Políticas para chat_conversations
CREATE POLICY "Users can view their conversations" ON public.chat_conversations
  FOR SELECT USING (
    user1_id IN (SELECT id FROM public.usuarios WHERE id = user1_id) OR
    user2_id IN (SELECT id FROM public.usuarios WHERE id = user2_id)
  );

CREATE POLICY "Users can create conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (
    user1_id IN (SELECT id FROM public.usuarios WHERE id = user1_id) OR
    user2_id IN (SELECT id FROM public.usuarios WHERE id = user2_id)
  );

CREATE POLICY "Users can update conversations" ON public.chat_conversations
  FOR UPDATE USING (
    user1_id IN (SELECT id FROM public.usuarios WHERE id = user1_id) OR
    user2_id IN (SELECT id FROM public.usuarios WHERE id = user2_id)
  );
