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
  ChevronRight,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
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

  return { isMobile, reducedMotion, isKeyboardOpen, setIsKeyboardOpen };
}

// Suggestions rapides pour mobile selon le mode
const getMobileQuickReplies = (mode: 'cta' | 'support') => {
  if (mode === 'cta') {
    return [
      { icon: '🚀', text: 'Commencer maintenant', query: 'Comment rejoindre ?' },
      { icon: '💰', text: 'Prix & valeur', query: 'Quel est le prix ?' },
      { icon: '🎯', text: 'Résultats', query: 'Quels résultats je peux attendre ?' },
      { icon: '⚡', text: 'Avantages VIP', query: 'Quels sont les avantages immédiats ?' },
      { icon: '🏦', text: 'RaiseFX', query: 'Pourquoi RaiseFX ?' },
      { icon: '📞', text: 'Contact', query: 'Comment contacter le support ?' },
    ];
  }
  return [
    { icon: '📊', text: 'Mon progrès', query: 'Mon progrès dans les formations' },
    { icon: '🏆', text: 'Challenges', query: 'Quels challenges sont actifs ?' },
    { icon: '▶️', text: 'Continuer', query: 'Continuer ma formation' },
    { icon: '💬', text: 'Discord', query: 'Comment rejoindre Discord ?' },
    { icon: '❓', text: 'Comment ça marche', query: 'Comment ça fonctionne ?' },
    { icon: '📞', text: 'Contact', query: 'Comment contacter le support ?' },
  ];
};

// Fonction pour obtenir le message initial selon le mode
const getInitialMessage = (mode: 'cta' | 'support'): Message => {
  if (mode === 'cta') {
    return {
      id: '1',
      content: "👋 **Salut Trader !** Je suis l'assistant IA d'Invest Infinity.\n\n🚀 **Découvre comment devenir rentable en trading avec Mickaël**\n\n💰 **VALEUR RÉELLE de 2500€ :**\n• Formations vidéo complètes (15h de contenu pro)\n• Discord VIP avec alertes quotidiennes\n• Communauté de +100 traders actifs\n• Support personnalisé 7j/7\n\n🤝 **MODÈLE TRANSPARENT :**\nInscription gratuite → Compte RaiseFX → Accès premium\n\n⏱️ **Seulement 8 minutes pour commencer !**\n\n⚠️ **LIMITÉ : 50 nouveaux membres par mois !**\n\n🎯 **Prêt à investir dans ton succès ?**\n\nPar quoi veux-tu commencer ?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      suggestions: [
        "💰 Quel est le prix réel ?",
        "🚀 Comment rejoindre ?",
        "🎯 Quels résultats je peux attendre ?",
        "⚡ Avantages du modèle"
      ]
    };
  }
  return {
    id: '1',
    content: "Salut ! 👋 Je suis l'assistant virtuel d'Invest Infinity. Comment puis-je t'aider aujourd'hui ?",
    sender: 'bot',
    timestamp: new Date(),
    type: 'text'
  };
};

export default function ChatBot() {
  const { user } = useAuth();
  const location = useLocation();
  const { isMobile, reducedMotion, isKeyboardOpen, setIsKeyboardOpen } = useMobileOptimization();

  // Détecter le contexte : page d'accueil (CTA) vs espace client (Support)
  const isLandingPage = location.pathname === '/' || location.pathname.startsWith('/landing');
  const isClientArea = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/formations') || location.pathname.startsWith('/challenges') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/settings');
  const chatbotMode = isLandingPage && !user && !isClientArea ? 'cta' : 'support';
  const [isOpen, setIsOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [messages, setMessages] = useState<Message[]>([getInitialMessage(chatbotMode)]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Mettre à jour le mode quand le contexte change
  useEffect(() => {
    chatbotService.setMode(chatbotMode);
    // Réinitialiser les messages si on change de mode
    if (messages.length === 1 && messages[0].id === '1') {
      setMessages([getInitialMessage(chatbotMode)]);
    }
  }, [chatbotMode, location.pathname, messages]);

  // Initialisation du contexte utilisateur et définition du mode
  useEffect(() => {
    // Définir le mode du chatbot selon le contexte
    chatbotService.setMode(chatbotMode);

    const initializeChatbot = async () => {
      if (user?.id && !isInitialized) {
        await chatbotService.initializeContext(user.id);
        setIsInitialized(true);

        // Ne plus ouvrir automatiquement - moins intrusif
        // L'utilisateur peut ouvrir le chat s'il le souhaite

        // Message de bienvenue personnalisé avec plus de contexte
        const userName = user.user_metadata?.full_name?.split(' ')[0] || 'Trader';
        let welcomeContent = `Salut ${userName} ! 👋 **Bienvenue dans Invest Infinity !**\n\n`;

        // Personnaliser selon le contexte (mode support uniquement)
        if (chatbotMode === 'support') {
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
        // Adapter le message selon le mode
        const initialMsg = chatbotMode === 'cta' 
          ? getInitialMessage('cta')
          : {
              id: '1',
              content: "Salut ! 👋 Je suis l'assistant virtuel d'Invest Infinity. Comment puis-je t'aider aujourd'hui ?\n\nConnecte-toi pour bénéficier d'un accompagnement personnalisé ! 🚀",
              sender: 'bot' as const,
              timestamp: new Date(),
              type: 'text' as const
            };
        setMessages([initialMsg]);
      } else if (!user && !isInitialized) {
        // Pas d'utilisateur, utiliser le message initial selon le mode
        setMessages([getInitialMessage(chatbotMode)]);
      }
    };

    initializeChatbot();
  }, [user, isInitialized, chatbotMode]);

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
      const newHeight = window.innerHeight;
      setViewportHeight(newHeight);

      // Détecter si le clavier est ouvert (différence de hauteur significative)
      const keyboardOpen = window.innerHeight < window.outerHeight * 0.8;
      setIsKeyboardOpen(keyboardOpen);

      // Cacher les suggestions quand le clavier est ouvert
      if (keyboardOpen) {
        setShowQuickReplies(false);
      }
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

  // Suggestion urgente après 2 minutes
  useEffect(() => {
    if (chatbotMode !== 'cta') return;

    const timer = setTimeout(() => {
      // Après 2 minutes, ajouter une suggestion plus urgente si toujours sur la page
      if (messages.length === 1) {
        const urgentMessage: Message = {
          id: 'urgent',
          content: "⏰ **Tu es encore là ? C'est le moment parfait pour commencer !**\n\n🎯 **Pourquoi attendre plus longtemps ?**\n• Les marchés n'attendent pas\n• Chaque jour compte pour ton apprentissage\n• La communauté t'attend !\n\n🚀 **Démarre ton parcours maintenant !**",
          sender: 'bot',
          timestamp: new Date(),
          type: 'text',
          suggestions: [
            "🚀 JE COMMENCE MAINTENANT !",
            "💰 Voir le prix détaillé",
            "🎯 Voir les résultats possibles"
          ]
        };
        setMessages(prev => [...prev, urgentMessage]);
      }
    }, 120000); // 2 minutes

    return () => clearTimeout(timer);
  }, [chatbotMode, messages.length]);

  // Suppression du badge de notification automatique - moins intrusif
  // Le badge n'apparaît plus automatiquement

  // Suggestions proactives désactivées - moins intrusif
  // Les suggestions ne s'affichent plus automatiquement

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

  // Suggestions selon le mode
  const quickSuggestions = chatbotMode === 'cta'
    ? [
        "💰 Quel est le prix réel ?",
        "🚀 Démarrer mon parcours maintenant",
        "🎯 Voir les résultats des membres",
        "⚡ Avantages immédiats",
        "🏦 Pourquoi RaiseFX ?"
      ]
    : [
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

  // Gestion des gestes tactiles sur mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !touchStartY || !isDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY;

    // Si on swipe vers le bas depuis le haut du chat (premiers 100px)
    if (deltaY > 50 && touchStartY < 200) {
      handleClose();
      setIsDragging(false);
      setTouchStartY(null);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsDragging(false);
    setTouchStartY(null);
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
          fixed z-[100000]
          ${isMobile
            ? chatbotMode === 'support'
              ? 'inset-x-0 top-[25%] bottom-0 w-full rounded-t-3xl'
              : 'inset-x-0 bottom-0 top-[10%] w-full rounded-t-3xl'
            : chatbotMode === 'support'
              ? 'bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] h-[500px] max-h-[70vh] rounded-2xl'
              : 'bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] h-[600px] max-h-[80vh] rounded-2xl'
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
          ${isMobile && isOpen && chatbotMode !== 'support' ? 'max-h-[90vh]' : ''}
          flex flex-col overflow-hidden
        `}
        style={isMobile && chatbotMode === 'support' ? {
          contain: 'layout style paint',
          maxHeight: '75vh',
          minHeight: '400px',
          paddingTop: 'env(safe-area-inset-top)'
        } : isMobile ? {
          contain: 'layout style paint',
          height: `${viewportHeight}px`,
          maxHeight: '100dvh',
          paddingTop: 'env(safe-area-inset-top)'
        } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
          {/* Header Mobile - Plus compact et touch-friendly */}
        <div className={`relative flex-shrink-0 ${
          isMobile
            ? 'bg-[#0f0f13] border-b border-pink-500/20 safe-area-top'
            : 'bg-gradient-to-r from-pink-500/20 via-violet-500/20 to-pink-500/20 border-b border-pink-500/20 overflow-hidden rounded-t-2xl'
        }`}>
          {/* Indicateur de swipe pour mobile */}
          {isMobile && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full opacity-50" />
          )}
          {!isMobile && (
            <div className="absolute inset-0 bg-[#0f0f13]/90 rounded-t-2xl" />
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
                <span className={`absolute bottom-0 right-0 ${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} bg-green-500 rounded-full border-2 border-[#0f0f13] opacity-80`} />
              </div>
              <div>
                <h3 className={`font-bold text-white flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Assistant IA
                </h3>
                <p className="text-xs text-gray-400">
                  {user ? 'En ligne • Personnalisé' : 'Toujours disponible'}
                </p>
              </div>
            </div>

            {/* Actions header */}
            <div className="flex items-center gap-1">
              {/* Badge En ligne - Desktop uniquement (moins intrusif) */}
              {user && !isMobile && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20 mr-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
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

        </div>

        {/* Messages */}
        <div 
          className={`flex-1 overflow-y-auto space-y-3 scrollbar-thin ${
            isMobile ? 'px-3 py-2' : 'p-4'
          }`}
          style={{
            minHeight: 0, // Important pour flex - permet au conteneur de rétrécir
          }}
        >
          {messages.map((message) => (
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
              {(messages[messages.length - 1]?.suggestions || quickSuggestions).slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
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
            <div className="grid grid-cols-2 gap-2">
              {messages[messages.length - 1].suggestions?.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleQuickReply(suggestion)}
                  className="text-sm px-4 py-3 bg-[#1f1f23] active:bg-pink-500/20 text-gray-300 rounded-xl transition-all duration-150 border border-pink-500/20 active:scale-95 font-medium min-h-[48px] flex items-center justify-center"
                >
                  {suggestion.length > 20 ? suggestion.substring(0, 20) + '...' : suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile: Quick replies quand pas de suggestions contextuelles */}
        {isMobile && messages.length === 1 && showQuickReplies && !isKeyboardOpen && (
          <div className="px-3 pb-2 flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              {getMobileQuickReplies(chatbotMode).slice(0, 4).map((item) => (
                <button
                  key={item.query}
                  onClick={() => handleQuickReply(item.query)}
                  className="flex flex-col items-center gap-2 px-4 py-4 bg-[#1f1f23] hover:bg-pink-500/20 rounded-xl border border-pink-500/20 transition-all duration-200 active:scale-95 min-h-[64px]"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs text-gray-300 font-medium text-center leading-tight">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input - Optimisé pour mobile */}
        <div
          className={`flex-shrink-0 border-t border-pink-500/10 bg-[#0f0f13] ${
            isMobile ? 'px-4 py-3' : 'p-4'
          }`}
          style={isMobile ? {
            paddingBottom: `max(12px, env(safe-area-inset-bottom))`,
            position: 'sticky',
            bottom: 0
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
                  // Auto-resize amélioré pour mobile
                  e.target.style.height = 'auto';
                  const newHeight = Math.min(e.target.scrollHeight, isMobile ? 120 : 120);
                  e.target.style.height = newHeight + 'px';
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (isMobile) {
                    setShowQuickReplies(false);
                    // Scroll vers le bas après un petit délai
                    setTimeout(() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      // Scroll aussi le container si nécessaire
                      setTimeout(() => {
                        chatContainerRef.current?.scrollTo({
                          top: chatContainerRef.current.scrollHeight,
                          behavior: 'smooth'
                        });
                      }, 100);
                    }, 300);
                  }
                }}
                onBlur={() => {
                  // Réafficher les suggestions quand on quitte l'input
                  if (isMobile && !inputValue.trim()) {
                    setShowQuickReplies(true);
                  }
                }}
                placeholder={isMobile
                  ? "Tapez votre message..."
                  : user
                    ? "Pose-moi une question sur ton parcours..."
                    : "Écris ton message..."
                }
                className={`
                  w-full bg-[#1f1f23] text-white placeholder-gray-500
                  ${isMobile ? 'px-4 py-3 text-base rounded-2xl min-h-[52px] max-h-[120px]' : 'px-4 py-3 rounded-xl min-h-[48px] max-h-[120px]'}
                  border border-pink-500/10 focus:border-pink-500/30 focus:outline-none
                  transition-all duration-200 resize-none scrollbar-thin
                  ${isMobile ? 'touch-manipulation' : ''}
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
                ${isMobile ? 'p-4 rounded-2xl min-w-[52px] min-h-[52px]' : 'p-3 rounded-xl'}
                transition-all duration-200 flex-shrink-0 flex items-center justify-center
                ${inputValue.trim() && !isTyping
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white active:scale-90 shadow-lg shadow-pink-500/20'
                  : 'bg-[#1f1f23] text-gray-500 cursor-not-allowed'
                }
                ${isMobile ? 'touch-manipulation' : ''}
              `}
              aria-label="Envoyer le message"
            >
              {isTyping ? (
                <Loader2 size={isMobile ? 24 : 20} className="animate-spin" />
              ) : (
                <Send size={isMobile ? 24 : 18} />
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
        <div className={`fixed z-[99999] ${
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
              text-white shadow-lg shadow-pink-500/20
              flex items-center justify-center
              transition-all duration-200 ease-out
              hover:shadow-xl hover:shadow-pink-500/30
              active:scale-95
              relative overflow-hidden
              group
            `}
            aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat avec l\'assistant IA'}
            style={{ contain: 'layout style paint' }}
          >
            <div className="relative z-10">
              <MessageCircle size={isMobile ? 24 : 26} className="drop-shadow-sm" />
            </div>
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

