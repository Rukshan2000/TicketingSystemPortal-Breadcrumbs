'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store';
import {
  useGetUserConversationsQuery,
  useGetAdminConversationsQuery,
  Conversation,
} from '@/store/services/chatApi';
import { useGetUsersQuery } from '@/store/services/userApi';

interface ConversationListProps {
  selectedConversation: number | null;
  onSelectConversation: (id: number, conversation: Conversation) => void;
  searchQuery: string;
}

export default function ConversationList({
  selectedConversation,
  onSelectConversation,
  searchQuery,
}: ConversationListProps) {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.type === 'ADMIN' || user?.role === 'admin';

  // Fetch all users to map customer IDs to names
  const { data: usersData } = useGetUsersQuery({ limit: 1000, offset: 0 });

  // Create a map of user IDs to their names for quick lookup
  const userMap = useMemo(() => {
    const map: Record<number, { first_name: string; last_name: string }> = {};
    if (usersData?.data) {
      usersData.data.forEach((u) => {
        map[u.id] = { first_name: u.first_name, last_name: u.last_name };
      });
    }
    return map;
  }, [usersData]);

  // Fetch conversations based on user type
  const {
    data: adminConversationsData,
    isLoading: isAdminLoading,
    error: adminError,
  } = useGetAdminConversationsQuery(
    { limit: 50, offset: 0 },
    { skip: !isAdmin }
  );

  const {
    data: userConversationsData,
    isLoading: isUserLoading,
    error: userError,
  } = useGetUserConversationsQuery(
    user?.id || 0,
    { skip: isAdmin || !user?.id }
  );

  const conversations = isAdmin
    ? adminConversationsData?.data || []
    : userConversationsData?.data || [];

  const isLoading = isAdmin ? isAdminLoading : isUserLoading;
  const error = isAdmin ? adminError : userError;

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) =>
      `${conv.first_name || ''} ${conv.last_name || ''} ${conv.subject || ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

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

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '??';
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
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

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 dark:text-red-400">
        Failed to load conversations. Please try again.
      </div>
    );
  }

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
            onClick={() => onSelectConversation(conversation.id, conversation)}
            className={`w-full p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50 ${
              selectedConversation === conversation.id
                ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600'
                : ''
            }`}
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold flex items-center justify-center">
                {getInitials(
                  userMap[conversation.customer_id]?.first_name || conversation.first_name,
                  userMap[conversation.customer_id]?.last_name || conversation.last_name
                )}
              </div>

              {/* Conversation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {userMap[conversation.customer_id]?.first_name || conversation.first_name || 'Unknown'}{' '}
                    {userMap[conversation.customer_id]?.last_name || conversation.last_name || 'User'}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {formatTime(conversation.last_message_at || conversation.created_at)}
                  </span>
                </div>

                {/* Subject or Last Message */}
                <p className="text-sm text-slate-600 dark:text-slate-300 truncate mb-2">
                  {conversation.last_message || conversation.subject || 'No messages yet'}
                </p>

                {/* Status and Unread */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-[10px] py-0 px-2 ${getStatusColor(conversation.status)}`}>
                    {conversation.status}
                  </Badge>
                  {(conversation.unread_count || 0) > 0 && (
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
