'use client';

import { useState, useMemo } from 'react';
import { MessageCircle, X, Minus, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { hasPermission } from '@/lib/permissions';
import { useAppSelector, RootState } from '@/store';
import { useGetUserConversationsQuery, useGetAdminConversationsQuery, useGetConversationQuery, useAddMessageMutation } from '@/store/services/chatApi';
import { useGetUsersQuery } from '@/store/services/userApi';

interface Message {
  id: number;
  sender: 'user' | 'support';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  unreadCount: number;
  lastMessage: string;
}

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const { user } = useAppSelector((state) => (state as RootState).auth);
  const isAdmin = user?.type === 'ADMIN' || user?.role === 'admin';

  // Fetch conversations
  const { data: adminConversationsData } = useGetAdminConversationsQuery(
    { limit: 50, offset: 0 },
    { skip: !isAdmin }
  );

  const { data: userConversationsData } = useGetUserConversationsQuery(
    user?.id || 0,
    { skip: isAdmin || !user?.id }
  );

  // Fetch all users for name mapping
  const { data: usersData } = useGetUsersQuery({ limit: 1000, offset: 0 });

  // Fetch conversation messages when selected
  const { data: conversationData } = useGetConversationQuery(
    { conversationId: selectedConversation || 0, limit: 50, offset: 0 },
    { skip: !selectedConversation }
  );

  const messages = conversationData?.data?.messages || [];
  const [addMessage, { isLoading: isSending }] = useAddMessageMutation();

  // Create user map
  const userMap = useMemo(() => {
    const map: Record<number, { first_name: string; last_name: string }> = {};
    if (usersData?.data) {
      usersData.data.forEach((u) => {
        map[u.id] = { first_name: u.first_name, last_name: u.last_name };
      });
    }
    return map;
  }, [usersData]);

  // Get conversations
  const conversations = useMemo(() => {
    const conversationData = isAdmin ? adminConversationsData?.data : userConversationsData?.data;
    if (!conversationData) return [];

    return conversationData.slice(0, 5).map((conv) => ({
      id: conv.id,
      name: `${userMap[conv.customer_id]?.first_name || 'Unknown'} ${userMap[conv.customer_id]?.last_name || 'User'}`,
      avatar: `${userMap[conv.customer_id]?.first_name?.charAt(0) || '?'}${userMap[conv.customer_id]?.last_name?.charAt(0) || '?'}`.toUpperCase(),
      unreadCount: conv.unread_count || 0,
      lastMessage: conv.last_message || conv.subject || 'No messages',
    })) as Conversation[];
  }, [isAdmin, adminConversationsData, userConversationsData, userMap]);

  const totalUnread = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);
  const activeConversation = conversations.find(c => c.id === selectedConversation);

  // Check if user has permission to access chat
  if (!hasPermission('allow chats')) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user?.id) return;

    try {
      await addMessage({
        conversationId: selectedConversation,
        data: {
          sender_id: user.id,
          message: messageInput.trim(),
          sender_type: user.type === 'ADMIN' ? 'ADMIN' : 'USER',
        },
      }).unwrap();

      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div 
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 transition-all ${
          isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">
              {activeConversation ? activeConversation.name : 'Messages'}
            </span>
            {totalUnread > 0 && !activeConversation && (
              <Badge className="bg-red-500 text-white text-xs">
                {totalUnread}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeConversation && (
              <button
                onClick={() => setSelectedConversation(null)}
                className="hover:bg-blue-700 p-1 rounded transition-colors"
                title="Back to conversations"
              >
                ←
              </button>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="h-[calc(100%-3.5rem)] flex flex-col">
            {!activeConversation ? (
              // Conversations List
              <ScrollArea className="flex-1">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No conversations yet
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex gap-3">
                          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold flex items-center justify-center text-sm">
                            {conversation.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                {conversation.name}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <span className="text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            ) : (
              // Active Conversation - Show messages
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {messages.length === 0 ? (
                      <div className="text-center text-slate-500 dark:text-slate-400 text-sm py-4">
                        No messages yet
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isCurrentUser = message.sender_id === user?.id;
                        const senderName = usersData?.data?.find(u => u.id === message.sender_id);
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                                isCurrentUser
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                              }`}
                            >
                              <p className="break-words">{message.message}</p>
                              <span className={`text-[11px] mt-1 block ${
                                isCurrentUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type message..."
                      className="flex-1 text-sm"
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isSending}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
