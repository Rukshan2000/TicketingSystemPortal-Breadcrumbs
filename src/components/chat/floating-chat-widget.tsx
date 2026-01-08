'use client';

import { useState } from 'react';
import { MessageCircle, X, Minus, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { hasPermission } from '@/lib/permissions';

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
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: 1,
    name: 'Support Team',
    avatar: 'ST',
    unreadCount: 2,
    lastMessage: 'How can we help you?',
    messages: [
      { id: 1, sender: 'support', text: 'Hello! How can we help you today?', timestamp: '10:30 AM' },
      { id: 2, sender: 'user', text: 'I have a question about my ticket', timestamp: '10:31 AM' },
      { id: 3, sender: 'support', text: 'Sure, I\'d be happy to help!', timestamp: '10:32 AM' },
    ],
  },
  {
    id: 2,
    name: 'John Doe',
    avatar: 'JD',
    unreadCount: 0,
    lastMessage: 'Thanks for your help!',
    messages: [
      { id: 1, sender: 'user', text: 'Hi there!', timestamp: '9:15 AM' },
      { id: 2, sender: 'support', text: 'Hello! How can I assist you?', timestamp: '9:16 AM' },
      { id: 3, sender: 'user', text: 'Thanks for your help!', timestamp: '9:20 AM' },
    ],
  },
];

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const totalUnread = mockConversations.reduce((acc, conv) => acc + conv.unreadCount, 0);
  const activeConversation = mockConversations.find(c => c.id === selectedConversation);

  // Check if user has permission to access chat
  if (!hasPermission('allow chats')) {
    return null;
  }

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      // Handle message send logic here
      console.log('Sending message:', messageInput);
      setMessageInput('');
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
                  {mockConversations.map((conversation) => (
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
                  ))}
                </div>
              </ScrollArea>
            ) : (
              // Active Conversation
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {activeConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <span className={`text-xs mt-1 block ${
                            message.sender === 'user' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {message.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 text-sm"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
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
