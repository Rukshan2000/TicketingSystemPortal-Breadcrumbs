'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Settings, Send, Paperclip, Smile } from 'lucide-react';
import ConversationList from '@/components/chat/conversation-list';
import ChatMessages from '@/components/chat/chat-messages';
import MessageInput from '@/components/chat/message-input';

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileViewChat, setIsMobileViewChat] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Conversations List - Left Sidebar */}
        <div className={`
          ${isMobileViewChat ? 'hidden' : 'flex'}
          sm:flex flex-col w-full sm:w-96 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        `}>
          {/* Conversations Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" className="rounded-full">
                  <Plus className="w-5 h-5" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full bg-slate-100 dark:bg-slate-700 border-0"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <ConversationList
              selectedConversation={selectedConversation}
              onSelectConversation={(id) => {
                setSelectedConversation(id);
                setIsMobileViewChat(true);
              }}
              searchQuery={searchQuery}
            />
          </ScrollArea>
        </div>

        {/* Chat Area - Right Side */}
        <div className={`
          ${isMobileViewChat ? 'flex' : 'hidden'}
          sm:flex flex-1 flex-col bg-white dark:bg-slate-800 overflow-hidden
        `}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsMobileViewChat(false);
                      setSelectedConversation(null);
                    }}
                    className="sm:hidden mb-2"
                  >
                    ← Back
                  </Button>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">John Doe</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active now</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Search className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ChatMessages conversationId={selectedConversation} />

              {/* Message Input */}
              <MessageInput conversationId={selectedConversation} />
            </>
          ) : (
            /* Empty State */
            <div className="hidden sm:flex flex-1 items-center justify-center text-center">
              <div>
                <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Your Messages
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
