import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Minimize2, Maximize2, RotateCcw } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import type { Message } from './types';

interface ChatWindowProps {
  isOpen: boolean;
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (message: string) => void;
  onQuickReply: (action: string) => void;
  onReset: () => void;
  botName: string;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export default function ChatWindow({
  isOpen,
  messages,
  isTyping,
  onSendMessage,
  onQuickReply,
  onReset,
  botName,
  isMinimized,
  onToggleMinimize,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isMinimized]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            height: isMinimized ? 'auto' : 'auto'
          }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="
            fixed z-50
            bottom-24 right-4
            w-[calc(100vw-2rem)] max-w-[380px]
            bg-[#0f0f13] border border-pink-500/20
            rounded-2xl shadow-2xl shadow-black/50
            overflow-hidden
            flex flex-col
            sm:bottom-24 sm:right-6
          "
          style={{
            maxHeight: isMinimized ? 'auto' : 'calc(100vh - 160px)',
          }}
        >
          {/* Header */}
          <div className="
            flex items-center justify-between
            px-4 py-3
            bg-gradient-to-r from-pink-500/10 to-violet-500/10
            border-b border-pink-500/10
          ">
            <div className="flex items-center gap-3">
              <div className="
                w-10 h-10 rounded-full
                bg-gradient-to-br from-pink-500 to-violet-500
                flex items-center justify-center
              ">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">{botName}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-gray-400">En ligne</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={onReset}
                className="p-2 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
                title="Nouvelle conversation"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={onToggleMinimize}
                className="p-2 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
                title={isMinimized ? "Agrandir" : "Réduire"}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Messages area */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="
                  flex-1 overflow-y-auto
                  px-4 py-4
                  space-y-4
                  min-h-[200px] max-h-[400px]
                  scrollbar-thin scrollbar-thumb-pink-500/20 scrollbar-track-transparent
                ">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onQuickReply={onQuickReply}
                    />
                  ))}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <ChatMessage
                      message={{
                        id: 'typing',
                        content: '',
                        sender: 'bot',
                        timestamp: new Date(),
                        type: 'loading',
                      }}
                    />
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <ChatInput
                  onSend={onSendMessage}
                  disabled={isTyping}
                  placeholder="Pose ta question..."
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Disclaimer footer */}
          {!isMinimized && (
            <div className="px-4 py-2 bg-[#1a1a1f] border-t border-pink-500/5">
              <p className="text-[10px] text-gray-500 text-center">
                🤖 Assistant virtuel IA • Les informations financières sont à titre éducatif uniquement
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

