'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  conversationId: number;
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Emit typing event
    if (!isTyping) {
      setIsTyping(true);
      // socket.emit('typing', { conversationId, userId, userName });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to emit stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // socket.emit('stop_typing', { conversationId, userId });
    }, 3000);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // socket.emit('send_message', {
    //   conversationId,
    //   senderId: currentUserId,
    //   senderType: 'USER',
    //   message
    // });

    setMessage('');
    setIsTyping(false);
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
      // Handle file upload
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
            placeholder="Aa"
            className="bg-transparent border-0 focus:ring-0 p-0 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* Action Buttons */}
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={handleAttachmentClick}
        >
          <Paperclip className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Smile className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Button>

        {/* Send Button */}
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className={`rounded-full ${
            message.trim()
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Character Counter (optional) */}
      <p className="text-xs text-slate-400 mt-2 text-right">
        {message.length}/1000
      </p>
    </div>
  );
}
