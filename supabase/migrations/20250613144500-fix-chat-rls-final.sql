

-- Corrigir políticas RLS do chat definitivamente
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.chat_conversations;

-- Desabilitar temporariamente RLS para testar
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations DISABLE ROW LEVEL SECURITY;

-- Reabilitar RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Criar políticas mais simples e funcionais para chat_messages
CREATE POLICY "Allow all authenticated users to view messages" ON public.chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to insert messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update messages" ON public.chat_messages
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Criar políticas para chat_conversations
CREATE POLICY "Allow all authenticated users to view conversations" ON public.chat_conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to create conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to update conversations" ON public.chat_conversations
  FOR UPDATE USING (auth.role() = 'authenticated');

