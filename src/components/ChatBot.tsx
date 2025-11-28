import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Minimize2,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Réponses automatiques basées sur des mots-clés
const getBotResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  // Salutations
  if (message.match(/\b(salut|bonjour|hello|hey|coucou|bonsoir)\b/)) {
    return "Salut ! 👋 Je suis l'assistant d'Invest Infinity. Comment puis-je t'aider aujourd'hui ? Tu peux me poser des questions sur nos services, nos formations ou comment nous rejoindre !";
  }
  
  // Questions sur le prix/gratuit
  if (message.match(/\b(prix|coût|gratuit|payer|abonnement|tarif|combien)\b/)) {
    return "Excellente question ! 🎉 L'accès à Invest Infinity est 100% GRATUIT ! Pas d'abonnement, pas de frais cachés. Tu accèdes à toutes nos formations, alertes et au Discord VIP. Notre modèle est basé sur un partenariat avec RaiseFX.";
  }
  
  // Questions sur l'inscription
  if (message.match(/\b(inscrire|inscription|rejoindre|commencer|créer compte|s'inscrire)\b/)) {
    return "Pour nous rejoindre, c'est simple ! 🚀\n\n1️⃣ Crée ton compte sur notre site\n2️⃣ Ouvre un compte chez RaiseFX (notre broker partenaire)\n3️⃣ Accède immédiatement au Discord VIP\n\nTout le processus prend moins de 10 minutes ! Clique sur 'Mon Compte' dans le menu pour commencer.";
  }
  
  // Questions sur RaiseFX
  if (message.match(/\b(raisefx|broker|courtier)\b/)) {
    return "RaiseFX est notre broker partenaire de confiance ! 🏦 C'est un broker régulé avec des spreads compétitifs et une exécution rapide. C'est grâce à ce partenariat qu'on peut t'offrir l'accès gratuit à tout notre contenu premium.";
  }
  
  // Questions sur les formations
  if (message.match(/\b(formation|apprendre|cours|tutoriel|débutant|trader)\b/)) {
    return "Nos formations couvrent tout ! 📚\n\n• Bases du trading pour débutants\n• Analyse technique avancée\n• Money management\n• Psychologie du trader\n• Stratégies de Mickaël\n\nTout est en vidéo, accessible 24/7 sur ton espace membre.";
  }
  
  // Questions sur Discord
  if (message.match(/\b(discord|communauté|membres|chat|groupe)\b/)) {
    return "Notre Discord VIP c'est le cœur d'Invest Infinity ! 💬\n\n• Alertes trading quotidiennes\n• Lives hebdomadaires avec Mickaël\n• Entraide entre +100 membres actifs\n• Analyses détaillées de chaque position\n\nUne vraie communauté de traders motivés !";
  }
  
  // Questions sur Mickaël
  if (message.match(/\b(mickaël|mickael|michael|mentor|coach|fondateur)\b/)) {
    return "Mickaël est notre fondateur et trader principal ! 🎯 Il partage quotidiennement ses analyses et positions avec la communauté. Son objectif : te rendre autonome et rentable. Tu peux voir son track record complet sur le Discord.";
  }
  
  // Questions sur les alertes/signaux
  if (message.match(/\b(alerte|signal|position|trade|setup)\b/)) {
    return "Mickaël partage ses positions quotidiennement ! 📊 Mais attention : on ne fait pas de 'signaux' à copier bêtement. Chaque position est accompagnée d'une analyse complète pour que tu comprennes le POURQUOI. L'objectif est de te former, pas de te rendre dépendant.";
  }
  
  // Questions sur le contact/support
  if (message.match(/\b(contact|aide|support|problème|question)\b/)) {
    return "Tu peux nous contacter de plusieurs façons ! 📞\n\n• Sur Discord : @investinfinity\n• Via le formulaire de contact du site\n• En direct pendant les lives\n\nOn répond généralement sous 24h, souvent beaucoup plus vite !";
  }
  
  // Questions sur les résultats
  if (message.match(/\b(résultat|performance|gain|profit|rentable|argent)\b/)) {
    return "Mickaël partage ses résultats en toute transparence ! 📈 Tu peux voir son track record complet sur le Discord avec les gains ET les pertes. Il vise un Risk/Reward de 3:1 en moyenne. Attention : les performances passées ne garantissent pas les résultats futurs.";
  }
  
  // Remerciements
  if (message.match(/\b(merci|thanks|cool|super|parfait|génial)\b/)) {
    return "Avec plaisir ! 😊 N'hésite pas si tu as d'autres questions. On est là pour t'aider à devenir un trader autonome et rentable ! 🚀";
  }
  
  // Au revoir
  if (message.match(/\b(bye|au revoir|à bientôt|ciao|salut)\b/) && message.length < 20) {
    return "À très vite ! 👋 N'oublie pas : rejoindre Invest Infinity c'est gratuit. On t'attend sur le Discord ! 🎉";
  }
  
  // Réponse par défaut
  return "Je ne suis pas sûr de bien comprendre ta question. 🤔 Tu peux me demander des infos sur :\n\n• Nos formations\n• Comment rejoindre Invest Infinity\n• Le Discord et la communauté\n• RaiseFX notre broker partenaire\n• Les alertes de Mickaël\n\nOu contacte-nous directement sur Discord pour une réponse personnalisée !";
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Salut ! 👋 Je suis l'assistant virtuel d'Invest Infinity. Comment puis-je t'aider aujourd'hui ?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

  // Animation du badge de notification
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setHasNewMessage(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simuler un délai de réponse pour un effet plus naturel
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Comment rejoindre ?",
    "C'est vraiment gratuit ?",
    "Qu'est-ce que RaiseFX ?"
  ];

  return (
    <>
      {/* Chat Window */}
      <div
        className={`
          fixed bottom-24 right-4 sm:right-6 z-50
          w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px]
          bg-[#0f0f13] rounded-2xl
          border border-pink-500/20
          shadow-2xl shadow-pink-500/10
          transform transition-all duration-500 ease-out
          ${isOpen 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }
        `}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-pink-500/20 to-violet-500/20 p-4 rounded-t-2xl border-b border-pink-500/20">
          <div className="absolute inset-0 bg-[#0f0f13]/80 rounded-t-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f13]" />
              </div>
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  Assistant II
                  <Sparkles size={14} className="text-pink-400" />
                </h3>
                <p className="text-xs text-gray-400">Toujours disponible</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Fermer le chat"
            >
              <Minimize2 size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[350px] overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
              style={{
                animation: `fadeSlideIn 0.3s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Avatar */}
              <div className={`
                w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                ${message.sender === 'bot' 
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500' 
                  : 'bg-slate-700'
                }
              `}>
                {message.sender === 'bot' ? (
                  <Bot size={16} className="text-white" />
                ) : (
                  <User size={16} className="text-gray-300" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`
                max-w-[75%] px-4 py-3 rounded-2xl whitespace-pre-line
                ${message.sender === 'bot'
                  ? 'bg-[#1f1f23] text-gray-200 rounded-bl-md'
                  : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-br-md'
                }
              `}>
                <p className="text-sm leading-relaxed">{message.content}</p>
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

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Questions fréquentes :</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputValue(question);
                    setTimeout(() => handleSend(), 100);
                  }}
                  className="text-xs px-3 py-1.5 bg-pink-500/10 text-pink-400 rounded-full hover:bg-pink-500/20 transition-colors border border-pink-500/20"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-pink-500/10">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écris ton message..."
              className="flex-1 bg-[#1f1f23] text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-pink-500/10 focus:border-pink-500/30 focus:outline-none transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={`
                p-3 rounded-xl transition-all duration-300
                ${inputValue.trim() && !isTyping
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:shadow-lg hover:shadow-pink-500/30 hover:scale-105'
                  : 'bg-[#1f1f23] text-gray-500 cursor-not-allowed'
                }
              `}
              aria-label="Envoyer"
            >
              {isTyping ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-4 right-4 sm:right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-r from-pink-500 to-violet-500
          text-white shadow-lg shadow-pink-500/30
          flex items-center justify-center
          transition-all duration-500 ease-out
          hover:scale-110 hover:shadow-xl hover:shadow-pink-500/40
          ${isOpen ? 'rotate-0' : 'rotate-0'}
        `}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        <div className="relative">
          {isOpen ? (
            <X size={24} className="transition-transform duration-300" />
          ) : (
            <>
              <MessageCircle size={24} className="transition-transform duration-300" />
              {/* Notification Badge */}
              {hasNewMessage && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </>
          )}
        </div>
        
        {/* Pulse Effect */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-pink-500 animate-ping opacity-20" />
        )}
      </button>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(236, 72, 153, 0.3);
          border-radius: 2px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(236, 72, 153, 0.5);
        }
      `}</style>
    </>
  );
}

