
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Users, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChat } from '@/hooks/useChat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ChatFloat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    conversations,
    users,
    selectedUser,
    unreadCount,
    sendMessage,
    startConversation,
    setSelectedUser
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser) return;
    
    console.log('Sending message from ChatFloat:', { selectedUser: selectedUser.id, content: messageText });
    await sendMessage(selectedUser.id, messageText);
    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setSelectedUser(null);
    setIsMinimized(false);
  };

  const handleConversationClick = (user: any) => {
    startConversation(user);
    // Não fechar o chat, apenas carregar a conversa
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  return (
    <>
      {/* Botão flutuante - só aparece quando não há conversa ativa ou chat fechado */}
      {(!selectedUser || !isOpen) && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-300 transform hover:scale-105"
            size="icon"
          >
            <MessageCircle className="h-6 w-6 text-white" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-orange-500 text-white text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Janela do chat */}
      {isOpen && (
        <div className={`fixed right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'h-12' : 'h-96 md:h-[500px]'
        } w-80 md:w-96`}
        style={{ 
          bottom: selectedUser ? '6px' : '90px'
        }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              {selectedUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="h-8 w-8 text-white hover:bg-white/20 mr-2"
                >
                  ←
                </Button>
              )}
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">
                {selectedUser ? `${selectedUser.nome} ${selectedUser.sobrenome}` : 'Chat'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseChat}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conteúdo */}
          {!isMinimized && (
            <div className="h-full flex flex-col">
              {selectedUser ? (
                // Área de conversa
                <div className="flex flex-col h-full">
                  {/* Mensagens */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === selectedUser.id ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.sender_id === selectedUser.id
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === selectedUser.id ? 'text-gray-500' : 'text-red-100'
                            }`}>
                              {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input de mensagem */}
                  <div className="p-4 border-t bg-white rounded-b-lg">
                    <div className="flex space-x-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        size="icon"
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Lista de conversas e usuários
                <Tabs defaultValue="conversations" className="h-full flex flex-col">
                  <TabsList className="mx-4 mt-4">
                    <TabsTrigger value="conversations">Conversas</TabsTrigger>
                    <TabsTrigger value="users">
                      <Users className="h-4 w-4 mr-2" />
                      Usuários
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="conversations" className="flex-1 mt-4">
                    <ScrollArea className="h-full px-4">
                      {conversations.length > 0 ? (
                        <div className="space-y-2">
                          {conversations.map((conversation) => (
                            <div
                              key={conversation.id}
                              onClick={() => handleConversationClick(conversation.other_user)}
                              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <Avatar className="h-10 w-10 bg-gradient-to-r from-red-500 to-red-600">
                                <span className="text-white font-medium">
                                  {conversation.other_user.nome[0]}{conversation.other_user.sobrenome[0]}
                                </span>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {conversation.other_user.nome} {conversation.other_user.sobrenome}
                                </p>
                                {conversation.last_message && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {conversation.last_message.content}
                                  </p>
                                )}
                              </div>
                              {conversation.unread_count > 0 && (
                                <Badge className="bg-red-500 text-white">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <MessageCircle className="h-12 w-12 mb-2" />
                          <p className="text-sm">Nenhuma conversa ainda</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="users" className="flex-1 mt-4">
                    <ScrollArea className="h-full px-4">
                      <div className="space-y-2">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => handleConversationClick(user)}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <Avatar className="h-10 w-10 bg-gradient-to-r from-red-500 to-red-600">
                              <span className="text-white font-medium">
                                {user.nome[0]}{user.sobrenome[0]}
                              </span>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {user.nome} {user.sobrenome}
                              </p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatFloat;
