
-- Enable Row Level Security on chat tables
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_messages
-- Users can view messages where they are either sender or receiver
CREATE POLICY "Users can view their own messages" 
  ON public.chat_messages 
  FOR SELECT 
  USING (
    sender_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid()) OR 
    receiver_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid())
  );

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (
    sender_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid())
  );

-- Users can update messages where they are the receiver (for marking as read)
CREATE POLICY "Users can update received messages" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (
    receiver_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid())
  );

-- Create policies for chat_conversations
-- Users can view conversations where they are either user1 or user2
CREATE POLICY "Users can view their conversations" 
  ON public.chat_conversations 
  FOR SELECT 
  USING (
    user1_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid()) OR 
    user2_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid())
  );

-- Users can create conversations where they are one of the participants
CREATE POLICY "Users can create conversations" 
  ON public.chat_conversations 
  FOR INSERT 
  WITH CHECK (
    user1_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid()) OR 
    user2_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid())
  );

-- Users can update conversations where they are one of the participants
CREATE POLICY "Users can update their conversations" 
  ON public.chat_conversations 
  FOR UPDATE 
  USING (
    user1_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid()) OR 
    user2_id IN (SELECT id FROM public.usuarios WHERE id = auth.uid())
  );
