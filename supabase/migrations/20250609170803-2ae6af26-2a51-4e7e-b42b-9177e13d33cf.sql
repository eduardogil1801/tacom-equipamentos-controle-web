
-- Remover as políticas existentes
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.chat_conversations;

-- Desabilitar RLS temporariamente (já que estamos usando autenticação customizada)
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations DISABLE ROW LEVEL SECURITY;

-- Alterar as colunas para referenciar a tabela usuarios ao invés de auth.users
ALTER TABLE public.chat_messages 
  DROP CONSTRAINT chat_messages_sender_id_fkey,
  DROP CONSTRAINT chat_messages_receiver_id_fkey;

ALTER TABLE public.chat_conversations
  DROP CONSTRAINT chat_conversations_user1_id_fkey,
  DROP CONSTRAINT chat_conversations_user2_id_fkey;

-- Adicionar novas foreign keys para a tabela usuarios
ALTER TABLE public.chat_messages 
  ADD CONSTRAINT chat_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.usuarios(id),
  ADD CONSTRAINT chat_messages_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES public.usuarios(id);

ALTER TABLE public.chat_conversations
  ADD CONSTRAINT chat_conversations_user1_id_fkey 
    FOREIGN KEY (user1_id) REFERENCES public.usuarios(id),
  ADD CONSTRAINT chat_conversations_user2_id_fkey 
    FOREIGN KEY (user2_id) REFERENCES public.usuarios(id);
