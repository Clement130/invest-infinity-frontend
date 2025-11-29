import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatWidget from './ChatWidget';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';
import {
  type Message,
  type UserType,
  type QuickReply,
  chatbotConfigs,
  faqDatabase,
  defaultResponses,
} from './types';

// Générer un ID unique
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function Chatbot() {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Déterminer le type d'utilisateur
  const getUserType = useCallback((): UserType => {
    if (!user) return 'visitor';
    if (role === 'admin') return 'admin';
    return 'client';
  }, [user, role]);

  const userType = getUserType();
  const config = chatbotConfigs[userType];

  // Écouter l'événement custom pour ouvrir le chatbot
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener('openChatbot', handleOpenChatbot);
    return () => window.removeEventListener('openChatbot', handleOpenChatbot);
  }, []);

  // Message de bienvenue au premier ouverture
  useEffect(() => {
    if (isOpen && !hasShownWelcome) {
      const welcomeMessage: Message = {
        id: generateId(),
        content: config.welcomeMessage,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: config.quickReplies,
      };
      setMessages([welcomeMessage]);
      setHasShownWelcome(true);
    }
  }, [isOpen, hasShownWelcome, config]);

  // Reset unread count when opening
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Trouver une réponse dans la FAQ
  const findFAQResponse = (query: string): { answer: string; followUp?: QuickReply[] } | null => {
    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    for (const faq of faqDatabase) {
      const matchScore = faq.keywords.reduce((score, keyword) => {
        const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedQuery.includes(normalizedKeyword)) {
          return score + 1;
        }
        return score;
      }, 0);

      if (matchScore >= 1) {
        return { answer: faq.answer, followUp: faq.followUp };
      }
    }

    return null;
  };

  // Gérer les actions des quick replies
  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'discover_offer':
        addBotMessage(
          "InvestInfinity t'offre un accompagnement complet pour devenir un trader autonome :\n\n" +
          "📊 **Analyses quotidiennes** par nos experts\n" +
          "📚 **Formation complète** de débutant à avancé\n" +
          "🎥 **Lives hebdomadaires** pour apprendre en temps réel\n" +
          "💬 **Communauté Discord** active et bienveillante\n" +
          "🎯 **Accompagnement personnalisé** selon ta formule\n\n" +
          "⚠️ **Disclaimer** : Le trading comporte des risques. Nos services sont éducatifs.",
          [
            { id: 'pricing', label: 'Voir les tarifs', action: 'show_pricing', icon: '💎' },
            { id: 'register', label: "S'inscrire", action: 'open_register', icon: '🚀' },
          ]
        );
        break;

      case 'show_pricing':
      case 'go_pricing':
        addBotMessage(
          "Voici nos formules :\n\n" +
          "💎 **Starter** - Pour bien débuter\n" +
          "💎 **Pro** - Notre formule la plus populaire\n" +
          "💎 **Elite** - L'accompagnement complet\n\n" +
          "Je t'emmène sur la page des tarifs pour voir tous les détails !",
          [{ id: 'back', label: 'Autre question', action: 'other_question', icon: '❓' }]
        );
        setTimeout(() => navigate('/pricing'), 1500);
        break;

      case 'show_testimonials':
        addBotMessage(
          "Nos membres sont notre meilleure publicité ! 🌟\n\n" +
          "Tu peux consulter les avis sur notre page d'accueil ou directement sur notre Discord.\n\n" +
          "Notre communauté compte +100 membres actifs qui progressent ensemble chaque jour.",
          [
            { id: 'register', label: "Rejoindre", action: 'open_register', icon: '🚀' },
            { id: 'discord', label: 'Voir Discord', action: 'join_discord', icon: '💬' },
          ]
        );
        break;

      case 'open_register':
        addBotMessage(
          "Super ! 🎉 Tu fais le bon choix.\n\n" +
          "Clique sur 'Mon Compte' en haut à droite puis 'Créer un compte' pour commencer.\n\n" +
          "L'inscription prend moins de 2 minutes !",
          [{ id: 'pricing', label: 'Voir les tarifs avant', action: 'show_pricing', icon: '💎' }]
        );
        break;

      case 'contact_human':
        addBotMessage(
          defaultResponses.humanEscalation,
          [
            { id: 'discord', label: 'Aller sur Discord', action: 'join_discord', icon: '💬' },
            { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
          ]
        );
        break;

      case 'go_training':
        if (user) {
          addBotMessage(
            "Je t'emmène vers ta formation ! 📚\n\n" +
            "Tu y trouveras tous les modules disponibles selon ta formule.",
            [{ id: 'back', label: 'Autre question', action: 'other_question', icon: '❓' }]
          );
          setTimeout(() => navigate('/dashboard/training'), 1500);
        } else {
          addBotMessage(
            "Tu dois être connecté pour accéder à la formation. 🔐\n\n" +
            "Connecte-toi via 'Mon Compte' en haut à droite.",
            [{ id: 'register', label: "S'inscrire", action: 'open_register', icon: '🚀' }]
          );
        }
        break;

      case 'go_account':
        if (user) {
          addBotMessage(
            "Je t'emmène vers ton espace compte ! 👤",
            [{ id: 'back', label: 'Autre question', action: 'other_question', icon: '❓' }]
          );
          setTimeout(() => navigate('/dashboard/settings'), 1500);
        } else {
          addBotMessage(
            "Tu dois être connecté pour accéder à ton compte. 🔐",
            [{ id: 'register', label: "S'inscrire", action: 'open_register', icon: '🚀' }]
          );
        }
        break;

      case 'show_subscription':
        if (user && profile) {
          const license = profile.license || 'none';
          addBotMessage(
            `Voici les infos de ton abonnement :\n\n` +
            `📋 **Formule actuelle** : ${license === 'none' ? 'Aucune' : license.charAt(0).toUpperCase() + license.slice(1)}\n\n` +
            `Tu peux gérer ton abonnement depuis ton espace membre.`,
            [
              { id: 'account', label: 'Gérer mon compte', action: 'go_account', icon: '👤' },
              { id: 'upgrade', label: 'Changer de formule', action: 'show_pricing', icon: '⬆️' },
            ]
          );
        } else {
          addBotMessage(
            "Tu dois être connecté pour voir ton abonnement. 🔐",
            [{ id: 'register', label: "S'inscrire", action: 'open_register', icon: '🚀' }]
          );
        }
        break;

      case 'tech_support':
        addBotMessage(
          "Tu rencontres un problème technique ? 🔧\n\n" +
          "Voici quelques solutions courantes :\n\n" +
          "• **Vidéo qui ne charge pas** : Rafraîchis la page ou vide le cache\n" +
          "• **Problème de connexion** : Vérifie tes identifiants ou réinitialise ton mot de passe\n" +
          "• **Accès refusé** : Vérifie que ton abonnement est actif\n\n" +
          "Si le problème persiste, contacte-nous sur Discord !",
          [
            { id: 'discord', label: 'Contacter sur Discord', action: 'join_discord', icon: '💬' },
            { id: 'other', label: 'Autre problème', action: 'contact_human', icon: '👤' },
          ]
        );
        break;

      case 'join_discord':
        addBotMessage(
          "Notre communauté Discord t'attend ! 💬\n\n" +
          "Tu y trouveras :\n" +
          "• Les lives trading\n" +
          "• La zone d'échange avec les autres membres\n" +
          "• Le support direct avec l'équipe\n\n" +
          "Le lien Discord est disponible dans ton espace membre une fois connecté.",
          [{ id: 'back', label: 'Autre question', action: 'other_question', icon: '❓' }]
        );
        break;

      case 'show_stats':
        if (role === 'admin') {
          addBotMessage(
            "📊 **Statistiques** (fonctionnalité admin)\n\n" +
            "Cette fonctionnalité sera disponible prochainement.\n\n" +
            "En attendant, tu peux accéder au dashboard admin.",
            [{ id: 'dashboard', label: 'Dashboard Admin', action: 'go_admin', icon: '📊' }]
          );
        } else {
          addBotMessage(defaultResponses.accessDenied);
        }
        break;

      case 'go_admin':
        if (role === 'admin') {
          navigate('/admin');
        }
        break;

      case 'other_question':
        addBotMessage(
          "Bien sûr ! Pose-moi ta question ou choisis une option ci-dessous 👇",
          config.quickReplies
        );
        break;

      default:
        addBotMessage(
          "Cette fonctionnalité arrive bientôt ! En attendant, n'hésite pas à me poser d'autres questions.",
          [{ id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' }]
        );
    }
  }, [navigate, user, profile, role, config.quickReplies]);

  // Ajouter un message du bot avec délai de frappe
  const addBotMessage = useCallback((content: string, quickReplies?: QuickReply[]) => {
    setIsTyping(true);
    
    // Simuler le temps de frappe (entre 500ms et 1500ms selon la longueur)
    const typingDelay = Math.min(500 + content.length * 5, 1500);
    
    setTimeout(() => {
      setIsTyping(false);
      const botMessage: Message = {
        id: generateId(),
        content,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies,
      };
      setMessages(prev => [...prev, botMessage]);
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, typingDelay);
  }, [isOpen]);

  // Gérer l'envoi d'un message utilisateur
  const handleSendMessage = useCallback((content: string) => {
    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: generateId(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Chercher une réponse dans la FAQ
    const faqResponse = findFAQResponse(content);
    
    if (faqResponse) {
      addBotMessage(faqResponse.answer, faqResponse.followUp);
    } else {
      // Réponse par défaut si pas trouvé dans la FAQ
      addBotMessage(
        defaultResponses.notUnderstood,
        [
          ...config.quickReplies.slice(0, 3),
          { id: 'human', label: 'Parler à un humain', action: 'contact_human', icon: '👤' },
        ]
      );
    }
  }, [addBotMessage, config.quickReplies]);

  // Gérer le quick reply
  const handleQuickReply = useCallback((action: string) => {
    handleAction(action);
  }, [handleAction]);

  // Reset la conversation
  const handleReset = useCallback(() => {
    const welcomeMessage: Message = {
      id: generateId(),
      content: config.welcomeMessage,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: config.quickReplies,
    };
    setMessages([welcomeMessage]);
  }, [config]);

  // Toggle le chat
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    if (isMinimized) {
      setIsMinimized(false);
    }
  }, [isMinimized]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <ChatWindow
        isOpen={isOpen}
        messages={messages}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
        onQuickReply={handleQuickReply}
        onReset={handleReset}
        botName={config.botName}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(prev => !prev)}
      />
      
      <ChatWidget
        isOpen={isOpen}
        onToggle={handleToggle}
        unreadCount={unreadCount}
      />
    </div>
  );
}

