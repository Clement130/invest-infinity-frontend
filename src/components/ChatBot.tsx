import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Minimize2,
  Loader2,
  Zap,
  Trophy,
  BookOpen,
  Search,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatbotService, type ChatAction } from '../services/chatbotService';

// Utiliser directement le type ChatMessage du service

// Fonction utilitaire pour formater le temps écoulé
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'à l\'instant';
  if (diffInMinutes < 60) return `il y a ${diffInMinutes}min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `il y a ${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `il y a ${diffInDays}j`;
};

// Hook pour détecter mobile et optimiser
function useMobileOptimization() {
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Réduire les animations sur mobile ou si l'utilisateur préfère
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setReducedMotion(mobile || prefersReducedMotion);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, reducedMotion };
}

export default function ChatBot() {
  const { user } = useAuth();
  const { isMobile, reducedMotion } = useMobileOptimization();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Salut ! 👋 Je suis l'assistant virtuel d'Invest Infinity. Comment puis-je t'aider aujourd'hui ?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Initialisation du contexte utilisateur
  useEffect(() => {
    const initializeChatbot = async () => {
      if (user?.id && !isInitialized) {
        await chatbotService.initializeContext(user.id);
        setIsInitialized(true);

        // Ouvrir automatiquement le chat pour les nouveaux utilisateurs
        const isNewUser = !localStorage.getItem(`chatbot-welcome-${user.id}`);
        if (isNewUser) {
          setIsOpen(true);
          localStorage.setItem(`chatbot-welcome-${user.id}`, 'shown');
        }

        // Message de bienvenue personnalisé avec plus de contexte
        const userName = user.user_metadata?.full_name?.split(' ')[0] || 'Trader';
        let welcomeContent = `Salut ${userName} ! 👋 **Bienvenue dans Invest Infinity !**\n\n`;

        // Personnaliser selon le contexte
        if (chatbotService.generateProactiveSuggestions()) {
          welcomeContent += `Je vois que tu as déjà commencé ton parcours ! Je peux t'aider avec :\n\n`;
          welcomeContent += `• 📊 Ton progrès dans les formations\n`;
          welcomeContent += `• 🏆 Les challenges et quêtes actifs\n`;
          welcomeContent += `• 🎯 Des recommandations personnalisées\n`;
          welcomeContent += `• 💬 Réponses à toutes tes questions\n\n`;
          welcomeContent += `Que veux-tu savoir ou faire aujourd'hui ?`;
        } else {
          welcomeContent += `Je suis ton assistant IA personnel ! Je peux t'aider avec :\n\n`;
          welcomeContent += `• 🚀 **Commencer** tes formations de trading\n`;
          welcomeContent += `• 🏆 **Découvrir** les challenges disponibles\n`;
          welcomeContent += `• 📈 **Comprendre** comment devenir rentable\n`;
          welcomeContent += `• 💰 **Tout savoir** sur notre modèle\n\n`;
          welcomeContent += `Par quoi veux-tu commencer ?`;
        }

        const welcomeMessage: Message = {
          id: 'welcome',
          content: welcomeContent,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text',
          suggestions: [
            "Mon progrès dans les formations",
            "Comment rejoindre Discord ?",
            "Comment ça fonctionne ?",
            "Quels challenges sont disponibles ?"
          ]
        };
        setMessages([welcomeMessage]);
      } else if (!user && isInitialized) {
        // Utilisateur déconnecté, réinitialiser
        await chatbotService.initializeContext();
        setIsInitialized(false);
        setMessages([{
          id: '1',
          content: "Salut ! 👋 Je suis l'assistant virtuel d'Invest Infinity. Comment puis-je t'aider aujourd'hui ?\n\nConnecte-toi pour bénéficier d'un accompagnement personnalisé ! 🚀",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        }]);
      }
    };

    initializeChatbot();
  }, [user, isInitialized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Écouter l'événement personnalisé pour ouvrir le chatbot depuis d'autres composants
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
    };

    window.addEventListener('openChatbot', handleOpenChatbot);
    return () => {
      window.removeEventListener('openChatbot', handleOpenChatbot);
    };
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // "/" pour ouvrir le chat (comme Discord)
      if (event.key === '/' && !isOpen && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIsOpen(true);
      }

      // "Escape" pour fermer le chat
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }

      // "Ctrl/Cmd + K" pour ouvrir le chat (comme les palettes de commandes)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k' && !isOpen) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Animation du badge de notification
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setHasNewMessage(true);
      }, 8000); // Plus long pour laisser le temps de découvrir l'interface
      return () => clearTimeout(timer);
    } else {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  // Suggestions proactives
  useEffect(() => {
    if (!isOpen || !user || !isInitialized) return;

    const checkProactiveSuggestions = () => {
      if (chatbotService.shouldShowProactiveSuggestion()) {
        const suggestion = chatbotService.generateProactiveSuggestions();
        if (suggestion) {
          const suggestionMessage: Message = {
            id: `proactive-${Date.now()}`,
            content: suggestion.message,
            sender: 'bot',
            timestamp: new Date(),
            type: 'suggestion',
            actions: suggestion.actions,
            suggestions: suggestion.suggestions
          };

          setMessages(prev => [...prev, suggestionMessage]);
        }
      }
    };

    // Vérifier après 2 minutes d'ouverture du chat
    const timer = setTimeout(checkProactiveSuggestions, 120000);

    return () => clearTimeout(timer);
  }, [isOpen, user, isInitialized]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    chatbotService.addToConversation(userMessage);
    setInputValue('');
    setIsTyping(true);

    try {
      // Générer la réponse avec le service intelligent
      const response = await chatbotService.generateResponse(inputValue);

      // Simuler un délai de réponse pour un effet plus naturel
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: response.message,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text',
          actions: response.actions,
          suggestions: response.suggestions
        };

        setMessages(prev => [...prev, botResponse]);
        chatbotService.addToConversation(botResponse);
        setIsTyping(false);
      }, 800 + Math.random() * 600);
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
      setTimeout(() => {
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "Désolé, j'ai eu un petit problème technique. Peux-tu reformuler ta question ? 🤔",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, errorResponse]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleActionClick = async (action: ChatAction) => {
    // Ajouter un message d'action à la conversation
    const actionMessage: Message = {
      id: Date.now().toString(),
      content: `Action: ${action.label}`,
      sender: 'user',
      timestamp: new Date(),
      type: 'action'
    };

    setMessages(prev => [...prev, actionMessage]);
    setIsTyping(true);

    try {
      const result = await chatbotService.executeAction(action);

      setTimeout(() => {
        const resultMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };

        setMessages(prev => [...prev, resultMessage]);
        chatbotService.addToConversation(resultMessage);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'action:', error);
      setTimeout(() => {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Une erreur s'est produite lors de l'exécution de cette action. Réessaie plus tard.",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickSuggestions = [
    "Mon progrès dans les formations",
    "Quels challenges sont actifs ?",
    "Continuer ma formation",
    "Comment contacter le support ?"
  ];

  return (
    <>
      {/* Chat Window - Optimisé pour mobile */}
      <div
        className={`
          fixed bottom-24 right-4 sm:right-6 z-50
          w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px]
          bg-[#0f0f13] rounded-2xl
          border border-pink-500/20
          shadow-2xl shadow-pink-500/10
          transform transition-all ${reducedMotion ? 'duration-200' : 'duration-500'} ease-out
          ${isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }
        `}
        style={isMobile ? { contain: 'layout style paint' } : undefined}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-pink-500/20 via-violet-500/20 to-pink-500/20 p-4 rounded-t-2xl border-b border-pink-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-[#0f0f13]/90 rounded-t-2xl" />
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-violet-500/5 animate-pulse rounded-t-2xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-110 transition-transform duration-300">
                  <Bot size={20} className="text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0f0f13] animate-pulse" />
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 opacity-20 animate-ping" />
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2 text-base">
                  Assistant IA
                  <Sparkles size={16} className="text-pink-400 animate-pulse" />
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">Toujours disponible</p>
                  {user && (
                    <>
                      <span className="text-xs text-gray-600">•</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">Connecté</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status indicator */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">En ligne</span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Fermer le chat"
              >
                <Minimize2 size={18} className="text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
              style={reducedMotion ? undefined : {
                animation: `fadeSlideIn 0.3s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Avatar */}
              <div className={`relative flex-shrink-0 ${
                message.sender === 'user' ? 'order-2' : 'order-1'
              }`}>
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center shadow-lg
                  ${message.sender === 'bot'
                    ? 'bg-gradient-to-r from-pink-500 to-violet-500 shadow-pink-500/30'
                    : 'bg-slate-700 shadow-slate-700/30'
                  }
                `}>
                  {message.sender === 'bot' ? (
                    <Bot size={16} className="text-white" />
                  ) : (
                    <User size={16} className="text-gray-300" />
                  )}
                </div>
                {message.sender === 'bot' && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0f0f13] animate-pulse" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
                {/* Message Bubble */}
                <div className={`
                  px-4 py-3 rounded-2xl shadow-lg whitespace-pre-line
                  ${message.sender === 'bot'
                    ? 'bg-[#1f1f23] text-gray-200 rounded-bl-md border border-pink-500/10'
                    : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-br-md'
                  }
                `}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {/* Actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className={`flex flex-wrap gap-2 mt-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => handleActionClick(action)}
                        className="px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-lg border border-pink-500/20 transition-all duration-200 hover:scale-105 text-xs font-medium flex items-center gap-2"
                      >
                        {action.type === 'continue_lesson' && <BookOpen size={14} />}
                        {action.type === 'join_challenge' && <Trophy size={14} />}
                        {action.type === 'view_progress' && <Zap size={14} />}
                        {action.type === 'search_content' && <Search size={14} />}
                        {action.type === 'claim_reward' && <Sparkles size={14} />}
                        {action.label}
                        <ChevronRight size={12} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-xs text-gray-500 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTimeAgo(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-[#1f1f23] px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions intelligentes */}
        {(messages.length === 1 || (messages[messages.length - 1]?.suggestions && messages[messages.length - 1].sender === 'bot')) && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-2">
              <Sparkles size={12} className="text-pink-400" />
              Suggestions personnalisées :
            </p>
            <div className="grid grid-cols-1 gap-2">
              {(messages[messages.length - 1]?.suggestions || quickSuggestions).slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputValue(suggestion);
                    setTimeout(() => handleSend(), 100);
                  }}
                  className="text-xs px-3 py-2.5 bg-gradient-to-r from-pink-500/5 to-violet-500/5 hover:from-pink-500/10 hover:to-violet-500/10 text-gray-300 hover:text-white rounded-xl transition-all duration-200 border border-pink-500/20 hover:border-pink-500/40 text-left group"
                >
                  <div className="flex items-center gap-2">
                    {suggestion.includes('progrès') && <Zap size={14} className="text-pink-400 group-hover:scale-110 transition-transform" />}
                    {suggestion.includes('challenge') && <Trophy size={14} className="text-pink-400 group-hover:scale-110 transition-transform" />}
                    {suggestion.includes('formation') && <BookOpen size={14} className="text-pink-400 group-hover:scale-110 transition-transform" />}
                    {suggestion.includes('support') && <Settings size={14} className="text-pink-400 group-hover:scale-110 transition-transform" />}
                    {!suggestion.includes('progrès') && !suggestion.includes('challenge') && !suggestion.includes('formation') && !suggestion.includes('support') && (
                      <MessageCircle size={14} className="text-pink-400 group-hover:scale-110 transition-transform" />
                    )}
                    {suggestion}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-pink-500/10 bg-[#0f0f13]/50">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyPress={handleKeyPress}
                placeholder={user ? "Pose-moi une question sur ton parcours..." : "Écris ton message..."}
                className="w-full bg-[#1f1f23] text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-pink-500/10 focus:border-pink-500/30 focus:outline-none transition-all duration-200 resize-none min-h-[48px] max-h-[120px] scrollbar-thin"
                rows={1}
              />
              {inputValue.length > 100 && (
                <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                  {inputValue.length}/500
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={`
                p-3 rounded-xl transition-all duration-300 flex-shrink-0
                ${inputValue.trim() && !isTyping
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:shadow-lg hover:shadow-pink-500/30 hover:scale-105 active:scale-95'
                  : 'bg-[#1f1f23] text-gray-500 cursor-not-allowed'
                }
              `}
              aria-label="Envoyer le message"
            >
              {isTyping ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>

          {/* Footer avec raccourcis */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-[#1f1f23] rounded text-xs border border-gray-600">Enter</kbd>
                <span>pour envoyer</span>
              </div>
              {user && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Connecté</span>
                </div>
              )}
            </div>

            {/* Raccourcis clavier */}
            <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#1f1f23] rounded text-xs border border-gray-600">/</kbd>
                <span>ouvrir</span>
              </div>
              <span className="text-gray-700">•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#1f1f23] rounded text-xs border border-gray-600">Esc</kbd>
                <span>fermer</span>
              </div>
              <span className="text-gray-700">•</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#1f1f23] rounded text-xs border border-gray-600">Ctrl+K</kbd>
                <span>focus</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Button - Optimisé pour mobile */}
      <div className="fixed bottom-4 right-4 sm:right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-16 h-16 rounded-full
            bg-gradient-to-r from-pink-500 to-violet-500
            text-white shadow-xl shadow-pink-500/40
            flex items-center justify-center
            transition-all ${reducedMotion ? 'duration-200' : 'duration-500'} ease-out
            ${reducedMotion ? '' : 'hover:scale-110 hover:shadow-2xl hover:shadow-pink-500/50'}
            active:scale-95
            relative overflow-hidden
            group
          `}
          aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat avec l\'assistant IA'}
          style={isMobile ? { contain: 'layout style paint' } : undefined}
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

          <div className="relative z-10">
            {isOpen ? (
              <X size={26} className="transition-transform duration-300 drop-shadow-sm" />
            ) : (
              <>
                <MessageCircle size={26} className="transition-transform duration-300 drop-shadow-sm" />
                {/* Notification Badge */}
                {hasNewMessage && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white shadow-lg">
                    <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                  </span>
                )}
              </>
            )}
          </div>

          {/* Pulse Effect - Désactivé sur mobile pour performance */}
          {!isOpen && !reducedMotion && (
            <span className="absolute inset-0 rounded-full bg-pink-500 animate-ping opacity-20" />
          )}

          {/* Ripple effect on hover */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 animate-ping" />
        </button>

        {/* Tooltip - Simplifié sur mobile */}
        {!isOpen && !isMobile && (
          <div className="absolute bottom-full right-0 mb-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-gray-700 min-w-[200px]">
            <div className="font-medium mb-2">
              {user ? 'Assistant IA personnalisé' : 'Parler à l\'assistant IA'}
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <div className="flex items-center justify-between">
                <span>Ouvrir le chat:</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">/</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Raccourci:</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">Ctrl+K</kbd>
              </div>
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>

      {/* CSS for animations - Optimisé pour mobile */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Optimisations mobiles */
        @media (max-width: 767px) {
          .scrollbar-thin::-webkit-scrollbar {
            width: 4px;
          }

          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, rgba(236, 72, 153, 0.4), rgba(139, 92, 246, 0.4));
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(236, 72, 153, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.8), 0 0 30px rgba(236, 72, 153, 0.4);
          }
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(236, 72, 153, 0.6), rgba(139, 92, 246, 0.6));
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(236, 72, 153, 0.8), rgba(139, 92, 246, 0.8));
        }

        .message-bubble {
          animation: slideInUp 0.3s ease-out;
        }

        .message-bubble:hover {
          transform: translateY(-1px);
          transition: transform 0.2s ease;
        }

        .action-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-button:hover {
          transform: translateY(-2px) scale(1.02);
        }

        .action-button:active {
          transform: translateY(0) scale(0.98);
        }

        .typing-dots span {
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0s; }

        @keyframes typing {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .glow-effect {
          animation: glow 2s ease-in-out infinite;
        }

        .gradient-bg {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.1));
        }

        .glass-effect {
          backdrop-filter: blur(10px);
          background: rgba(15, 15, 19, 0.8);
          border: 1px solid rgba(236, 72, 153, 0.1);
        }
      `}</style>
    </>
  );
}

