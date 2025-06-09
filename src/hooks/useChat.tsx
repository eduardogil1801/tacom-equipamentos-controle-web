
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface ChatUser {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  ativo: boolean;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  other_user: ChatUser;
  last_message: ChatMessage | null;
  unread_count: number;
}

export const useChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUsers();
      loadConversations();
      subscribeToMessages();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, sobrenome, email, ativo')
        .eq('ativo', true)
        .neq('id', user?.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      // Buscar conversas
      const { data: conversationsData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      // Para cada conversa, buscar o outro usuário e a última mensagem
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
          
          // Buscar dados do outro usuário
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('id, nome, sobrenome, email, ativo')
            .eq('id', otherUserId)
            .single();

          if (userError) throw userError;

          // Buscar última mensagem
          const { data: lastMessage, error: msgError } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Contar mensagens não lidas
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', otherUserId)
            .eq('receiver_id', user?.id)
            .eq('is_read', false);

          return {
            ...conv,
            other_user: userData,
            last_message: lastMessage || null,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
      
      // Calcular total de mensagens não lidas
      const totalUnread = conversationsWithDetails.reduce((sum, conv) => sum + conv.unread_count, 0);
      setUnreadCount(totalUnread);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Marcar mensagens como lidas
      await markMessagesAsRead(otherUserId);
      
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user?.id,
          receiver_id: receiverId,
          content: content.trim()
        });

      if (error) throw error;
      
      // Recarregar conversas para atualizar a lista
      loadConversations();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Atualizar contador de não lidas
      loadConversations();
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          
          // Se é para o usuário selecionado, adicionar à lista de mensagens
          if (selectedUser && payload.new.sender_id === selectedUser.id) {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
            markMessagesAsRead(selectedUser.id);
          } else {
            // Mostrar notificação
            toast({
              title: "Nova mensagem",
              description: "Você recebeu uma nova mensagem no chat.",
            });
          }
          
          // Recarregar conversas
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Message sent:', payload);
          
          // Se é para o usuário selecionado, adicionar à lista de mensagens
          if (selectedUser && payload.new.receiver_id === selectedUser.id) {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startConversation = (targetUser: ChatUser) => {
    setSelectedUser(targetUser);
    loadMessages(targetUser.id);
  };

  return {
    messages,
    conversations,
    users,
    loading,
    selectedUser,
    unreadCount,
    loadMessages,
    sendMessage,
    startConversation,
    setSelectedUser,
    loadConversations
  };
};
