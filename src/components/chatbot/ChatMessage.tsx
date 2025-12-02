import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, ThumbsUp, ThumbsDown, Lock, Copy, Check, Image as ImageIcon, FileText, Download } from 'lucide-react';
import type { Message, QuickReply } from './types';

interface ChatMessageProps {
  message: Message;
  onQuickReply?: (action: string) => void;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
  isLastBotMessage?: boolean;
  showCopyButton?: boolean;
}

export default function ChatMessage({ 
  message, 
  onQuickReply, 
  onFeedback,
  isLastBotMessage = false,
  showCopyButton = true
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isBot = message.sender === 'bot';
  const isLoading = message.type === 'loading';
  const hasAttachment = message.type === 'image' || message.type === 'file';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
            relative group px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isBot
              ? 'bg-[#1f1f23] text-gray-200 rounded-tl-sm border border-pink-500/10'
              : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-tr-sm'
            }
          `}
        >
          {isLoading ? (
            <TypingIndicator />
          ) : (
            <>
              {/* Attachment preview */}
              {hasAttachment && message.attachmentUrl && (
                <AttachmentPreview 
                  url={message.attachmentUrl} 
                  type={message.type as 'image' | 'file'} 
                />
              )}
              
              {/* Message content */}
              <div className="whitespace-pre-wrap">
                {formatMessage(message.content)}
              </div>

              {/* Copy button - only for bot messages */}
              {isBot && showCopyButton && !isLoading && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleCopy}
                  className={`
                    absolute -right-2 -top-2 p-1.5 rounded-full
                    bg-[#2a2a30] border border-pink-500/20
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    ${copied ? 'text-green-400' : 'text-gray-400 hover:text-pink-400'}
                  `}
                  title={copied ? 'Copié !' : 'Copier'}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check size={12} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy size={12} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
            </>
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

        {/* Feedback buttons - only for bot messages that should show feedback */}
        {isBot && !isLoading && message.showFeedback && isLastBotMessage && (
          <FeedbackButtons
            messageId={message.id}
            feedbackGiven={message.feedbackGiven}
            onFeedback={onFeedback}
          />
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
  const hasRestriction = reply.requiresAuth || reply.requiresLicense || reply.requiresAdmin;
  
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
      {hasRestriction && <Lock size={10} className="text-gray-500 ml-0.5" />}
    </motion.button>
  );
}

interface FeedbackButtonsProps {
  messageId: string;
  feedbackGiven?: 'positive' | 'negative' | null;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
}

function FeedbackButtons({ messageId, feedbackGiven, onFeedback }: FeedbackButtonsProps) {
  if (feedbackGiven) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-[10px] text-gray-500 mt-1"
      >
        <span>Merci pour ton retour ! {feedbackGiven === 'positive' ? '👍' : '👎'}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-2 mt-1"
    >
      <span className="text-[10px] text-gray-500">Cette réponse t'a aidé ?</span>
      <button
        onClick={() => onFeedback?.(messageId, true)}
        className="p-1 rounded hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors"
        title="Oui, utile"
      >
        <ThumbsUp size={14} />
      </button>
      <button
        onClick={() => onFeedback?.(messageId, false)}
        className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
        title="Non, pas utile"
      >
        <ThumbsDown size={14} />
      </button>
    </motion.div>
  );
}

function formatMessage(content: string): React.ReactNode {
  // Format bold text (**text**) and italic (*text*)
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="text-pink-400 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={index} className="text-gray-400 italic">
          {part.slice(1, -1)}
        </em>
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

// Attachment Preview Component
interface AttachmentPreviewProps {
  url: string;
  type: 'image' | 'file';
}

function AttachmentPreview({ url, type }: AttachmentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (type === 'image') {
    return (
      <div className="mb-2 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] rounded-lg">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {hasError ? (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            <ImageIcon size={16} />
            <span>Impossible de charger l'image</span>
          </div>
        ) : (
          <img
            src={url}
            alt="Attachment"
            className="max-w-full max-h-48 rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            onClick={() => window.open(url, '_blank')}
          />
        )}
      </div>
    );
  }

  // File type
  const fileName = url.split('/').pop() || 'Fichier';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-3 mb-2 bg-[#2a2a30] border border-pink-500/20 rounded-lg hover:border-pink-500/40 transition-colors"
    >
      <FileText size={20} className="text-pink-400" />
      <span className="flex-1 text-xs text-gray-300 truncate">{fileName}</span>
      <Download size={14} className="text-gray-500" />
    </a>
  );
}
