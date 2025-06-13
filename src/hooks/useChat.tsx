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

  const playNotificationSound = () => {
    try {
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

  const showBrowserNotification = (message: string) => {
    const originalTitle = document.title;
    document.title = '💬 Nova mensagem - TACOM';
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 5000);

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
    if (user?.id) {
      console.log('Inicializando chat para usuário:', user.id);
      loadUsers();
      loadConversations();
      subscribeToMessages();
    }

    return () => {
      if (channelRef.current) {
        console.log('Removendo canal de chat');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  const loadUsers = async () => {
    try {
      console.log('Carregando usuários para chat...');
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, sobrenome, email, ativo')
        .eq('ativo', true)
        .neq('id', user?.id);

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        throw error;
      }
      
      console.log('Usuários carregados:', data?.length || 0);
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários para chat",
        variant: "destructive",
      });
    }
  };

  const loadConversations = async () => {
    if (!user?.id) {
      console.log('Usuário não encontrado para carregar conversas');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Carregando conversas para usuário:', user.id);
      
      const { data: conversationsData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (convError) {
        console.error('Erro ao carregar conversas:', convError);
        throw convError;
      }

      console.log('Conversas encontradas:', conversationsData?.length || 0);

      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
          
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('id, nome, sobrenome, email, ativo')
            .eq('id', otherUserId)
            .single();

          if (userError) {
            console.error('Erro ao carregar dados do usuário:', userError);
            return null;
          }

          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

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
      
      const totalUnread = validConversations.reduce((sum, conv) => sum + conv.unread_count, 0);
      setUnreadCount(totalUnread);
      
      console.log('Conversas processadas:', validConversations.length, 'Total não lidas:', totalUnread);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conversas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user?.id) {
      console.log('Usuário não encontrado para carregar mensagens');
      return;
    }
    
    try {
      console.log('Carregando mensagens entre:', user.id, 'e', otherUserId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        throw error;
      }
      
      console.log('Mensagens carregadas:', data?.length || 0);
      setMessages(data || []);

      await markMessagesAsRead(otherUserId);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user?.id) {
      console.error('Usuário não autenticado ao tentar enviar mensagem');
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      console.error('Conteúdo da mensagem vazio');
      return;
    }

    try {
      console.log('Enviando mensagem:', { sender: user.id, receiver: receiverId, content: content.substring(0, 50) + '...' });
      
      // Verificar se o usuário está autenticado no Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Sessão não encontrada');
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      const messageData = {
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
        is_read: false
      };

      console.log('Dados da mensagem a serem inseridos:', messageData);

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado ao inserir mensagem:', error);
        throw error;
      }

      console.log('Mensagem enviada com sucesso:', data.id);
      
      setMessages(prev => [...prev, data]);
      
      await createOrUpdateConversation(receiverId);
      await loadConversations();
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const createOrUpdateConversation = async (otherUserId: string) => {
    if (!user?.id) return;

    try {
      const user1Id = user.id < otherUserId ? user.id : otherUserId;
      const user2Id = user.id < otherUserId ? otherUserId : user.id;

      console.log('Criando/atualizando conversa entre:', user1Id, 'e', user2Id);

      const { error } = await supabase
        .from('chat_conversations')
        .upsert({
          user1_id: user1Id,
          user2_id: user2Id,
          last_message_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao criar/atualizar conversa:', error);
      } else {
        console.log('Conversa criada/atualizada com sucesso');
      }
    } catch (error) {
      console.error('Erro em createOrUpdateConversation:', error);
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!user?.id) return;
    
    try {
      console.log('Marcando mensagens como lidas de:', senderId, 'para:', user.id);
      
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
      } else {
        console.log('Mensagens marcadas como lidas');
        loadConversations();
      }
      
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!user?.id || channelRef.current) {
      console.log('Não é possível subscrever:', !user?.id ? 'usuário não encontrado' : 'canal já existe');
      return;
    }
    
    console.log('Inscrevendo-se para receber mensagens em tempo real para usuário:', user.id);
    
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
          console.log('Nova mensagem recebida em tempo real:', payload.new);
          
          playNotificationSound();
          showBrowserNotification(payload.new.content);
          
          if (selectedUser && payload.new.sender_id === selectedUser.id) {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
            markMessagesAsRead(selectedUser.id);
          } else {
            toast({
              title: "Nova mensagem",
              description: "Você recebeu uma nova mensagem no chat.",
            });
          }
          
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
          console.log('Confirmação de mensagem enviada:', payload.new);
          
          if (selectedUser && payload.new.receiver_id === selectedUser.id) {
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === payload.new.id);
              if (!exists) {
                return [...prev, payload.new as ChatMessage];
              }
              return prev;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Status da inscrição do chat:', status);
      });
  };

  const startConversation = (targetUser: ChatUser) => {
    console.log('Iniciando conversa com:', targetUser.nome, targetUser.sobrenome);
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
