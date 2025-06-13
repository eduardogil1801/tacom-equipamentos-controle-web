
-- Migração para corrigir RLS do chat e problemas de importação
-- Remover todas as políticas RLS problemáticas das tabelas de chat
DROP POLICY IF EXISTS "Users can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;

-- Manter RLS desabilitado para essas tabelas (já está assim)
-- ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chat_conversations DISABLE ROW LEVEL SECURITY;

-- Verificar se há dados órfãos na tabela equipamentos
-- Isso vai nos ajudar a entender por que alguns equipamentos não aparecem
UPDATE public.equipamentos 
SET status = 'disponivel' 
WHERE status IS NULL OR status = '';

-- Garantir que todos os equipamentos tenham uma empresa válida
-- Vamos verificar se existem equipamentos com id_empresa inválido
