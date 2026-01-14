'use client';

import { useEffect, useRef, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppSelector } from '@/store';
import { useGetUsersQuery } from '@/store/services/userApi';
import {
  useGetConversationQuery,
  useMarkMessagesAsReadMutation,
  Message,
} from '@/store/services/chatApi';

interface ChatMessagesProps {
  conversationId: number;
}

export default function ChatMessages({ conversationId }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAppSelector((state) => state.auth);
  const currentUserId = user?.id || 0;

  // Fetch all users to map sender IDs to names
  const { data: usersData } = useGetUsersQuery({ limit: 1000, offset: 0 });

  // Create a map of user IDs to their names
  const userMap = useMemo(() => {
    const map: Record<number, string> = {};
    if (usersData?.data) {
      usersData.data.forEach((u) => {
        map[u.id] = `${u.first_name} ${u.last_name}`;
      });
    }
    return map;
  }, [usersData]);

  // Fetch conversation with messages
  const {
    data: conversationData,
    isLoading,
    error,
    refetch,
  } = useGetConversationQuery(
    { conversationId, limit: 100, offset: 0 },
    { 
      skip: !conversationId,
      pollingInterval: 5000, // Poll every 5 seconds for new messages
    }
  );

  const [markAsRead] = useMarkMessagesAsReadMutation();

  const messages = conversationData?.data?.messages || [];

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
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
  const groupedMessages = useMemo(() => {
    return messages.reduce(
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
  }, [messages]);

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        <p>Failed to load messages. Please try again.</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

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
            <div className="space-y-2">
              {dateMessages.map((msg, idx) => {
                const isCurrentUser = msg.sender_id === currentUserId;
                const showAvatar =
                  idx === dateMessages.length - 1 ||
                  dateMessages[idx + 1]?.sender_id !== msg.sender_id;
                const showName = !isCurrentUser && idx === 0;
                
                // Get sender name from map or use the one from message
                const senderName = userMap[msg.sender_id] || msg.sender_name || 'Unknown User';

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'} items-end`}
                  >
                    {/* Avatar - Only show for non-current user */}
                    {!isCurrentUser && (
                      <div className="w-8 h-8 flex-shrink-0">
                        {showAvatar ? (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                            {getInitials(senderName)}
                          </div>
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    )}

                    {/* Message Container */}
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
                      {/* Sender Name (only show for others and first message in group) */}
                      {showName && senderName && (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-3 mb-1">
                          {senderName}
                        </span>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`
                          px-4 py-2.5 rounded-3xl break-words shadow-sm
                          ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm'
                          }
                        `}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>

                      {/* Timestamp and Read Status */}
                      <div className={`text-[11px] text-slate-500 dark:text-slate-400 mt-1 px-3 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.created_at)}
                        {isCurrentUser && msg.is_read && (
                          <span className="ml-1.5">✓✓</span>
                        )}
                      </div>
                    </div>

                    {/* Spacer for current user (to push message to right) */}
                    {isCurrentUser && (
                      <div className="w-8 h-8 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
