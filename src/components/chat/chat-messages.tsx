'use client';

import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_type: 'USER' | 'ADMIN' | 'SYSTEM';
  message: string;
  created_at: string;
  is_read: boolean;
}

const mockMessages: Message[] = [
  {
    id: 1,
    conversation_id: 1,
    sender_id: 5,
    sender_name: 'John Doe',
    sender_type: 'USER',
    message: 'Hi, I need help with my order',
    created_at: '2026-01-07T10:01:00Z',
    is_read: true,
  },
  {
    id: 2,
    conversation_id: 1,
    sender_id: 1,
    sender_name: 'Admin',
    sender_type: 'ADMIN',
    message: 'Hello! I\'d be happy to help. What\'s the issue?',
    created_at: '2026-01-07T10:05:00Z',
    is_read: true,
  },
  {
    id: 3,
    conversation_id: 1,
    sender_id: 5,
    sender_name: 'John Doe',
    sender_type: 'USER',
    message: 'The delivery hasn\'t arrived yet and it\'s been 5 days',
    created_at: '2026-01-07T10:08:00Z',
    is_read: true,
  },
  {
    id: 4,
    conversation_id: 1,
    sender_id: 1,
    sender_name: 'Admin',
    sender_type: 'ADMIN',
    message: 'Let me check your order status. Can you provide your order number?',
    created_at: '2026-01-07T10:12:00Z',
    is_read: true,
  },
  {
    id: 5,
    conversation_id: 1,
    sender_id: 5,
    sender_name: 'John Doe',
    sender_type: 'USER',
    message: 'Sure, it\'s #ORD-2026-1234',
    created_at: '2026-01-07T10:15:00Z',
    is_read: true,
  },
  {
    id: 6,
    conversation_id: 1,
    sender_id: 1,
    sender_name: 'Admin',
    sender_type: 'ADMIN',
    message: 'Thank you! I found your order. It shows as shipped yesterday. You should receive it within 2 days.',
    created_at: '2026-01-07T10:20:00Z',
    is_read: true,
  },
  {
    id: 7,
    conversation_id: 1,
    sender_id: 5,
    sender_name: 'John Doe',
    sender_type: 'USER',
    message: 'Thanks for your help!',
    created_at: '2026-01-07T10:30:00Z',
    is_read: false,
  },
];

interface ChatMessagesProps {
  conversationId: number;
}

export default function ChatMessages({ conversationId }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUserId = 1; // This should come from auth state

  useEffect(() => {
    // Auto scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const date = formatDate(msg.created_at);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(msg);
      return acc;
    },
    {} as Record<string, Message[]>
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-6">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Divider */}
            <div className="flex items-center justify-center mb-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                {date}
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-3">
              {dateMessages.map((msg, idx) => {
                const isCurrentUser = msg.sender_id === currentUserId;
                const showAvatar =
                  idx === dateMessages.length - 1 ||
                  dateMessages[idx + 1]?.sender_id !== msg.sender_id;

                return (
                  <div key={msg.id} className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    {/* Avatar - Only show for non-current user */}
                    {!isCurrentUser && (
                      <div className={showAvatar ? 'w-8 h-8 flex-shrink-0' : 'w-8 flex-shrink-0'}>
                        {showAvatar && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(msg.sender_name)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Sender Name (only show for admins and group context) */}
                      {!isCurrentUser && idx === 0 && (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          {msg.sender_name}
                        </span>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`
                          px-4 py-2.5 rounded-2xl break-words
                          ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                          }
                        `}
                      >
                        <p className="text-sm">{msg.message}</p>
                      </div>

                      {/* Timestamp and Read Status */}
                      <div className={`text-[10px] text-slate-500 dark:text-slate-400 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        <span>{formatTime(msg.created_at)}</span>
                        {isCurrentUser && msg.is_read && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </div>
                    </div>

                    {/* Avatar - Only show for current user on right */}
                    {isCurrentUser && showAvatar && (
                      <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        YO
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUser && (
          <div className="flex gap-3 items-end">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              JD
            </div>
            <div className="flex gap-1 items-end bg-slate-200 dark:bg-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-none">
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{typingUser} is typing...</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
