import { useState, useEffect, useCallback } from 'react';
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
  actionRequirements,
} from './types';
import {
  logChatOpen,
  logChatClose,
  logMessageSent,
  logQuickReplyClick,
  logActionExecuted,
  logFeedback,
} from './chatbotLogger';

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
  const hasLicense = profile?.license && profile.license !== 'none';

  // Vérifier si une action est autorisée
  const checkActionPermission = useCallback((action: string): { allowed: boolean; reason?: string } => {
    const requirements = actionRequirements[action];
    if (!requirements) return { allowed: true };

    if (requirements.requiresAdmin && role !== 'admin') {
      return { allowed: false, reason: 'admin' };
    }
    if (requirements.requiresAuth && !user) {
      return { allowed: false, reason: 'auth' };
    }
    if (requirements.requiresLicense && !hasLicense) {
      return { allowed: false, reason: 'license' };
    }

    return { allowed: true };
  }, [user, role, hasLicense]);

  // Filtrer les quick replies selon les permissions
  const filterQuickReplies = useCallback((replies: QuickReply[]): QuickReply[] => {
    return replies.filter(reply => {
      // Toujours afficher les boutons sans restriction
      if (!reply.requiresAuth && !reply.requiresLicense && !reply.requiresAdmin) {
        return true;
      }
      // Afficher les boutons avec restriction mais indiquer qu'ils sont verrouillés
      // L'utilisateur pourra cliquer et recevoir un message explicatif
      return true;
    });
  }, []);

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
      const filteredReplies = filterQuickReplies(config.quickReplies);
      const welcomeMessage: Message = {
        id: generateId(),
        content: config.welcomeMessage,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: filteredReplies,
      };
      setMessages([welcomeMessage]);
      setHasShownWelcome(true);
      logChatOpen(userType, user?.id);
    }
  }, [isOpen, hasShownWelcome, config, filterQuickReplies, userType, user?.id]);

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
        // Filtrer les followUp selon les permissions
        const filteredFollowUp = faq.followUp ? filterQuickReplies(faq.followUp) : undefined;
        return { answer: faq.answer, followUp: filteredFollowUp };
      }
    }

    return null;
  };

  // Ajouter le fallback hint aux réponses
  const addFallbackHint = (content: string): string => {
    return content + defaultResponses.fallbackHint;
  };

  // Gérer les actions des quick replies
  const handleAction = useCallback((action: string) => {
    // Logger le clic
    logQuickReplyClick(userType, action, user?.id);

    // Vérifier les permissions
    const permission = checkActionPermission(action);
    if (!permission.allowed) {
      let message = '';
      let quickReplies: QuickReply[] = [];

      switch (permission.reason) {
        case 'auth':
          message = defaultResponses.authRequired;
          quickReplies = [
            { id: 'register', label: "S'inscrire", action: 'open_register', icon: '🚀' },
            { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
          ];
          break;
        case 'license':
          message = defaultResponses.licenseRequired;
          quickReplies = [
            { id: 'pricing', label: 'Voir les offres', action: 'show_pricing', icon: '💎' },
            { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
          ];
          break;
        case 'admin':
          message = defaultResponses.accessDenied;
          quickReplies = [
            { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
          ];
          break;
      }

      logActionExecuted(userType, action, false, user?.id, permission.reason);
      addBotMessage(addFallbackHint(message), quickReplies, true);
      return;
    }

    // Exécuter l'action
    switch (action) {
      case 'discover_offer':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          addFallbackHint(
            "InvestInfinity t'offre un accompagnement complet pour devenir un trader autonome :\n\n" +
            "📊 **Analyses quotidiennes** par nos experts\n" +
            "📚 **Formation complète** de débutant à avancé\n" +
            "🎥 **Lives hebdomadaires** pour apprendre en temps réel\n" +
            "💬 **Communauté Discord** active et bienveillante\n" +
            "🎯 **Accompagnement personnalisé** selon ta formule\n\n" +
            "⚠️ **Disclaimer** : Le trading comporte des risques. Nos services sont éducatifs."
          ),
          [
            { id: 'pricing', label: 'Voir les tarifs', action: 'show_pricing', icon: '💎' },
            { id: 'register', label: "S'inscrire", action: 'open_register', icon: '🚀' },
          ],
          true
        );
        break;

      case 'show_pricing':
      case 'go_pricing':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Voici nos formules :\n\n" +
          "💎 **Starter** - Pour bien débuter\n" +
          "💎 **Pro** - Notre formule la plus populaire\n" +
          "💎 **Elite** - L'accompagnement complet\n\n" +
          "Je t'emmène sur la page des tarifs pour voir tous les détails !",
          [{ id: 'back', label: 'Autre question', action: 'other_question', icon: '❓' }],
          true
        );
        setTimeout(() => navigate('/pricing'), 1500);
        break;

      case 'show_testimonials':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          addFallbackHint(
            "Nos membres sont notre meilleure publicité ! 🌟\n\n" +
            "Tu peux consulter les avis sur notre page d'accueil ou directement sur notre Discord.\n\n" +
            "Notre communauté compte +100 membres actifs qui progressent ensemble chaque jour."
          ),
          [
            { id: 'register', label: "Rejoindre", action: 'open_register', icon: '🚀' },
            { id: 'discord', label: 'Voir Discord', action: 'join_discord', icon: '💬' },
          ],
          true
        );
        break;

      case 'open_register':
        logActionExecuted(userType, action, true, user?.id);
        if (user) {
          addBotMessage(
            addFallbackHint("Tu es déjà connecté ! 👋\n\nQue souhaites-tu faire ?"),
            [
              { id: 'training', label: 'Accéder à la formation', action: 'go_training', icon: '📚' },
              { id: 'account', label: 'Mon compte', action: 'go_account', icon: '👤' },
            ],
            true
          );
        } else {
          addBotMessage(
            addFallbackHint(
              "Super ! 🎉 Tu fais le bon choix.\n\n" +
              "Clique sur 'Mon Compte' en haut à droite puis 'Créer un compte' pour commencer.\n\n" +
              "L'inscription prend moins de 2 minutes !"
            ),
            [{ id: 'pricing', label: 'Voir les tarifs avant', action: 'show_pricing', icon: '💎' }],
            true
          );
        }
        break;

      case 'contact_human':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          addFallbackHint(defaultResponses.humanEscalation),
          [
            { id: 'discord', label: 'Aller sur Discord', action: 'join_discord', icon: '💬' },
            { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
          ],
          true
        );
        break;

      case 'go_training':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Je t'emmène vers ta formation ! 📚\n\n" +
          "Tu y trouveras tous les modules disponibles selon ta formule.",
          [{ id: 'back', label: 'Autre question', action: 'other_question', icon: '❓' }],
          true
        );
        setTimeout(() => navigate('/app/training'), 1500);
        break;

      case 'go_account':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Je t'emmène vers ton espace compte ! 👤",
          [{ id: 'back', label: 'Autre question', action: 'other_question', icon: '❓' }],
          true
        );
        setTimeout(() => navigate('/app/settings'), 1500);
        break;

      case 'show_subscription':
        logActionExecuted(userType, action, true, user?.id);
        const license = profile?.license || 'none';
        addBotMessage(
          addFallbackHint(
            `Voici les infos de ton abonnement :\n\n` +
            `📋 **Formule actuelle** : ${license === 'none' ? 'Aucune' : license.charAt(0).toUpperCase() + license.slice(1)}\n\n` +
            `Tu peux gérer ton abonnement depuis ton espace membre.`
          ),
          [
            { id: 'account', label: 'Gérer mon compte', action: 'go_account', icon: '👤' },
            { id: 'upgrade', label: 'Changer de formule', action: 'show_pricing', icon: '⬆️' },
          ],
          true
        );
        break;

      case 'tech_support':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          addFallbackHint(
            "Tu rencontres un problème technique ? 🔧\n\n" +
            "Voici quelques solutions courantes :\n\n" +
            "• **Vidéo qui ne charge pas** : Rafraîchis la page ou vide le cache\n" +
            "• **Problème de connexion** : Vérifie tes identifiants ou réinitialise ton mot de passe\n" +
            "• **Accès refusé** : Vérifie que ton abonnement est actif\n\n" +
            "Si le problème persiste, contacte-nous sur Discord !"
          ),
          [
            { id: 'discord', label: 'Contacter sur Discord', action: 'join_discord', icon: '💬' },
            { id: 'other', label: 'Autre problème', action: 'contact_human', icon: '👤' },
          ],
          true
        );
        break;

      case 'join_discord':
        logActionExecuted(userType, action, true, user?.id);
        if (user) {
          addBotMessage(
            addFallbackHint(
              "Notre communauté Discord t'attend ! 💬\n\n" +
              "Tu y trouveras :\n" +
              "• Les lives trading\n" +
              "• La zone d'échange avec les autres membres\n" +
              "• Le support direct avec l'équipe\n\n" +
              "Le lien Discord est disponible dans ton espace membre."
            ),
            [
              { id: 'training', label: 'Aller à la formation', action: 'go_training', icon: '📚' },
              { id: 'back', label: 'Autre question', action: 'other_question', icon: '❓' },
            ],
            true
          );
        } else {
          addBotMessage(
            addFallbackHint(
              "Notre communauté Discord est réservée aux membres ! 💬\n\n" +
              "Inscris-toi pour accéder au Discord et à tous nos contenus."
            ),
            [
              { id: 'register', label: "S'inscrire", action: 'open_register', icon: '🚀' },
              { id: 'pricing', label: 'Voir les offres', action: 'show_pricing', icon: '💎' },
            ],
            true
          );
        }
        break;

      case 'show_stats':
      case 'list_users':
      case 'show_subscriptions':
      case 'generate_report':
      case 'show_alerts':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "📊 **Fonctionnalité admin**\n\n" +
          "Cette fonctionnalité sera disponible prochainement dans le dashboard admin.\n\n" +
          "En attendant, tu peux accéder au dashboard admin directement.",
          [
            { id: 'dashboard', label: 'Dashboard Admin', action: 'go_admin', icon: '📊' },
            { id: 'back', label: 'Autre question', action: 'other_question', icon: '❓' },
          ],
          true
        );
        break;

      case 'go_admin':
        logActionExecuted(userType, action, true, user?.id);
        navigate('/admin');
        break;

      case 'other_question':
        logActionExecuted(userType, action, true, user?.id);
        const filteredReplies = filterQuickReplies(config.quickReplies);
        addBotMessage(
          "Bien sûr ! Pose-moi ta question ou choisis une option ci-dessous 👇\n\n" +
          "*Tu peux aussi taper librement ta question si tu ne trouves pas ce que tu cherches.*",
          filteredReplies,
          false // Pas de feedback pour ce message
        );
        break;

      default:
        logActionExecuted(userType, action, false, user?.id, 'unknown_action');
        addBotMessage(
          addFallbackHint("Cette fonctionnalité arrive bientôt ! En attendant, n'hésite pas à me poser d'autres questions."),
          [{ id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' }],
          true
        );
    }
  }, [navigate, user, profile, role, userType, config.quickReplies, checkActionPermission, filterQuickReplies]);

  // Ajouter un message du bot avec délai de frappe
  const addBotMessage = useCallback((content: string, quickReplies?: QuickReply[], showFeedback: boolean = false) => {
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
        showFeedback,
        feedbackGiven: null,
      };
      setMessages(prev => [...prev, botMessage]);
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, typingDelay);
  }, [isOpen]);

  // Gérer l'envoi d'un message utilisateur
  const handleSendMessage = useCallback((content: string) => {
    // Logger le message
    logMessageSent(userType, content, user?.id);

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
      addBotMessage(addFallbackHint(faqResponse.answer), faqResponse.followUp, true);
    } else {
      // Réponse par défaut si pas trouvé dans la FAQ
      const filteredReplies = filterQuickReplies(config.quickReplies);
      addBotMessage(
        defaultResponses.notUnderstood + "\n\n" +
        "*Tu peux reformuler ta question, choisir une option ci-dessous, ou contacter notre équipe pour une aide personnalisée.*",
        [
          ...filteredReplies.slice(0, 3),
          { id: 'human', label: 'Parler à un humain', action: 'contact_human', icon: '👤' },
        ],
        true
      );
    }
  }, [addBotMessage, config.quickReplies, filterQuickReplies, userType, user?.id]);

  // Gérer le quick reply
  const handleQuickReply = useCallback((action: string) => {
    handleAction(action);
  }, [handleAction]);

  // Gérer le feedback
  const handleFeedback = useCallback((messageId: string, isPositive: boolean) => {
    // Logger le feedback
    logFeedback(userType, messageId, isPositive, user?.id);

    // Mettre à jour le message avec le feedback
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedbackGiven: isPositive ? 'positive' : 'negative' }
        : msg
    ));
  }, [userType, user?.id]);

  // Reset la conversation
  const handleReset = useCallback(() => {
    const filteredReplies = filterQuickReplies(config.quickReplies);
    const welcomeMessage: Message = {
      id: generateId(),
      content: config.welcomeMessage,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: filteredReplies,
    };
    setMessages([welcomeMessage]);
  }, [config, filterQuickReplies]);

  // Toggle le chat
  const handleToggle = useCallback(() => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      logChatOpen(userType, user?.id);
    } else {
      logChatClose(userType, user?.id);
    }
    
    if (isMinimized) {
      setIsMinimized(false);
    }
  }, [isOpen, isMinimized, userType, user?.id]);

  return (
    // Position ajustée : bottom-24 sur mobile pour éviter la BottomNav, bottom-6 sur desktop
    <div className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 flex flex-col items-end gap-4">
      <ChatWindow
        isOpen={isOpen}
        messages={messages}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
        onQuickReply={handleQuickReply}
        onFeedback={handleFeedback}
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
