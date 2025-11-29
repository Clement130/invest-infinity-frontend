import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import type { Message, QuickReply } from './types';

interface ChatMessageProps {
  message: Message;
  onQuickReply?: (action: string) => void;
}

export default function ChatMessage({ message, onQuickReply }: ChatMessageProps) {
  const isBot = message.sender === 'bot';
  const isLoading = message.type === 'loading';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isBot
            ? 'bg-gradient-to-br from-pink-500 to-violet-500'
            : 'bg-gradient-to-br from-slate-600 to-slate-700'
          }
        `}
      >
        {isBot ? (
          <Bot size={16} className="text-white" />
        ) : (
          <User size={16} className="text-white" />
        )}
      </div>

      {/* Message content */}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isBot ? 'items-start' : 'items-end'}`}>
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isBot
              ? 'bg-[#1f1f23] text-gray-200 rounded-tl-sm border border-pink-500/10'
              : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-tr-sm'
            }
          `}
        >
          {isLoading ? (
            <TypingIndicator />
          ) : (
            <div className="whitespace-pre-wrap">
              {formatMessage(message.content)}
            </div>
          )}
        </div>

        {/* Quick replies */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mt-1"
          >
            {message.quickReplies.map((reply) => (
              <QuickReplyButton
                key={reply.id}
                reply={reply}
                onClick={() => onQuickReply?.(reply.action)}
              />
            ))}
          </motion.div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-500 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 bg-pink-400 rounded-full"
          animate={{
            y: [0, -4, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

interface QuickReplyButtonProps {
  reply: QuickReply;
  onClick: () => void;
}

function QuickReplyButton({ reply, onClick }: QuickReplyButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="
        inline-flex items-center gap-1.5 px-3 py-1.5
        bg-[#2a2a30] hover:bg-pink-500/20
        border border-pink-500/20 hover:border-pink-500/40
        rounded-full text-xs text-gray-300 hover:text-pink-300
        transition-all duration-200 cursor-pointer
      "
    >
      {reply.icon && <span>{reply.icon}</span>}
      <span>{reply.label}</span>
    </motion.button>
  );
}

function formatMessage(content: string): React.ReactNode {
  // Format bold text (**text**)
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="text-pink-400 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

