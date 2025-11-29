import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder = "Écris ton message..." }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2 p-3 bg-[#1a1a1f] border-t border-pink-500/10">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              w-full px-4 py-2.5 pr-10
              bg-[#2a2a30] border border-pink-500/10
              rounded-xl text-sm text-white
              placeholder:text-gray-500
              focus:outline-none focus:border-pink-500/30
              resize-none overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          />
          <button
            type="button"
            className="absolute right-3 bottom-2.5 text-gray-500 hover:text-pink-400 transition-colors"
            title="Emojis (bientôt disponible)"
          >
            <Smile size={18} />
          </button>
        </div>
        
        <motion.button
          type="submit"
          disabled={!message.trim() || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="
            p-2.5 rounded-xl
            bg-gradient-to-r from-pink-500 to-violet-500
            text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:shadow-lg hover:shadow-pink-500/25
            transition-all duration-200
          "
        >
          <Send size={18} />
        </motion.button>
      </div>
    </form>
  );
}

