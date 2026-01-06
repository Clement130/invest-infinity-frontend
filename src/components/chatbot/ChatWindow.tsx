import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Minimize2, Maximize2, RotateCcw, MoreVertical, Download, Copy, Check, WifiOff } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput, { type Attachment } from './ChatInput';
import type { Message } from './types';
import { exportConversationAsText, copyToClipboard } from '../../services/chatbotPersistence';

interface ChatWindowProps {
  isOpen: boolean;
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (message: string, attachments?: Attachment[]) => void;
  onQuickReply: (action: string) => void;
  onFeedback: (messageId: string, isPositive: boolean) => void;
  onReset: () => void;
  botName: string;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  isOnline?: boolean;
}

export default function ChatWindow({
  isOpen,
  messages,
  isTyping,
  onSendMessage,
  onQuickReply,
  onFeedback,
  onReset,
  botName,
  isMinimized,
  onToggleMinimize,
  isOnline = true,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isMinimized]);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trouver le dernier message du bot pour afficher le feedback
  const lastBotMessageIndex = [...messages].reverse().findIndex(m => m.sender === 'bot' && m.type !== 'loading');
  const lastBotMessageId = lastBotMessageIndex !== -1 
    ? messages[messages.length - 1 - lastBotMessageIndex]?.id 
    : null;

  // Export conversation
  const handleExport = () => {
    const text = exportConversationAsText(messages);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-investinfinity-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  // Copy conversation
  const handleCopyAll = async () => {
    const text = exportConversationAsText(messages);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

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
            w-[calc(100vw-2rem)] max-w-[380px]
            bg-[#0f0f13] border border-pink-500/20
            rounded-2xl shadow-2xl shadow-black/50
            overflow-hidden
            flex flex-col
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
                  {isOnline ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-gray-400">En ligne</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={10} className="text-orange-400" />
                      <span className="text-xs text-orange-400">Hors ligne</span>
                    </>
                  )}
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
              
              {/* Menu options */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
                  title="Plus d'options"
                >
                  <MoreVertical size={16} />
                </button>
                
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1f] border border-pink-500/20 rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      <button
                        onClick={handleExport}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-pink-500/10 hover:text-pink-300 transition-colors"
                      >
                        <Download size={14} />
                        Exporter la conversation
                      </button>
                      <button
                        onClick={handleCopyAll}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-pink-500/10 hover:text-pink-300 transition-colors"
                      >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        {copied ? 'Copié !' : 'Copier tout'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
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
                      onFeedback={onFeedback}
                      isLastBotMessage={message.id === lastBotMessageId}
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

                {/* Offline warning */}
                {!isOnline && (
                  <div className="px-4 py-2 bg-orange-500/10 border-t border-orange-500/20">
                    <p className="text-xs text-orange-400 text-center flex items-center justify-center gap-2">
                      <WifiOff size={12} />
                      Connexion perdue. Tes messages seront envoyés une fois reconnecté.
                    </p>
                  </div>
                )}

                {/* Input */}
                <ChatInput
                  onSend={onSendMessage}
                  disabled={isTyping || !isOnline}
                  placeholder={!isOnline ? "Hors ligne..." : isTyping ? "Le bot écrit..." : "Pose ta question..."}
                  allowAttachments={true}
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
