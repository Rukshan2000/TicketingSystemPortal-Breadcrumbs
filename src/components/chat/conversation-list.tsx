'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

interface Conversation {
  id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  status: 'OPEN' | 'CLOSED' | 'ON_HOLD';
  unread_count: number;
  last_message: string;
  last_message_at: string;
}

const mockConversations: Conversation[] = [
  {
    id: 1,
    customer_id: 5,
    first_name: 'John',
    last_name: 'Doe',
    status: 'OPEN',
    unread_count: 2,
    last_message: 'Thanks for your help!',
    last_message_at: '2026-01-07T10:30:00Z',
  },
  {
    id: 2,
    customer_id: 6,
    first_name: 'Jane',
    last_name: 'Smith',
    status: 'OPEN',
    unread_count: 0,
    last_message: 'See you tomorrow',
    last_message_at: '2026-01-06T15:45:00Z',
  },
  {
    id: 3,
    customer_id: 7,
    first_name: 'Mike',
    last_name: 'Johnson',
    status: 'CLOSED',
    unread_count: 0,
    last_message: 'Issue resolved',
    last_message_at: '2026-01-05T12:20:00Z',
  },
  {
    id: 4,
    customer_id: 8,
    first_name: 'Sarah',
    last_name: 'Williams',
    status: 'ON_HOLD',
    unread_count: 1,
    last_message: 'Waiting for response',
    last_message_at: '2026-01-04T09:15:00Z',
  },
];

interface ConversationListProps {
  selectedConversation: number | null;
  onSelectConversation: (id: number) => void;
  searchQuery: string;
}

export default function ConversationList({
  selectedConversation,
  onSelectConversation,
  searchQuery,
}: ConversationListProps) {
  const filteredConversations = useMemo(() => {
    return mockConversations.filter((conv) =>
      `${conv.first_name} ${conv.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'CLOSED':
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-400';
      case 'ON_HOLD':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
      default:
        return '';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {filteredConversations.length === 0 ? (
        <div className="p-4 text-center text-slate-500 dark:text-slate-400">
          No conversations found
        </div>
      ) : (
        filteredConversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50 ${
              selectedConversation === conversation.id
                ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600'
                : ''
            }`}
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold flex items-center justify-center">
                {getInitials(conversation.first_name, conversation.last_name)}
              </div>

              {/* Conversation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {conversation.first_name} {conversation.last_name}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {formatTime(conversation.last_message_at)}
                  </span>
                </div>

                {/* Last Message */}
                <p className="text-sm text-slate-600 dark:text-slate-300 truncate mb-2">
                  {conversation.last_message}
                </p>

                {/* Status and Unread */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-[10px] py-0 px-2 ${getStatusColor(conversation.status)}`}>
                    {conversation.status}
                  </Badge>
                  {conversation.unread_count > 0 && (
                    <span className="text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
