'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Smile, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/store';
import { useAddMessageMutation } from '@/store/services/chatApi';

interface MessageInputProps {
  conversationId: number;
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAppSelector((state) => state.auth);

  const [addMessage, { isLoading: isSending }] = useAddMessageMutation();

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user?.id || isSending) return;

    try {
      await addMessage({
        conversationId,
        data: {
          sender_id: user.id,
          message: message.trim(),
          sender_type: user.type === 'ADMIN' ? 'ADMIN' : 'USER',
        },
      }).unwrap();

      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      // Handle file upload - can be extended later
      Array.from(files).forEach((file) => {
        console.log('File selected:', file.name);
        // Upload logic here
      });
    }
  };

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx"
      />

      {/* Message Input Area */}
      <div className="flex gap-2 items-end">
        {/* Text Input */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2 flex items-center gap-2">
          <Input
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending}
            className="bg-transparent border-0 focus:ring-0 p-0 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* Action Buttons */}
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={handleAttachmentClick}
          disabled={isSending}
        >
          <Paperclip className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          disabled={isSending}
        >
          <Smile className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Button>

        {/* Send Button */}
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={!message.trim() || isSending}
          className={`rounded-full ${
            message.trim() && !isSending
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Character Counter (optional) */}
      <p className="text-xs text-slate-400 mt-2 text-right">
        {message.length}/1000
      </p>
    </div>
  );
}
