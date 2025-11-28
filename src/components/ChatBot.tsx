import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
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
  ChevronRight,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatbotService, type ChatAction, type ChatMessage } from '../services/chatbotService';

// Alias pour simplifier l'utilisation dans le composant
type Message = ChatMessage;

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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Réduire les animations sur mobile ou si l'utilisateur préfère
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setReducedMotion(mobile || prefersReducedMotion);
    };

    // Détecter l'ouverture du clavier virtuel
    const detectKeyboard = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        // Si le viewport est significativement plus petit, le clavier est ouvert
        setIsKeyboardOpen(windowHeight - viewportHeight > 150);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', detectKeyboard);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', detectKeyboard);
      }
    };
  }, []);

  return { isMobile, reducedMotion, isKeyboardOpen };
}

// Suggestions rapides pour mobile (plus courtes)
const mobileQuickReplies = [
  { icon: '📊', text: 'Mon progrès', query: 'Mon progrès dans les formations' },
  { icon: '🏆', text: 'Challenges', query: 'Quels challenges sont actifs ?' },
  { icon: '▶️', text: 'Continuer', query: 'Continuer ma formation' },
  { icon: '💬', text: 'Discord', query: 'Comment rejoindre Discord ?' },
  { icon: '❓', text: 'Comment ça marche', query: 'Comment ça fonctionne ?' },
  { icon: '📞', text: 'Contact', query: 'Comment contacter le support ?' },
];

export default function ChatBot() {
  const { user } = useAuth();
  const { isMobile, reducedMotion, isKeyboardOpen } = useMobileOptimization();
  const [isOpen, setIsOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  // Détecter les changements de hauteur de viewport (clavier virtuel sur mobile)
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    // Utiliser visualViewport si disponible (meilleur pour le clavier mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    } else {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isMobile]);

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

  // Fonction pour envoyer une réponse rapide
  const handleQuickReply = (query: string) => {
    setInputValue(query);
    setShowQuickReplies(false);
    setTimeout(() => handleSend(), 100);
  };

  // Fermer le chat avec animation sur mobile
  const handleClose = () => {
    if (isMobile) {
      // Petit délai pour l'animation
      setIsOpen(false);
    } else {
      setIsOpen(false);
    }
  };

  // Scroll vers le bas quand le clavier s'ouvre
  useEffect(() => {
    if (isKeyboardOpen && isMobile) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isKeyboardOpen, isMobile]);

  return (
    <>
      {/* Chat Window - Optimisé pour mobile */}
      <div
        ref={chatContainerRef}
        className={`
          fixed z-50
          ${isMobile 
            ? 'inset-x-0 bottom-0 top-0 w-full rounded-none' 
            : 'bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] rounded-2xl'
          }
          bg-[#0f0f13]
          ${!isMobile && 'border border-pink-500/20'}
          shadow-2xl shadow-pink-500/10
          transform transition-all ${reducedMotion ? 'duration-150' : 'duration-300'} ease-out
          ${isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : isMobile 
              ? 'opacity-0 translate-y-full pointer-events-none'
              : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }
          flex flex-col
        `}
        style={isMobile ? { 
          contain: 'layout style paint',
          height: `${viewportHeight}px`,
          maxHeight: '100dvh',
          paddingTop: 'env(safe-area-inset-top)'
        } : undefined}
      >
        {/* Header Mobile - Plus compact et touch-friendly */}
        <div className={`relative flex-shrink-0 ${
          isMobile 
            ? 'bg-[#0f0f13] border-b border-pink-500/20 safe-area-top' 
            : 'bg-gradient-to-r from-pink-500/20 via-violet-500/20 to-pink-500/20 border-b border-pink-500/20 overflow-hidden rounded-t-2xl'
        }`}>
          {!isMobile && (
            <>
              <div className="absolute inset-0 bg-[#0f0f13]/90 rounded-t-2xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-violet-500/5 animate-pulse rounded-t-2xl" />
            </>
          )}

          <div className={`relative flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'p-4'}`}>
            {/* Bouton retour sur mobile */}
            {isMobile && (
              <button
                onClick={handleClose}
                className="p-2 -ml-2 mr-2 hover:bg-white/10 rounded-full transition-all duration-200 active:scale-90"
                aria-label="Fermer le chat"
              >
                <ArrowLeft size={22} className="text-gray-300" />
              </button>
            )}

            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div className={`${isMobile ? 'w-10 h-10' : 'w-11 h-11'} rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-pink-500/30`}>
                  <Bot size={isMobile ? 18 : 20} className="text-white" />
                </div>
                <span className={`absolute bottom-0 right-0 ${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} bg-green-500 rounded-full border-2 border-[#0f0f13]`} />
              </div>
              <div>
                <h3 className={`font-bold text-white flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Assistant IA
                  {!isMobile && <Sparkles size={16} className="text-pink-400 animate-pulse" />}
                </h3>
                <p className="text-xs text-gray-400">
                  {user ? 'En ligne • Personnalisé' : 'Toujours disponible'}
                </p>
              </div>
            </div>

            {/* Actions header */}
            <div className="flex items-center gap-1">
              {/* Badge En ligne - Desktop uniquement */}
              {user && !isMobile && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20 mr-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">En ligne</span>
                </div>
              )}

              {/* Bouton fermer - Desktop */}
              {!isMobile && (
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Fermer le chat"
                >
                  <Minimize2 size={18} className="text-gray-400 hover:text-white transition-colors" />
                </button>
              )}

              {/* Menu mobile - 3 points */}
              {isMobile && (
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 active:scale-90"
                  aria-label="Options"
                >
                  <ChevronDown size={20} className={`text-gray-400 transition-transform ${showQuickReplies ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Replies Bar - Mobile Only */}
          {isMobile && showQuickReplies && !isKeyboardOpen && (
            <div className="px-3 pb-3 overflow-x-auto scrollbar-none">
              <div className="flex gap-2 min-w-max">
                {mobileQuickReplies.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(item.query)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1f1f23] hover:bg-pink-500/20 rounded-full border border-pink-500/20 transition-all duration-200 active:scale-95 whitespace-nowrap"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs text-gray-300 font-medium">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div 
          className={`flex-1 overflow-y-auto space-y-3 scrollbar-thin ${
            isMobile ? 'px-3 py-2' : 'h-[400px] p-4'
          }`}
          style={isMobile ? {
            minHeight: 0, // Important pour flex
          } : undefined}
        >
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
              style={reducedMotion ? undefined : {
                animation: `fadeSlideIn 0.2s ease-out both`
              }}
            >
              {/* Avatar - Plus petit sur mobile */}
              {!isMobile && (
                <div className={`relative flex-shrink-0 ${
                  message.sender === 'user' ? 'order-2' : 'order-1'
                }`}>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shadow-md
                    ${message.sender === 'bot'
                      ? 'bg-gradient-to-r from-pink-500 to-violet-500 shadow-pink-500/20'
                      : 'bg-slate-700 shadow-slate-700/20'
                    }
                  `}>
                    {message.sender === 'bot' ? (
                      <Bot size={14} className="text-white" />
                    ) : (
                      <User size={14} className="text-gray-300" />
                    )}
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className={`${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
                {/* Message Bubble - Optimisé pour mobile */}
                <div className={`
                  ${isMobile ? 'px-3 py-2.5' : 'px-4 py-3'} rounded-2xl shadow-sm whitespace-pre-line
                  ${message.sender === 'bot'
                    ? 'bg-[#1f1f23] text-gray-200 rounded-bl-sm'
                    : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-br-sm'
                  }
                `}>
                  <p className={`${isMobile ? 'text-[15px]' : 'text-sm'} leading-relaxed`}>{message.content}</p>
                </div>

                {/* Actions - Plus grandes et touch-friendly sur mobile */}
                {message.actions && message.actions.length > 0 && (
                  <div className={`flex flex-wrap gap-2 mt-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => handleActionClick(action)}
                        className={`
                          ${isMobile ? 'px-4 py-2.5' : 'px-3 py-2'} 
                          bg-pink-500/10 hover:bg-pink-500/20 active:bg-pink-500/30
                          text-pink-400 rounded-xl border border-pink-500/20 
                          transition-all duration-200 active:scale-95
                          ${isMobile ? 'text-sm' : 'text-xs'} font-medium 
                          flex items-center gap-2
                        `}
                      >
                        {action.type === 'continue_lesson' && <BookOpen size={isMobile ? 16 : 14} />}
                        {action.type === 'join_challenge' && <Trophy size={isMobile ? 16 : 14} />}
                        {action.type === 'view_progress' && <Zap size={isMobile ? 16 : 14} />}
                        {action.type === 'search_content' && <Search size={isMobile ? 16 : 14} />}
                        {action.type === 'claim_reward' && <Sparkles size={isMobile ? 16 : 14} />}
                        <span className={isMobile ? 'max-w-[150px] truncate' : ''}>{action.label}</span>
                        <ChevronRight size={isMobile ? 14 : 12} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp - Discret */}
                {!isMobile && (
                  <div className={`text-xs text-gray-600 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTimeAgo(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2">
              {!isMobile && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`bg-[#1f1f23] ${isMobile ? 'px-4 py-3' : 'px-4 py-3'} rounded-2xl rounded-bl-sm`}>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Suggestions intelligentes - Optimisé pour mobile */}
        {!isMobile && (messages.length === 1 || (messages[messages.length - 1]?.suggestions && messages[messages.length - 1].sender === 'bot')) && (
          <div className="px-4 pb-2 flex-shrink-0">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
              <Sparkles size={12} className="text-pink-400" />
              Suggestions :
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(messages[messages.length - 1]?.suggestions || quickSuggestions).slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(suggestion)}
                  className="text-xs px-3 py-2 bg-[#1f1f23] hover:bg-pink-500/10 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-pink-500/10 hover:border-pink-500/30 text-left truncate"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile: Suggestions inline après message bot */}
        {isMobile && messages.length > 1 && messages[messages.length - 1]?.suggestions && messages[messages.length - 1].sender === 'bot' && !isKeyboardOpen && (
          <div className="px-3 pb-2 flex-shrink-0">
            <div className="flex flex-wrap gap-2">
              {messages[messages.length - 1].suggestions?.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(suggestion)}
                  className="text-sm px-3 py-2 bg-[#1f1f23] active:bg-pink-500/20 text-gray-300 rounded-full transition-all duration-150 border border-pink-500/20 active:scale-95"
                >
                  {suggestion.length > 25 ? suggestion.substring(0, 25) + '...' : suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input - Optimisé pour mobile */}
        <div 
          className={`flex-shrink-0 border-t border-pink-500/10 bg-[#0f0f13] ${
            isMobile ? 'px-3 py-2' : 'p-4'
          }`}
          style={isMobile ? {
            paddingBottom: `max(8px, env(safe-area-inset-bottom))`
          } : undefined}
        >
          <div className={`flex items-end ${isMobile ? 'gap-2' : 'gap-3'}`}>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowQuickReplies(false);
                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, isMobile ? 80 : 120) + 'px';
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (isMobile) {
                    setShowQuickReplies(false);
                    // Scroll vers le bas après un petit délai
                    setTimeout(() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  }
                }}
                placeholder={isMobile 
                  ? "Message..." 
                  : user 
                    ? "Pose-moi une question sur ton parcours..." 
                    : "Écris ton message..."
                }
                className={`
                  w-full bg-[#1f1f23] text-white placeholder-gray-500 
                  ${isMobile ? 'px-4 py-2.5 text-base rounded-2xl min-h-[44px] max-h-[80px]' : 'px-4 py-3 rounded-xl min-h-[48px] max-h-[120px]'}
                  border border-pink-500/10 focus:border-pink-500/30 focus:outline-none 
                  transition-all duration-200 resize-none scrollbar-thin
                `}
                rows={1}
              />
              {!isMobile && inputValue.length > 100 && (
                <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                  {inputValue.length}/500
                </div>
              )}
            </div>
            
            {/* Bouton envoyer - Plus grand sur mobile */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={`
                ${isMobile ? 'p-3 rounded-2xl' : 'p-3 rounded-xl'} 
                transition-all duration-200 flex-shrink-0
                ${inputValue.trim() && !isTyping
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white active:scale-90 shadow-lg shadow-pink-500/20'
                  : 'bg-[#1f1f23] text-gray-500 cursor-not-allowed'
                }
              `}
              aria-label="Envoyer le message"
            >
              {isTyping ? (
                <Loader2 size={isMobile ? 22 : 20} className="animate-spin" />
              ) : (
                <Send size={isMobile ? 22 : 18} />
              )}
            </button>
          </div>

          {/* Footer avec raccourcis - Desktop uniquement */}
          {!isMobile && (
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#1f1f23] rounded text-xs border border-gray-700">Enter</kbd>
                <span>envoyer</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#1f1f23] rounded text-xs border border-gray-700">Esc</kbd>
                <span>fermer</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Button - Caché quand chat ouvert sur mobile */}
      {(!isMobile || !isOpen) && (
        <div className={`fixed z-50 ${
          isMobile 
            ? 'bottom-5 right-4'
            : 'bottom-4 right-4 sm:right-6'
        }`}>
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setShowQuickReplies(true);
              }
            }}
            className={`
              ${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-full
              bg-gradient-to-r from-pink-500 to-violet-500
              text-white shadow-xl shadow-pink-500/30
              flex items-center justify-center
              transition-all ${reducedMotion ? 'duration-150' : 'duration-300'} ease-out
              active:scale-90
              relative overflow-hidden
              group
            `}
            aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat avec l\'assistant IA'}
            style={{ contain: 'layout style paint' }}
          >
            <div className="relative z-10">
              <MessageCircle size={isMobile ? 24 : 26} className="drop-shadow-sm" />
              {/* Notification Badge */}
              {hasNewMessage && (
                <span className={`absolute ${isMobile ? '-top-0.5 -right-0.5 w-3 h-3' : '-top-1 -right-1 w-4 h-4'} bg-green-500 rounded-full border-2 border-white shadow-lg`}>
                  {!reducedMotion && <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />}
                </span>
              )}
            </div>

            {/* Pulse Effect - Désactivé sur mobile pour performance */}
            {!reducedMotion && (
              <span className="absolute inset-0 rounded-full bg-pink-500 animate-ping opacity-15" />
            )}
          </button>

          {/* Tooltip - Desktop uniquement */}
          {!isMobile && (
            <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-gray-700 whitespace-nowrap pointer-events-none">
              <div className="font-medium flex items-center gap-2">
                <Sparkles size={14} className="text-pink-400" />
                {user ? 'Assistant IA' : 'Besoin d\'aide ?'}
              </div>
              <div className="absolute top-full right-5 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95" />
            </div>
          )}
        </div>
      )}

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

