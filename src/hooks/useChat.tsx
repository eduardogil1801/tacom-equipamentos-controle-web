import { useState, useEffect, useRef } from 'react';
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
  const channelRef = useRef<any>(null);

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      // Criar um som usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Não foi possível reproduzir som de notificação:', error);
    }
  };

  // Função para mostrar notificação na aba do navegador
  const showBrowserNotification = (message: string) => {
    // Alterar o título da aba
    const originalTitle = document.title;
    document.title = '💬 Nova mensagem - TACOM';
    
    // Restaurar título original após 5 segundos
    setTimeout(() => {
      document.title = originalTitle;
    }, 5000);

    // Tentar mostrar notificação do navegador se permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nova mensagem no chat', {
        body: message,
        icon: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Nova mensagem no chat', {
            body: message,
            icon: '/favicon.ico'
          });
        }
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadUsers();
      loadConversations();
      subscribeToMessages();
    }

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-runs

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
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Buscar conversas onde o usuário atual participa
      const { data: conversationsData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      // Para cada conversa, buscar o outro usuário e a última mensagem
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
          
          // Buscar dados do outro usuário
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('id, nome, sobrenome, email, ativo')
            .eq('id', otherUserId)
            .single();

          if (userError) {
            console.error('Error loading user data:', userError);
            return null;
          }

          // Buscar última mensagem
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Contar mensagens não lidas
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', otherUserId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          return {
            ...conv,
            other_user: userData,
            last_message: lastMessage || null,
            unread_count: unreadCount || 0
          };
        })
      );

      const validConversations = conversationsWithDetails.filter(conv => conv !== null) as Conversation[];
      setConversations(validConversations);
      
      // Calcular total de mensagens não lidas
      const totalUnread = validConversations.reduce((sum, conv) => sum + conv.unread_count, 0);
      setUnreadCount(totalUnread);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
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
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Sending message:', { sender_id: user.id, receiver_id: receiverId, content });
      
      const messageData = {
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim()
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);
      
      // Adicionar mensagem imediatamente à lista local
      setMessages(prev => [...prev, data]);
      
      // Criar ou atualizar conversa
      await createOrUpdateConversation(receiverId);
      
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

  const createOrUpdateConversation = async (otherUserId: string) => {
    if (!user?.id) return;

    try {
      const user1Id = user.id < otherUserId ? user.id : otherUserId;
      const user2Id = user.id < otherUserId ? otherUserId : user.id;

      const { error } = await supabase
        .from('chat_conversations')
        .upsert({
          user1_id: user1Id,
          user2_id: user2Id,
          last_message_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating/updating conversation:', error);
      }
    } catch (error) {
      console.error('Error in createOrUpdateConversation:', error);
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Atualizar contador de não lidas
      loadConversations();
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!user?.id || channelRef.current) return;
    
    channelRef.current = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          
          // Tocar som de notificação
          playNotificationSound();
          
          // Mostrar notificação na aba
          showBrowserNotification(payload.new.content);
          
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
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Message sent confirmation:', payload);
          
          // Se é para o usuário selecionado, garantir que está na lista
          if (selectedUser && payload.new.receiver_id === selectedUser.id) {
            setMessages(prev => {
              // Verificar se a mensagem já existe para evitar duplicatas
              const exists = prev.some(msg => msg.id === payload.new.id);
              if (!exists) {
                return [...prev, payload.new as ChatMessage];
              }
              return prev;
            });
          }
        }
      )
      .subscribe();
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
