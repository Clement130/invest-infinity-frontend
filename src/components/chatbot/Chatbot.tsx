import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
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
import type { Attachment } from './ChatInput';
import { CHATBOT_INTENTS } from '../../config/chatbot/faqIntents';
import {
  logChatOpen,
  logChatClose,
  logMessageSent,
  logQuickReplyClick,
  logActionExecuted,
  logFeedback,
} from './chatbotLogger';
import {
  submitAppointmentRequest,
  validateEmail,
  validatePhone,
} from '../../services/appointmentService';
import type {
  RdvFlowStep,
  CreateAppointmentPayload,
  AppointmentType,
  AppointmentSource,
  ContactFlowStep,
  ContactRequestPayload,
  ContactRequestType,
  SupportFlowStep,
  SupportRequestPayload,
  SupportProblemType,
} from '../../types/appointment';
import {
  contactTypeLabels,
  supportProblemLabels,
} from '../../types/appointment';
import type { ChatbotContext, ChatbotUserRole } from '../../config/chatbot/systemPrompt';

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Gestion de la connexion internet
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // État pour le flux de planification RDV (machine à états complète)
  const [rdvFlow, setRdvFlow] = useState<{
    active: boolean;
    step: RdvFlowStep;
    data: Partial<CreateAppointmentPayload>;
    context?: {
      offerId?: string;
      offerName?: string;
      source?: AppointmentSource;
      sessionId?: string;
    };
  }>({
    active: false,
    step: 'ASK_NAME',
    data: {},
    context: undefined,
  });

  // État pour le flux de CONTACT intelligent (remplace le formulaire)
  const [contactFlow, setContactFlow] = useState<{
    active: boolean;
    step: ContactFlowStep;
    data: Partial<ContactRequestPayload>;
  }>({
    active: false,
    step: 'ASK_NAME',
    data: {},
  });

  // État pour le flux de SUPPORT TECHNIQUE (clients)
  const [supportFlow, setSupportFlow] = useState<{
    active: boolean;
    step: SupportFlowStep;
    data: Partial<SupportRequestPayload>;
  }>({
    active: false,
    step: 'ASK_NAME',
    data: {},
  });

  // Déterminer le type d'utilisateur
  const getUserType = useCallback((): UserType => {
    if (!user) return 'visitor';
    if (role === 'admin') return 'admin';
    return 'client';
  }, [user, role]);

  // Déterminer le rôle pour le chatbot (prospect, client, admin)
  const getChatbotRole = useCallback((): ChatbotUserRole => {
    if (!user) return 'prospect';
    if (role === 'admin') return 'admin';
    // Si l'utilisateur a une licence active, c'est un client
    if (profile?.license && profile.license !== 'none') return 'client';
    return 'prospect';
  }, [user, role, profile?.license]);

  // Construire le contexte pour le chatbot
  const buildChatbotContext = useCallback((): ChatbotContext => {
    const chatbotRole = getChatbotRole();
    const context: ChatbotContext = {
      userRole: chatbotRole,
    };

    // Ajouter les infos utilisateur si connecté
    if (user) {
      if (profile?.first_name) {
        context.userName = profile.first_name;
      }
      if (user.email) {
        context.userEmail = user.email;
      }
    }

    // Ajouter les offres du client si disponibles
    if (chatbotRole === 'client' && profile?.license) {
      context.customerOffers = [profile.license];
    }

    return context;
  }, [user, profile, getChatbotRole]);

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
    const handleOpenChatbot = (event: Event) => {
      setIsOpen(true);
      setIsMinimized(false);
      
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      
      // Si c'est pour planifier un RDV Bootcamp Élite (nouveau flow)
      if (detail.flow === 'reservation_bootcamp_elite') {
        setRdvFlow({
          active: true,
          step: 'ASK_NAME',
          data: {
            offerId: detail.offerId || 'immersion_elite',
            offerName: detail.offerName || 'Bootcamp Élite',
            source: (detail.source as AppointmentSource) || 'pricing_page_cta',
          },
          context: {
            offerId: detail.offerId || 'immersion_elite',
            offerName: detail.offerName || 'Bootcamp Élite',
            source: (detail.source as AppointmentSource) || 'pricing_page_cta',
            sessionId: detail.sessionId,
          },
        });
        setHasShownWelcome(false);
        return;
      }
      
      // Ancien format (compatibilité avec ImmersionElitePage)
      if (detail.action === 'planifier_rdv') {
        setRdvFlow({
          active: true,
          step: 'ASK_NAME',
          data: {
            offerId: 'immersion_elite',
            offerName: 'Bootcamp Élite',
            source: 'immersion_page_cta',
          },
          context: {
            offerId: 'immersion_elite',
            offerName: 'Bootcamp Élite',
            source: 'immersion_page_cta',
            sessionId: detail.sessionId,
          },
        });
        setHasShownWelcome(false);
      }
    };

    window.addEventListener('openChatbot', handleOpenChatbot as EventListener);
    return () => window.removeEventListener('openChatbot', handleOpenChatbot as EventListener);
  }, []);

  // Message de bienvenue au premier ouverture ou démarrage du flux RDV
  useEffect(() => {
    if (isOpen && !hasShownWelcome) {
      // Si c'est pour planifier un RDV Bootcamp Élite
      if (rdvFlow.active && rdvFlow.step === 'ASK_NAME') {
        const offerName = rdvFlow.context?.offerName || 'Bootcamp Élite';
        const rdvMessage: Message = {
          id: generateId(),
          content: `Salut 👋 On va planifier ton rendez-vous pour le **${offerName}**.\n\n` +
            `Je vais te poser quelques questions rapides pour que notre équipe puisse te recontacter.\n\n` +
            `🏷️ *Planification RDV - ${offerName}*\n\n` +
            `Pour commencer, peux-tu me donner ton **prénom et nom** ?`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages([rdvMessage]);
        setHasShownWelcome(true);
        logChatOpen(userType, user?.id);
        return;
      }
      
      // Message de bienvenue normal
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
  }, [isOpen, hasShownWelcome, config, filterQuickReplies, userType, user?.id, rdvFlow]);

  // Reset unread count when opening
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // ============================================
  // LOGIQUE HYBRIDE : LOCAL D'ABORD, GPT ENSUITE
  // ============================================
  
  // Trouver une réponse dans les Intents locaux (FAQ pré-remplies)
  // Cette fonction est appelée EN PREMIER avant tout appel à l'API OpenAI
  const findLocalIntent = (query: string): { intent: typeof CHATBOT_INTENTS[0] | null; source: 'LOCAL_FAQ' | 'NOT_FOUND' } => {
    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Score de correspondance simple basé sur les mots-clés
    let bestMatch = null;
    let maxScore = 0;

    for (const intent of CHATBOT_INTENTS) {
      for (const pattern of intent.patterns) {
        const normalizedPattern = pattern.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Match exact ou partiel fort
        if (normalizedQuery.includes(normalizedPattern)) {
          // Score basé sur la longueur du pattern (plus c'est précis, mieux c'est)
          const score = normalizedPattern.length;
          if (score > maxScore) {
            maxScore = score;
            bestMatch = intent;
          }
        }
      }
    }

    // Flag interne pour debug (non affiché à l'utilisateur)
    if (bestMatch) {
      console.log(`[Chatbot] Réponse trouvée: LOCAL_FAQ (intent: ${bestMatch.id})`);
      return { intent: bestMatch, source: 'LOCAL_FAQ' };
    }
    
    console.log('[Chatbot] Aucune réponse locale trouvée, fallback vers GPT');
    return { intent: null, source: 'NOT_FOUND' };
  };

  // Ajouter le fallback hint aux réponses
  const addFallbackHint = (content: string): string => {
    return content + defaultResponses.fallbackHint;
  };

  // Ajouter un message du bot avec délai de frappe
  // IMPORTANT: Cette fonction doit être définie AVANT handleAction qui l'utilise
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
      // ============================================
      // MENUS PRINCIPAUX STYLE AMAZON - VISITEURS
      // ============================================
      case 'menu_offers':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Nos offres de formation trading 💎\n\n" +
          "**Choisis ce qui t'intéresse :**",
          [
            { id: 'compare', label: 'Comparer les offres', action: 'show_difference_offers', icon: '⚖️' },
            { id: 'starter', label: 'Offre Starter', action: 'show_entree', icon: '🌱' },
            { id: 'premium', label: 'Offre Premium', action: 'show_transformation', icon: '🚀' },
            { id: 'bootcamp', label: 'Offre Bootcamp', action: 'show_immersion', icon: '👑' },
            { id: 'pricing', label: 'Voir les tarifs', action: 'go_pricing', icon: '💰' },
            { id: 'back', label: '← Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          false
        );
        break;

      case 'menu_help':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Je suis là pour t'aider ! 🆘\n\n" +
          "**Quel est ton problème ?**",
          [
            { id: 'help_account', label: 'Connexion / Compte', action: 'help_before_contact_account', icon: '🔐' },
            { id: 'help_payment', label: 'Paiement / Facture', action: 'help_before_contact_payment', icon: '💳' },
            { id: 'help_access', label: 'Accès formation', action: 'help_before_contact_access', icon: '🚫' },
            { id: 'help_video', label: 'Vidéo ne marche pas', action: 'help_before_contact_video', icon: '🎥' },
            { id: 'help_other', label: 'Autre problème', action: 'help_before_contact_other', icon: '❓' },
            { id: 'back', label: '← Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          false
        );
        break;

      case 'menu_faq':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Questions fréquentes ❓\n\n" +
          "**Choisis un sujet :**",
          [
            { id: 'faq_trading', label: 'Trading & Formation', action: 'faq_trading_menu', icon: '📊' },
            { id: 'faq_offers', label: 'Offres & Tarifs', action: 'faq_offers_menu', icon: '💎' },
            { id: 'faq_community', label: 'Communauté & Discord', action: 'faq_community_menu', icon: '💬' },
            { id: 'faq_tech', label: 'Technique & Accès', action: 'faq_tech_menu', icon: '⚙️' },
            { id: 'back', label: '← Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          false
        );
        break;

      case 'faq_trading_menu':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Questions sur le trading 📊\n\n" +
          "**Sélectionne ta question :**",
          [
            { id: 'q1', label: 'C\'est quoi InvestInfinity ?', action: 'faq_what_is_ii', icon: '🎯' },
            { id: 'q2', label: 'Je suis débutant, c\'est pour moi ?', action: 'faq_beginner', icon: '🌱' },
            { id: 'q3', label: 'Donnez-vous des signaux ?', action: 'faq_signals', icon: '📈' },
            { id: 'q4', label: 'Quand sont les lives ?', action: 'faq_lives', icon: '🎥' },
            { id: 'q5', label: 'Qu\'est-ce qu\'une Prop Firm ?', action: 'explain_propfirm', icon: '🏢' },
            { id: 'q6', label: 'Combien de temps pour apprendre ?', action: 'show_time_info', icon: '⏱️' },
            { id: 'back', label: '← Retour FAQ', action: 'menu_faq', icon: '🔙' },
          ],
          false
        );
        break;

      case 'faq_offers_menu':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Questions sur les offres 💎\n\n" +
          "**Sélectionne ta question :**",
          [
            { id: 'q1', label: 'Différences entre offres', action: 'show_difference_offers', icon: '⚖️' },
            { id: 'q2', label: 'Paiement en plusieurs fois', action: 'show_payment_info', icon: '💳' },
            { id: 'q3', label: 'Garantie 14 jours', action: 'show_guarantee', icon: '🛡️' },
            { id: 'q4', label: 'Comment changer d\'offre', action: 'show_upgrade_info', icon: '⬆️' },
            { id: 'q5', label: 'Voir les tarifs', action: 'go_pricing', icon: '💰' },
            { id: 'back', label: '← Retour FAQ', action: 'menu_faq', icon: '🔙' },
          ],
          false
        );
        break;

      case 'faq_community_menu':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Questions sur la communauté 💬\n\n" +
          "**Sélectionne ta question :**",
          [
            { id: 'q1', label: 'Comment rejoindre Discord ?', action: 'show_discord_info', icon: '💬' },
            { id: 'q2', label: 'Horaires des lives', action: 'faq_lives', icon: '📅' },
            { id: 'q3', label: 'Comment contacter le support ?', action: 'faq_support', icon: '🆘' },
            { id: 'back', label: '← Retour FAQ', action: 'menu_faq', icon: '🔙' },
          ],
          false
        );
        break;

      case 'faq_tech_menu':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Questions techniques ⚙️\n\n" +
          "**Sélectionne ta question :**",
          [
            { id: 'q1', label: 'Problème de connexion', action: 'help_before_contact_account', icon: '🔐' },
            { id: 'q2', label: 'Vidéo ne fonctionne pas', action: 'help_before_contact_video', icon: '🎥' },
            { id: 'q3', label: 'Mes données sont-elles sécurisées ?', action: 'faq_security', icon: '🔒' },
            { id: 'q4', label: 'Quel broker utiliser ?', action: 'faq_broker', icon: '🏦' },
            { id: 'back', label: '← Retour FAQ', action: 'menu_faq', icon: '🔙' },
          ],
          false
        );
        break;

      // Réponses FAQ individuelles
      case 'faq_what_is_ii':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "**InvestInfinity, c'est quoi ?** 🎯\n\n" +
          "Une communauté premium dédiée aux traders qui veulent progresser sérieusement !\n\n" +
          "**Tu accèdes à :**\n" +
          "📊 Analyses quotidiennes de nos experts\n" +
          "📚 Formations complètes (débutant → avancé)\n" +
          "🎥 Lives hebdomadaires\n" +
          "💬 Communauté Discord active (+100 membres)\n\n" +
          "**Notre mission :** T'accompagner pour devenir un trader autonome et rentable.\n\n" +
          "⚠️ *Le trading comporte des risques. Nos services sont éducatifs.*",
          [
            { id: 'pricing', label: 'Voir les offres', action: 'go_pricing', icon: '💎' },
            { id: 'back', label: '← Autres questions', action: 'faq_trading_menu', icon: '🔙' },
          ],
          true
        );
        break;

      case 'faq_beginner':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "**Je suis débutant, c'est pour moi ?** 🌱\n\n" +
          "**Carrément !** Nos formations commencent vraiment de zéro :\n\n" +
          "• Qu'est-ce qu'un pip ?\n" +
          "• Comment lire un graphique ?\n" +
          "• Les bases du money management\n" +
          "• ...\n\n" +
          "Tu seras guidé **pas à pas**. Et la communauté est là si tu bloques ! 💪",
          [
            { id: 'start', label: 'Commencer maintenant', action: 'go_pricing', icon: '🚀' },
            { id: 'back', label: '← Autres questions', action: 'faq_trading_menu', icon: '🔙' },
          ],
          true
        );
        break;

      case 'faq_signals':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "**Donnez-vous des signaux ?** 📈\n\n" +
          "**Non, et c'est volontaire !** On ne donne pas de \"signaux\" à copier bêtement.\n\n" +
          "Nos experts partagent leurs positions avec :\n" +
          "• Point d'entrée\n" +
          "• Stop-loss\n" +
          "• Take profit\n" +
          "• Et surtout le **POURQUOI** derrière chaque trade\n\n" +
          "**L'objectif :** Te rendre autonome, pas dépendant.\n\n" +
          "⚠️ *Information éducative, pas un conseil financier.*",
          [
            { id: 'discover', label: 'En savoir plus', action: 'menu_offers', icon: '✨' },
            { id: 'back', label: '← Autres questions', action: 'faq_trading_menu', icon: '🔙' },
          ],
          true
        );
        break;

      case 'faq_lives':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "**Horaires des lives trading** 📅\n\n" +
          "**Lundi & Mardi :** 16h - 17h30\n" +
          "**Mercredi à Vendredi :** 15h - 17h30\n\n" +
          "Tu peux poser tes questions directement à nos experts pendant les lives ! 🎙️\n\n" +
          "*Les lives sont accessibles sur Discord.*",
          [
            { id: 'discord', label: 'Rejoindre Discord', action: 'join_discord', icon: '💬' },
            { id: 'back', label: '← Autres questions', action: 'faq_trading_menu', icon: '🔙' },
          ],
          true
        );
        break;

      case 'faq_support':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "**Comment contacter le support ?** 🆘\n\n" +
          "Plusieurs options :\n\n" +
          "💬 **Discord** : Mentionne @investinfinity\n" +
          "🤖 **Chatbot** : Je suis là 24h/24 !\n" +
          "🎥 **En live** : Pose tes questions aux experts\n\n" +
          "On répond généralement sous 24h, souvent plus vite !",
          [
            { id: 'contact', label: 'Contacter l\'équipe', action: 'start_contact_flow_now', icon: '👤' },
            { id: 'back', label: '← Autres questions', action: 'faq_community_menu', icon: '🔙' },
          ],
          true
        );
        break;

      case 'faq_security':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "**Sécurité de tes données** 🔒\n\n" +
          "**Absolument !** Tes données sont protégées :\n\n" +
          "✅ Chiffrement SSL\n" +
          "✅ Conformité RGPD\n" +
          "✅ Jamais partagées avec des tiers\n" +
          "✅ Suppression possible à tout moment\n\n" +
          "Ta vie privée est notre priorité.",
          [
            { id: 'back', label: '← Autres questions', action: 'faq_tech_menu', icon: '🔙' },
          ],
          true
        );
        break;

      case 'faq_broker':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "**Quel broker utiliser ?** 🏦\n\n" +
          "Tu peux rejoindre la formation avec **ton broker actuel**, pas de souci !\n\n" +
          "Si tu n'en as pas encore, nous avons des **partenaires de confiance** chez lesquels tu peux faire un dépôt en toute sécurité.\n\n" +
          "⚠️ *Fais tes propres recherches avant de choisir un broker.*",
          [
            { id: 'back', label: '← Autres questions', action: 'faq_tech_menu', icon: '🔙' },
          ],
          true
        );
        break;

      case 'back_to_main':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "**Comment puis-je t'aider ?** 🏠",
          filterQuickReplies(config.quickReplies),
          false
        );
        break;

      // ============================================
      // MENUS PRINCIPAUX STYLE AMAZON - CLIENTS
      // ============================================
      case 'menu_formation':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Ta formation 📚\n\n" +
          "**Que veux-tu faire ?**",
          [
            { id: 'go_training', label: 'Accéder à la formation', action: 'go_training', icon: '▶️' },
            { id: 'progress', label: 'Ma progression', action: 'show_my_progress', icon: '📊' },
            { id: 'discord', label: 'Rejoindre Discord', action: 'join_discord', icon: '💬' },
            { id: 'lives', label: 'Horaires des lives', action: 'faq_lives', icon: '📅' },
            { id: 'back', label: '← Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          false
        );
        break;

      case 'menu_account':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Ton compte 👤\n\n" +
          "**Que veux-tu faire ?**",
          [
            { id: 'go_account', label: 'Voir mon profil', action: 'go_account', icon: '👤' },
            { id: 'subscription', label: 'Mon abonnement', action: 'show_subscription', icon: '💳' },
            { id: 'upgrade', label: 'Changer d\'offre', action: 'show_upgrade_info', icon: '⬆️' },
            { id: 'cancel', label: 'Annuler mon abonnement', action: 'show_cancel_info', icon: '❌' },
            { id: 'back', label: '← Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          false
        );
        break;

      case 'menu_problem':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Je vais t'aider à résoudre ton problème ! 🔧\n\n" +
          "**Quel est le souci ?**",
          [
            { id: 'video', label: 'Vidéo ne fonctionne pas', action: 'help_before_contact_video', icon: '🎥' },
            { id: 'access', label: 'Je n\'ai pas accès à un contenu', action: 'help_before_contact_access', icon: '🚫' },
            { id: 'account', label: 'Problème de connexion', action: 'help_before_contact_account', icon: '🔐' },
            { id: 'payment', label: 'Problème de paiement', action: 'help_before_contact_payment', icon: '💳' },
            { id: 'other', label: 'Autre problème', action: 'start_support_flow', icon: '❓' },
            { id: 'back', label: '← Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          false
        );
        break;

      case 'menu_other_client':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Autre demande 💬\n\n" +
          "**Que puis-je faire pour toi ?**",
          [
            { id: 'faq', label: 'Questions fréquentes', action: 'menu_faq', icon: '❓' },
            { id: 'feedback', label: 'Donner mon avis', action: 'start_feedback_flow', icon: '⭐' },
            { id: 'suggest', label: 'Suggérer une amélioration', action: 'start_suggestion_flow', icon: '💡' },
            { id: 'contact', label: 'Parler à l\'équipe', action: 'start_contact_flow_now', icon: '👤' },
            { id: 'back', label: '← Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          false
        );
        break;

      case 'show_my_progress':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Ta progression 📊\n\n" +
          "Je t'emmène vers ta page de progression où tu pourras voir :\n\n" +
          "✅ Modules complétés\n" +
          "📈 Ton avancement global\n" +
          "🏆 Tes badges et achievements\n" +
          "🔥 Ton streak de connexion",
          [
            { id: 'go', label: 'Voir ma progression', action: 'go_progress', icon: '📊' },
            { id: 'back', label: '← Menu formation', action: 'menu_formation', icon: '🔙' },
          ],
          false
        );
        break;

      case 'go_progress':
        logActionExecuted(userType, action, true, user?.id);
        navigate('/progress');
        addBotMessage(
          "Te voilà sur ta page de progression ! 📊\n\n" +
          "Continue comme ça, tu progresses bien ! 💪",
          [{ id: 'back', label: 'Autre question', action: 'back_to_main', icon: '🏠' }],
          true
        );
        break;

      case 'show_cancel_info':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Annuler ton abonnement ❌\n\n" +
          "On est triste de te voir partir... 😢\n\n" +
          "**Avant de partir, sache que :**\n" +
          "• L'annulation prend effet à la fin de ta période en cours\n" +
          "• Tu gardes l'accès jusqu'à cette date\n" +
          "• Tu peux te réabonner quand tu veux\n\n" +
          "**Pour annuler :**\n" +
          "Va dans ton espace membre → Mon abonnement → Annuler\n\n" +
          "💡 *Si tu as un souci qu'on peut résoudre, dis-le nous !*",
          [
            { id: 'problem', label: 'J\'ai un problème', action: 'menu_problem', icon: '🔧' },
            { id: 'account', label: 'Aller à mon compte', action: 'go_account', icon: '👤' },
            { id: 'stay', label: 'Je reste ! 🎉', action: 'back_to_main', icon: '✅' },
          ],
          false
        );
        break;

      case 'start_feedback_flow':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Ton avis compte beaucoup ! ⭐\n\n" +
          "**Comment évaluerais-tu ton expérience ?**",
          [
            { id: '5', label: '⭐⭐⭐⭐⭐ Excellent', action: 'feedback_5', icon: '🌟' },
            { id: '4', label: '⭐⭐⭐⭐ Très bien', action: 'feedback_4', icon: '😊' },
            { id: '3', label: '⭐⭐⭐ Bien', action: 'feedback_3', icon: '👍' },
            { id: '2', label: '⭐⭐ Moyen', action: 'feedback_2', icon: '😐' },
            { id: '1', label: '⭐ Décevant', action: 'feedback_1', icon: '😞' },
          ],
          false
        );
        break;

      case 'feedback_5':
      case 'feedback_4':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Merci beaucoup ! 🎉\n\n" +
          "Ça nous fait super plaisir !\n\n" +
          "Si tu veux nous aider encore plus, tu peux laisser un avis sur **Trustpilot** 🌟\n\n" +
          "Ça aide vraiment d'autres personnes à nous découvrir !",
          [
            { id: 'trustpilot', label: 'Laisser un avis Trustpilot', action: 'go_trustpilot', icon: '⭐' },
            { id: 'back', label: 'Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          true
        );
        break;

      case 'feedback_3':
      case 'feedback_2':
      case 'feedback_1':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Merci pour ton retour honnête 🙏\n\n" +
          "On veut s'améliorer ! Peux-tu nous dire ce qu'on pourrait faire mieux ?\n\n" +
          "Tape ton message ci-dessous, notre équipe le lira attentivement.",
          [
            { id: 'contact', label: 'Parler à l\'équipe', action: 'start_contact_flow_now', icon: '💬' },
            { id: 'back', label: 'Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          false
        );
        break;

      case 'go_trustpilot':
        logActionExecuted(userType, action, true, user?.id);
        window.open('https://www.trustpilot.com/review/investinfinity.fr', '_blank');
        addBotMessage(
          "Merci d'avance pour ton avis ! 🌟\n\n" +
          "La page Trustpilot s'est ouverte dans un nouvel onglet.",
          [{ id: 'back', label: 'Menu principal', action: 'back_to_main', icon: '🏠' }],
          true
        );
        break;

      case 'start_suggestion_flow':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "On adore les suggestions ! 💡\n\n" +
          "Dis-nous ce que tu aimerais voir amélioré ou ajouté.\n\n" +
          "Tape ton message ci-dessous, notre équipe le lira attentivement.",
          [
            { id: 'contact', label: 'Envoyer via formulaire', action: 'start_contact_flow_now', icon: '📝' },
            { id: 'back', label: 'Menu principal', action: 'back_to_main', icon: '🏠' },
          ],
          false
        );
        break;

      // ============================================
      // MENUS ADMIN
      // ============================================
      case 'go_admin_dashboard':
        logActionExecuted(userType, action, true, user?.id);
        navigate('/admin');
        addBotMessage(
          "Te voilà sur le tableau de bord admin ! 📊",
          [{ id: 'back', label: 'Autre action', action: 'back_to_main', icon: '🏠' }],
          true
        );
        break;

      case 'go_admin_users':
        logActionExecuted(userType, action, true, user?.id);
        navigate('/admin/users');
        addBotMessage(
          "Gestion des utilisateurs 👥",
          [{ id: 'back', label: 'Autre action', action: 'back_to_main', icon: '🏠' }],
          true
        );
        break;

      case 'go_admin_support':
        logActionExecuted(userType, action, true, user?.id);
        navigate('/admin/support');
        addBotMessage(
          "Messages du support 📩",
          [{ id: 'back', label: 'Autre action', action: 'back_to_main', icon: '🏠' }],
          true
        );
        break;

      case 'go_admin_settings':
        logActionExecuted(userType, action, true, user?.id);
        navigate('/admin/settings');
        addBotMessage(
          "Paramètres ⚙️",
          [{ id: 'back', label: 'Autre action', action: 'back_to_main', icon: '🏠' }],
          true
        );
        break;

      // ============================================
      // ACTIONS EXISTANTES
      // ============================================
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

      case 'show_entree':
        logActionExecuted(userType, action, true, user?.id);
        const entreeIntent = CHATBOT_INTENTS.find(i => i.id === 'offer_entree_details');
        if (entreeIntent) {
            addBotMessage(entreeIntent.answer, entreeIntent.followUps as QuickReply[], true);
        }
        break;

      case 'show_transformation':
        logActionExecuted(userType, action, true, user?.id);
        const transfoIntent = CHATBOT_INTENTS.find(i => i.id === 'offer_transformation_details');
        if (transfoIntent) {
            addBotMessage(transfoIntent.answer, transfoIntent.followUps as QuickReply[], true);
        }
        break;

      case 'show_immersion':
        logActionExecuted(userType, action, true, user?.id);
        const immersionIntent = CHATBOT_INTENTS.find(i => i.id === 'offer_immersion_details');
        if (immersionIntent) {
            addBotMessage(immersionIntent.answer, immersionIntent.followUps as QuickReply[], true);
        }
        break;

      case 'ask_immersion_logistics':
        logActionExecuted(userType, action, true, user?.id);
        const logisticsIntent = CHATBOT_INTENTS.find(i => i.id === 'immersion_logistics');
        if (logisticsIntent) {
            addBotMessage(logisticsIntent.answer, logisticsIntent.followUps as QuickReply[], true);
        }
        break;
      
      case 'ask_forgot_password':
        logActionExecuted(userType, action, true, user?.id);
        const pwIntent = CHATBOT_INTENTS.find(i => i.id === 'forgot_password');
        if (pwIntent) {
            addBotMessage(pwIntent.answer, pwIntent.followUps as QuickReply[], true);
        }
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
        // Avant de lancer le flow de contact, proposer une aide automatique
        addBotMessage(
          "Avant de te mettre en contact avec l'équipe, laisse-moi essayer de t'aider ! 🤖\n\n" +
          "**Quel est le sujet de ta demande ?**\n\n" +
          "Choisis une catégorie pour que je puisse t'orienter :",
          [
            { id: 'help_offers', label: 'Questions sur les offres', action: 'help_before_contact_offers', icon: '💎' },
            { id: 'help_account', label: 'Problème de connexion', action: 'help_before_contact_account', icon: '🔐' },
            { id: 'help_video', label: 'Vidéo ne fonctionne pas', action: 'help_before_contact_video', icon: '🎥' },
            { id: 'help_payment', label: 'Paiement / Remboursement', action: 'help_before_contact_payment', icon: '💳' },
            { id: 'help_access', label: 'Accès à la formation', action: 'help_before_contact_access', icon: '🚫' },
            { id: 'help_other', label: 'Autre chose', action: 'help_before_contact_other', icon: '❓' },
          ],
          false
        );
        break;

      case 'help_before_contact_offers':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Je peux t'aider avec les offres ! 💎\n\n" +
          "Voici les questions les plus fréquentes :",
          [
            { id: 'diff', label: 'Différences entre offres', action: 'show_difference_offers', icon: '⚖️' },
            { id: 'pricing', label: 'Voir les tarifs', action: 'show_pricing', icon: '💰' },
            { id: 'upgrade', label: 'Changer d\'offre / Upgrade', action: 'show_upgrade_info', icon: '⬆️' },
            { id: 'payment', label: 'Paiement en plusieurs fois', action: 'show_payment_info', icon: '💳' },
            { id: 'contact_now', label: 'Parler à l\'équipe', action: 'start_contact_flow_now', icon: '👤' },
          ],
          false
        );
        break;

      case 'help_before_contact_account':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Problème de connexion ? Voici les solutions les plus courantes ! 🔐\n\n" +
          "**1. Mot de passe oublié ?**\n" +
          "→ Clique sur 'Mot de passe oublié' sur la page de connexion\n\n" +
          "**2. Email non reconnu ?**\n" +
          "→ Vérifie que tu utilises l'email de ton inscription\n\n" +
          "**3. Pas reçu l'email de confirmation ?**\n" +
          "→ Vérifie tes spams/indésirables\n\n" +
          "**4. Message d'erreur ?**\n" +
          "→ Essaie de vider le cache de ton navigateur\n\n" +
          "Est-ce que ça t'aide ?",
          [
            { id: 'solved', label: 'Problème résolu !', action: 'problem_solved', icon: '✅' },
            { id: 'forgot_pw', label: 'Réinitialiser mot de passe', action: 'go_forgot_password', icon: '🔑' },
            { id: 'still_stuck', label: 'Toujours bloqué', action: 'start_contact_flow_now', icon: '😕' },
          ],
          false
        );
        break;

      case 'help_before_contact_video':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Problème de lecture vidéo ? Voici les solutions ! 🎥\n\n" +
          "**Essaie ces étapes :**\n\n" +
          "1️⃣ **Désactive ton bloqueur de pub** (AdBlock, uBlock...)\n" +
          "2️⃣ **Rafraîchis la page** (Ctrl+F5 ou Cmd+Shift+R)\n" +
          "3️⃣ **Teste un autre navigateur** (Chrome recommandé)\n" +
          "4️⃣ **Vérifie ta connexion internet**\n" +
          "5️⃣ **Vide le cache** du navigateur\n\n" +
          "💡 **Astuce** : Les vidéos fonctionnent mieux sur ordinateur que sur mobile.\n\n" +
          "Est-ce que ça fonctionne maintenant ?",
          [
            { id: 'solved', label: 'Ça marche !', action: 'problem_solved', icon: '✅' },
            { id: 'still_stuck', label: 'Toujours en panne', action: 'start_contact_flow_now', icon: '😕' },
          ],
          false
        );
        break;

      case 'help_before_contact_payment':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Questions sur le paiement ou remboursement ? 💳\n\n" +
          "**Informations importantes :**\n\n" +
          "🛡️ **Garantie 14 jours** : Tu peux demander un remboursement complet dans les 14 jours suivant ton achat (offre Premium).\n\n" +
          "💳 **Paiement en 3x** : Disponible via Klarna sans frais.\n\n" +
          "📧 **Facture** : Envoyée automatiquement par email après achat.\n\n" +
          "⏱️ **Délai remboursement** : 5-7 jours ouvrés après validation.\n\n" +
          "Quelle est ta question précise ?",
          [
            { id: 'refund', label: '🔄 Demander remboursement', action: 'start_contact_flow_now', icon: '🔄' },
            { id: 'invoice', label: '📄 Problème de facture', action: 'start_contact_flow_now', icon: '📄' },
            { id: 'payment_failed', label: '❌ Paiement refusé', action: 'show_payment_failed_help', icon: '❌' },
            { id: 'solved', label: 'Question répondue', action: 'problem_solved', icon: '✅' },
          ],
          false
        );
        break;

      case 'show_payment_failed_help':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Paiement refusé ? Voici les causes possibles ! ❌\n\n" +
          "**Vérifie ces points :**\n\n" +
          "1️⃣ **Fonds suffisants** sur ta carte\n" +
          "2️⃣ **Plafond de paiement** non atteint\n" +
          "3️⃣ **Paiements en ligne** autorisés par ta banque\n" +
          "4️⃣ **3D Secure** activé si demandé\n" +
          "5️⃣ **Date d'expiration** de la carte valide\n\n" +
          "💡 **Astuce** : Certaines banques bloquent les paiements internationaux. Appelle ta banque pour autoriser la transaction.\n\n" +
          "Tu peux aussi essayer avec une autre carte ou via Klarna (paiement en 3x).",
          [
            { id: 'retry', label: '🔄 Réessayer le paiement', action: 'go_pricing', icon: '🔄' },
            { id: 'contact', label: 'Besoin d\'aide', action: 'start_contact_flow_now', icon: '💬' },
          ],
          false
        );
        break;

      case 'help_before_contact_access':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Problème d'accès à la formation ? 🚫\n\n" +
          "**Vérifie ces points :**\n\n" +
          "1️⃣ **Es-tu bien connecté ?** → Vérifie en haut à droite\n" +
          "2️⃣ **As-tu finalisé ton achat ?** → Vérifie tes emails de confirmation\n" +
          "3️⃣ **Bonne offre ?** → Certains contenus sont réservés aux offres supérieures\n\n" +
          "**Contenus par offre :**\n" +
          "• **Starter** : Lives + Discord + Alertes\n" +
          "• **Premium** : Tout Starter + Formation complète + Replays\n" +
          "• **Bootcamp** : Tout Premium + Présentiel\n\n" +
          "Quel est ton problème exact ?",
          [
            { id: 'not_bought', label: '🛒 Je n\'ai pas encore acheté', action: 'go_pricing', icon: '🛒' },
            { id: 'upgrade', label: '⬆️ Je veux upgrader', action: 'show_upgrade_info', icon: '⬆️' },
            { id: 'bought_no_access', label: 'J\'ai payé mais pas d\'accès', action: 'start_contact_flow_now', icon: '😕' },
          ],
          false
        );
        break;

      case 'help_before_contact_other':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "D'accord ! Avant de te mettre en contact avec l'équipe, voici quelques ressources utiles : 📚\n\n" +
          "**Questions fréquentes :**",
          [
            { id: 'faq_guarantee', label: 'Garantie 14 jours', action: 'show_guarantee', icon: '🛡️' },
            { id: 'faq_discord', label: 'Accès Discord', action: 'show_discord_info', icon: '💬' },
            { id: 'faq_time', label: 'Temps nécessaire', action: 'show_time_info', icon: '⏱️' },
            { id: 'faq_propfirm', label: 'Prop Firms', action: 'explain_propfirm', icon: '🏢' },
            { id: 'contact_now', label: 'Parler à l\'équipe', action: 'start_contact_flow_now', icon: '👤' },
          ],
          false
        );
        break;

      case 'show_difference_offers':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Voici les différences principales ! 📊\n\n" +
          "**🌱 Starter (147€)**\n" +
          "- Lives trading\n" +
          "- Communauté Discord\n" +
          "- Alertes trading\n" +
          "- ❌ Pas de formation vidéo\n" +
          "- ❌ Pas de replays\n\n" +
          "**🚀 Premium (497€)** ⭐ Best-seller\n" +
          "- Tout Starter +\n" +
          "- Formation complète\n" +
          "- Replays illimités\n" +
          "- Accompagnement 7j/7\n" +
          "- Garantie 14 jours\n\n" +
          "**👑 Bootcamp (1997€)**\n" +
          "- Tout Premium +\n" +
          "- 1 semaine en présentiel\n" +
          "- Trading live avec Mickaël\n" +
          "- Certificat\n\n" +
          "**Mon conseil :** Premium si tu veux vraiment progresser !",
          [
            { id: 'pricing', label: 'Voir les tarifs', action: 'go_pricing', icon: '💎' },
            { id: 'other_q', label: 'Autre question', action: 'other_question', icon: '❓' },
          ],
          true
        );
        break;

      case 'show_upgrade_info':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Tu veux passer à une offre supérieure ? Excellente idée ! 🚀\n\n" +
          "**Comment faire un upgrade :**\n\n" +
          "1️⃣ Contacte notre support\n" +
          "2️⃣ On calcule la différence de prix\n" +
          "3️⃣ Tu paies uniquement le complément\n\n" +
          "**Exemple :**\n" +
          "• Starter (147€) → Premium (497€) = **350€ à payer**\n" +
          "• Premium (497€) → Bootcamp (1997€) = **1500€ à payer**\n\n" +
          "Le changement est effectif immédiatement ! ⚡",
          [
            { id: 'upgrade_now', label: '⬆️ Demander un upgrade', action: 'start_contact_flow_now', icon: '⬆️' },
            { id: 'compare', label: '⚖️ Comparer les offres', action: 'show_difference_offers', icon: '⚖️' },
          ],
          false
        );
        break;

      case 'show_payment_info':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Paiement en plusieurs fois ? C'est possible ! 💳\n\n" +
          "**Options disponibles :**\n\n" +
          "🔹 **Premium (497€)** → 3x 166€/mois sans frais\n" +
          "🔹 **Bootcamp (1997€)** → 3x 666€/mois sans frais\n\n" +
          "**Comment ça marche :**\n" +
          "- Paiement via Klarna à la commande\n" +
          "- Prélèvements automatiques\n" +
          "- 0% de frais supplémentaires\n\n" +
          "L'accès est immédiat dès le premier paiement ! ⚡",
          [
            { id: 'pricing', label: '💎 Voir les offres', action: 'go_pricing', icon: '💎' },
            { id: 'other_q', label: '❓ Autre question', action: 'other_question', icon: '❓' },
          ],
          true
        );
        break;

      case 'show_guarantee':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Notre garantie satisfait ou remboursé ! 🛡️\n\n" +
          "**14 jours pour tester l'offre Premium**\n\n" +
          "✅ Si la formation ne te convient pas, tu peux demander un remboursement complet dans les 14 jours suivant ton achat.\n\n" +
          "✅ Aucune condition, aucune question.\n\n" +
          "✅ Remboursement sous 5-7 jours ouvrés.\n\n" +
          "**Pour faire une demande :** Contacte le support avec ton email d'inscription.",
          [
            { id: 'pricing', label: '💎 Voir les offres', action: 'go_pricing', icon: '💎' },
            { id: 'other_q', label: '❓ Autre question', action: 'other_question', icon: '❓' },
          ],
          true
        );
        break;

      case 'show_discord_info':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Accès au Discord de la communauté ! 💬\n\n" +
          "**Comment rejoindre :**\n\n" +
          "1️⃣ Connecte-toi à ton espace membre\n" +
          "2️⃣ Le lien d'invitation se trouve dans le dashboard\n" +
          "3️⃣ Clique et rejoins la communauté !\n\n" +
          "**Ce que tu y trouveras :**\n" +
          "• Lives trading quotidiens\n" +
          "• Alertes en temps réel\n" +
          "• Échanges avec les autres membres\n" +
          "• Support de l'équipe\n\n" +
          "⚠️ L'accès Discord est réservé aux membres ayant une offre active.",
          [
            { id: 'login', label: '🔐 Se connecter', action: 'go_account', icon: '🔐' },
            { id: 'other_q', label: '❓ Autre question', action: 'other_question', icon: '❓' },
          ],
          false
        );
        break;

      case 'show_time_info':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Combien de temps pour apprendre ? ⏱️\n\n" +
          "**Formation complète :**\n" +
          "• ~20-30h de contenu vidéo\n" +
          "• À ton rythme, accès à vie\n\n" +
          "**Recommandation :**\n" +
          "• 5-10h/semaine pour bien progresser\n" +
          "• 2-3 mois pour maîtriser les bases\n" +
          "• 6-12 mois pour être vraiment autonome\n\n" +
          "**Lives trading :**\n" +
          "• ~10h/semaine (optionnel mais recommandé)\n\n" +
          "Le trading s'apprend avec la pratique. Pas de rush ! 🎯",
          [
            { id: 'start', label: '🚀 Commencer', action: 'go_pricing', icon: '🚀' },
            { id: 'other_q', label: '❓ Autre question', action: 'other_question', icon: '❓' },
          ],
          true
        );
        break;

      case 'explain_propfirm':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Les **Prop Firms** te permettent de trader avec leur capital ! 🏢\n\n" +
          "**Comment ça marche :**\n\n" +
          "1️⃣ Tu passes un challenge (évaluation)\n" +
          "2️⃣ Si tu réussis, tu trades leur argent (jusqu'à 150 000€+)\n" +
          "3️⃣ Tu gardes 80-90% des profits\n\n" +
          "**Avantages :**\n" +
          "✅ Pas besoin de capital personnel\n" +
          "✅ Risque limité au coût du challenge\n" +
          "✅ Gains potentiels importants\n\n" +
          "Dans la formation, on t'explique comment passer ces challenges ! 🎯",
          [
            { id: 'pricing', label: 'Voir la formation', action: 'go_pricing', icon: '📚' },
            { id: 'other_q', label: 'Autre question', action: 'other_question', icon: '❓' },
          ],
          true
        );
        break;

      case 'go_forgot_password':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Pour réinitialiser ton mot de passe : 🔑\n\n" +
          "1️⃣ Va sur la page de connexion\n" +
          "2️⃣ Clique sur **'Mot de passe oublié ?'**\n" +
          "3️⃣ Entre ton email d'inscription\n" +
          "4️⃣ Vérifie ta boîte mail (et les spams !)\n" +
          "5️⃣ Clique sur le lien reçu pour créer un nouveau mot de passe\n\n" +
          "Le lien est valide 24h. Si tu ne reçois rien, vérifie que tu utilises le bon email.",
          [
            { id: 'login', label: '🔐 Page de connexion', action: 'go_account', icon: '🔐' },
            { id: 'still_stuck', label: 'Toujours bloqué', action: 'start_contact_flow_now', icon: '😕' },
          ],
          false
        );
        break;

      case 'problem_solved':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Super, content d'avoir pu t'aider ! 🎉\n\n" +
          "N'hésite pas si tu as d'autres questions. Je suis là 24h/24 ! 🤖",
          filterQuickReplies(config.quickReplies),
          true
        );
        break;

      case 'start_contact_flow_now':
        logActionExecuted(userType, action, true, user?.id);
        // Lancer le flow de contact intelligent
        setContactFlow({
          active: true,
          step: 'ASK_NAME',
          data: { source: 'chatbot_contact' },
        });
        addBotMessage(
          "Je vais te mettre en contact avec notre équipe ! 💬\n\n" +
          "Pour que ta demande soit bien traitée, je vais te poser quelques questions rapides.\n\n" +
          "🏷️ *Contact - Invest Infinity*\n\n" +
          "Pour commencer, peux-tu me donner ton **prénom et nom** ?",
          [],
          false
        );
        break;

      case 'start_support_flow':
        logActionExecuted(userType, action, true, user?.id);
        // Lancer le flow de support technique (pour clients)
        setSupportFlow({
          active: true,
          step: 'ASK_NAME',
          data: { source: 'chatbot_support', userId: user?.id },
        });
        addBotMessage(
          "Je vais t'aider à résoudre ton problème technique ! 🔧\n\n" +
          "Pour que notre équipe puisse t'aider efficacement, je vais te poser quelques questions.\n\n" +
          "🏷️ *Support Technique - Invest Infinity*\n\n" +
          "Pour commencer, peux-tu me confirmer ton **prénom et nom** ?",
          [],
          false
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
        const currentLicense = profile?.license || 'none';
        const licenseLabels: Record<string, { name: string; icon: string; features: string[] }> = {
          'none': { name: 'Aucun abonnement', icon: '❌', features: [] },
          'starter': { name: 'Starter', icon: '🌱', features: ['Lives trading', 'Discord', 'Alertes'] },
          'premium': { name: 'Premium', icon: '🚀', features: ['Tout Starter', 'Formation complète', 'Replays illimités', 'Support 7j/7'] },
          'bootcamp': { name: 'Bootcamp', icon: '👑', features: ['Tout Premium', 'Semaine en présentiel', 'Trading live avec Mickaël'] },
          'entree': { name: 'Entrée', icon: '🌱', features: ['Lives trading', 'Discord', 'Alertes'] },
          'transformation': { name: 'Transformation', icon: '🚀', features: ['Tout Entrée', 'Formation complète', 'Replays illimités'] },
          'immersion': { name: 'Immersion', icon: '👑', features: ['Tout Transformation', 'Semaine en présentiel'] },
        };
        const licenseInfo = licenseLabels[currentLicense] || licenseLabels['none'];
        
        if (currentLicense === 'none') {
          addBotMessage(
            "**Ton abonnement** 💳\n\n" +
            `${licenseInfo.icon} **Statut :** Aucun abonnement actif\n\n` +
            "Tu n'as pas encore d'abonnement. Découvre nos offres pour accéder à la formation !",
            [
              { id: 'pricing', label: 'Voir les offres', action: 'go_pricing', icon: '💎' },
              { id: 'compare', label: 'Comparer les offres', action: 'show_difference_offers', icon: '⚖️' },
              { id: 'back', label: '← Menu principal', action: 'back_to_main', icon: '🏠' },
            ],
            false
          );
        } else {
          const featuresText = licenseInfo.features.map(f => `✅ ${f}`).join('\n');
          addBotMessage(
            "**Ton abonnement** 💳\n\n" +
            `${licenseInfo.icon} **Formule :** ${licenseInfo.name}\n` +
            `📧 **Email :** ${user?.email || 'Non renseigné'}\n\n` +
            "**Ce qui est inclus :**\n" +
            featuresText + "\n\n" +
            "Tu peux gérer ton abonnement depuis ton espace membre.",
            [
              { id: 'account', label: 'Gérer mon compte', action: 'go_account', icon: '👤' },
              { id: 'upgrade', label: 'Changer de formule', action: 'show_upgrade_info', icon: '⬆️' },
              { id: 'cancel', label: 'Annuler', action: 'show_cancel_info', icon: '❌' },
              { id: 'back', label: '← Menu principal', action: 'back_to_main', icon: '🏠' },
            ],
            false
          );
        }
        break;

      case 'tech_support':
        logActionExecuted(userType, action, true, user?.id);
        addBotMessage(
          "Tu rencontres un problème technique ? 🔧\n\n" +
          "Voici quelques solutions courantes :\n\n" +
          "• **Vidéo qui ne charge pas** : Rafraîchis la page ou vide le cache\n" +
          "• **Problème de connexion** : Vérifie tes identifiants ou réinitialise ton mot de passe\n" +
          "• **Accès refusé** : Vérifie que ton abonnement est actif\n\n" +
          "Si le problème persiste, je peux créer un ticket de support pour toi !",
          [
            { id: 'support', label: 'Créer un ticket support', action: 'start_support_flow', icon: '🎫' },
            { id: 'discord', label: 'Aller sur Discord', action: 'join_discord', icon: '💬' },
            { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
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

      // === Actions du flux RDV ===
      case 'rdv_type_decouverte':
        if (rdvFlow.active && rdvFlow.step === 'ASK_TYPE_RDV') {
          setRdvFlow(prev => ({
            ...prev,
            step: 'ASK_AVAILABILITIES',
            data: { ...prev.data, type: 'appel_decouverte' },
          }));
          addBotMessage(
            "Parfait, un **appel découverte** (15 min) ! 📞\n\n" +
            "Quelles sont tes **disponibilités** pour ce rendez-vous ?\n\n" +
            "_(Tu peux indiquer des jours/heures précis ou tes préférences générales : matin, après-midi, soir, week-end...)_",
            [],
            false
          );
        }
        break;

      case 'rdv_type_qualification':
        if (rdvFlow.active && rdvFlow.step === 'ASK_TYPE_RDV') {
          setRdvFlow(prev => ({
            ...prev,
            step: 'ASK_AVAILABILITIES',
            data: { ...prev.data, type: 'appel_qualification' },
          }));
          addBotMessage(
            "Parfait, un **appel qualification** (30 min) ! 🎯\n\n" +
            "Quelles sont tes **disponibilités** pour ce rendez-vous ?\n\n" +
            "_(Tu peux indiquer des jours/heures précis ou tes préférences générales : matin, après-midi, soir, week-end...)_",
            [],
            false
          );
        }
        break;

      case 'rdv_confirm_yes':
        if (rdvFlow.active && rdvFlow.step === 'SUMMARY_CONFIRM') {
          // Passer à l'étape de soumission directement
          setRdvFlow(prev => ({ ...prev, step: 'SUBMIT_TO_BACKEND' }));
          
          // Soumettre la demande
          (async () => {
            const payload: CreateAppointmentPayload = {
              offerId: rdvFlow.context?.offerId || 'immersion_elite',
              offerName: rdvFlow.context?.offerName || 'Bootcamp Élite',
              firstName: rdvFlow.data.firstName || '',
              lastName: rdvFlow.data.lastName || '',
              email: rdvFlow.data.email || '',
              phone: rdvFlow.data.phone || '',
              location: rdvFlow.data.location,
              type: rdvFlow.data.type || 'appel_decouverte',
              availability: rdvFlow.data.availability || '',
              goals: rdvFlow.data.goals,
              source: rdvFlow.context?.source || 'chatbot_direct',
              sessionId: rdvFlow.context?.sessionId,
              userId: user?.id,
            };
            
            try {
              const result = await submitAppointmentRequest(payload);
              
              if (result.success) {
                setRdvFlow({ active: false, step: 'ASK_NAME', data: {}, context: undefined });
                
                addBotMessage(
                  `🎉 **Merci ${rdvFlow.data.firstName} !**\n\n` +
                  `Ta demande de rendez-vous pour le **${rdvFlow.context?.offerName || 'Bootcamp Élite'}** est bien enregistrée !\n\n` +
                  `📩 Tu vas recevoir un email de confirmation à **${rdvFlow.data.email}**.\n\n` +
                  `Notre équipe te recontactera très rapidement pour confirmer le créneau.\n\n` +
                  `À très vite ! 👋`,
                  [
                    { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
                  ],
                  true
                );
              } else {
                throw new Error(result.error || 'Erreur inconnue');
              }
            } catch (error) {
              console.error('Erreur envoi RDV:', error);
              addBotMessage(
                `😔 Désolé, ta demande n'a pas pu être enregistrée.\n\n` +
                `Réessaie dans quelques minutes ou contacte-nous directement sur Discord.`,
                [
                  { id: 'retry', label: 'Réessayer', action: 'rdv_retry', icon: '🔄' },
                  { id: 'contact', label: 'Contacter support', action: 'contact_human', icon: '💬' },
                ],
                false
              );
            }
          })();
        }
        break;

      case 'rdv_confirm_no':
        if (rdvFlow.active && rdvFlow.step === 'SUMMARY_CONFIRM') {
          // Recommencer le flux
          setRdvFlow(prev => ({
            ...prev,
            step: 'ASK_NAME',
            data: {
              offerId: prev.context?.offerId,
              offerName: prev.context?.offerName,
              source: prev.context?.source,
            },
          }));
          addBotMessage(
            "Pas de souci ! On reprend depuis le début. 📝\n\n" +
            "Peux-tu me redonner ton **prénom et nom** ?",
            [],
            false
          );
        }
        break;

      case 'rdv_retry':
        // Réinitialiser et relancer le flux RDV
        setRdvFlow({
          active: true,
          step: 'ASK_NAME',
          data: {
            offerId: 'immersion_elite',
            offerName: 'Bootcamp Élite',
            source: 'chatbot_direct',
          },
          context: {
            offerId: 'immersion_elite',
            offerName: 'Bootcamp Élite',
            source: 'chatbot_direct',
          },
        });
        addBotMessage(
          "On reprend ! 🔄\n\n" +
          "Peux-tu me donner ton **prénom et nom** ?",
          [],
          false
        );
        break;

      case 'start_rdv_bootcamp':
        // Démarrer le flux RDV depuis un quick reply
        logActionExecuted(userType, action, true, user?.id);
        setRdvFlow({
          active: true,
          step: 'ASK_NAME',
          data: {
            offerId: 'immersion_elite',
            offerName: 'Bootcamp Élite',
            source: 'chatbot_direct',
          },
          context: {
            offerId: 'immersion_elite',
            offerName: 'Bootcamp Élite',
            source: 'chatbot_direct',
          },
        });
        addBotMessage(
          "Salut 👋 On va planifier ton rendez-vous pour le **Bootcamp Élite** !\n\n" +
          "Je vais te poser quelques questions rapides.\n\n" +
          "🏷️ *Planification RDV - Bootcamp Élite*\n\n" +
          "Pour commencer, peux-tu me donner ton **prénom et nom** ?",
          [],
          false
        );
        break;

      // === Actions du flux CONTACT ===
      case 'contact_subject_offres':
        if (contactFlow.active && contactFlow.step === 'ASK_SUBJECT') {
          setContactFlow(prev => ({
            ...prev,
            step: 'ASK_MESSAGE',
            data: { ...prev.data, subject: 'question_offres' },
          }));
          addBotMessage(
            `Noté : **Question sur les offres** 📋\n\n` +
            `Maintenant, décris-moi ta demande en détail. Plus tu es précis, mieux on pourra t'aider ! 💬`,
            [],
            false
          );
        }
        break;

      case 'contact_subject_support':
        if (contactFlow.active && contactFlow.step === 'ASK_SUBJECT') {
          setContactFlow(prev => ({
            ...prev,
            step: 'ASK_MESSAGE',
            data: { ...prev.data, subject: 'support_technique' },
          }));
          addBotMessage(
            `Noté : **Support technique** 📋\n\n` +
            `Décris-moi le problème que tu rencontres en détail. 💬`,
            [],
            false
          );
        }
        break;

      case 'contact_subject_bootcamp':
        if (contactFlow.active && contactFlow.step === 'ASK_SUBJECT') {
          setContactFlow(prev => ({
            ...prev,
            step: 'ASK_MESSAGE',
            data: { ...prev.data, subject: 'bootcamp_info' },
          }));
          addBotMessage(
            `Noté : **Bootcamp / Immersion Élite** 📋\n\n` +
            `Qu'aimerais-tu savoir sur le Bootcamp ? 💬`,
            [],
            false
          );
        }
        break;

      case 'contact_subject_partenariat':
        if (contactFlow.active && contactFlow.step === 'ASK_SUBJECT') {
          setContactFlow(prev => ({
            ...prev,
            step: 'ASK_MESSAGE',
            data: { ...prev.data, subject: 'partenariat' },
          }));
          addBotMessage(
            `Noté : **Partenariat** 📋\n\n` +
            `Décris-nous ton projet de partenariat ! 🤝`,
            [],
            false
          );
        }
        break;

      case 'contact_subject_autre':
        if (contactFlow.active && contactFlow.step === 'ASK_SUBJECT') {
          setContactFlow(prev => ({
            ...prev,
            step: 'ASK_MESSAGE',
            data: { ...prev.data, subject: 'autre' },
          }));
          addBotMessage(
            `Noté : **Autre demande** 📋\n\n` +
            `Dis-moi tout, je t'écoute ! 💬`,
            [],
            false
          );
        }
        break;

      case 'contact_confirm_yes':
        // Soumettre la demande de contact via le flux
        if (contactFlow.active && contactFlow.step === 'SUMMARY_CONFIRM') {
          // Simuler l'envoi du message "oui" pour déclencher la soumission
          handleSendMessage('oui');
        }
        break;

      case 'contact_confirm_no':
        if (contactFlow.active && contactFlow.step === 'SUMMARY_CONFIRM') {
          setContactFlow(prev => ({
            ...prev,
            step: 'ASK_NAME',
            data: {},
          }));
          addBotMessage(
            "Pas de souci ! On reprend depuis le début. 📝\n\n" +
            "Peux-tu me redonner ton **prénom et nom** ?",
            [],
            false
          );
        }
        break;

      // === Actions du flux SUPPORT ===
      case 'support_problem_formation':
        if (supportFlow.active && supportFlow.step === 'ASK_PROBLEM_TYPE') {
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_DESCRIPTION',
            data: { ...prev.data, problemType: 'acces_formation' },
          }));
          addBotMessage(
            `Compris : **Accès à la formation** 🔧\n\n` +
            `Peux-tu me **décrire précisément** le problème ?\n\n` +
            `_(Message d'erreur, ce que tu as essayé, depuis quand ça arrive, etc.)_`,
            [],
            false
          );
        }
        break;

      case 'support_problem_discord':
        if (supportFlow.active && supportFlow.step === 'ASK_PROBLEM_TYPE') {
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_DESCRIPTION',
            data: { ...prev.data, problemType: 'acces_discord' },
          }));
          addBotMessage(
            `Compris : **Accès Discord** 🔧\n\n` +
            `Peux-tu me **décrire précisément** le problème ?\n\n` +
            `_(Message d'erreur, ce que tu as essayé, etc.)_`,
            [],
            false
          );
        }
        break;

      case 'support_problem_paiement':
        if (supportFlow.active && supportFlow.step === 'ASK_PROBLEM_TYPE') {
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_DESCRIPTION',
            data: { ...prev.data, problemType: 'paiement' },
          }));
          addBotMessage(
            `Compris : **Problème de paiement** 🔧\n\n` +
            `Peux-tu me **décrire précisément** le problème ?\n\n` +
            `_(Erreur affichée, date du paiement, montant, etc.)_`,
            [],
            false
          );
        }
        break;

      case 'support_problem_video':
        if (supportFlow.active && supportFlow.step === 'ASK_PROBLEM_TYPE') {
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_DESCRIPTION',
            data: { ...prev.data, problemType: 'video_bug' },
          }));
          addBotMessage(
            `Compris : **Vidéo ne se charge pas** 🔧\n\n` +
            `Peux-tu me **décrire précisément** le problème ?\n\n` +
            `_(Quelle vidéo, navigateur utilisé, message d'erreur, etc.)_`,
            [],
            false
          );
        }
        break;

      case 'support_problem_compte':
        if (supportFlow.active && supportFlow.step === 'ASK_PROBLEM_TYPE') {
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_DESCRIPTION',
            data: { ...prev.data, problemType: 'compte' },
          }));
          addBotMessage(
            `Compris : **Problème de compte** 🔧\n\n` +
            `Peux-tu me **décrire précisément** le problème ?\n\n` +
            `_(Connexion impossible, mot de passe oublié, etc.)_`,
            [],
            false
          );
        }
        break;

      case 'support_problem_autre':
        if (supportFlow.active && supportFlow.step === 'ASK_PROBLEM_TYPE') {
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_DESCRIPTION',
            data: { ...prev.data, problemType: 'autre' },
          }));
          addBotMessage(
            `Compris : **Autre problème** 🔧\n\n` +
            `Peux-tu me **décrire précisément** le problème ?`,
            [],
            false
          );
        }
        break;

      case 'support_confirm_yes':
        // Soumettre la demande de support via le flux
        if (supportFlow.active && supportFlow.step === 'SUMMARY_CONFIRM') {
          // Simuler l'envoi du message "oui" pour déclencher la soumission
          handleSendMessage('oui');
        }
        break;

      case 'support_confirm_no':
        if (supportFlow.active && supportFlow.step === 'SUMMARY_CONFIRM') {
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_NAME',
            data: {},
          }));
          addBotMessage(
            "Pas de souci ! On reprend depuis le début. 📝\n\n" +
            "Peux-tu me redonner ton **prénom et nom** ?",
            [],
            false
          );
        }
        break;

      default:
        logActionExecuted(userType, action, false, user?.id, 'unknown_action');
        addBotMessage(
          addFallbackHint("Cette fonctionnalité arrive bientôt ! En attendant, n'hésite pas à me poser d'autres questions."),
          [{ id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' }],
          true
        );
    }
  }, [navigate, user, profile, role, userType, config.quickReplies, checkActionPermission, filterQuickReplies, rdvFlow, contactFlow, supportFlow, addBotMessage]);

  // Gérer l'envoi d'un message utilisateur
  const handleSendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    // Logger le message
    logMessageSent(userType, content, user?.id);

    // Préparer les attachements si présents
    const messageAttachments = attachments?.map(att => ({
      url: att.preview || URL.createObjectURL(att.file),
      type: att.type,
      name: att.file.name,
      size: att.file.size,
    }));

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: generateId(),
      content: content || (messageAttachments?.length ? `[${messageAttachments.length} fichier(s) joint(s)]` : ''),
      sender: 'user',
      timestamp: new Date(),
      attachments: messageAttachments,
      type: messageAttachments?.length ? (messageAttachments[0].type === 'image' ? 'image' : 'file') : 'text',
    };
    setMessages(prev => [...prev, userMessage]);

    // 0. Gérer le flux de planification RDV (machine à états complète)
    if (rdvFlow.active) {
      const trimmedContent = content.trim();
      const lowerContent = trimmedContent.toLowerCase();
      
      // Permettre à l'utilisateur de corriger ou annuler
      if (lowerContent === 'annuler' || lowerContent === 'cancel') {
        setRdvFlow({ active: false, step: 'ASK_NAME', data: {}, context: undefined });
        addBotMessage(
          "Pas de souci ! Ta demande a été annulée. 👋\n\nSi tu as d'autres questions, je suis là !",
          filterQuickReplies(config.quickReplies),
          false
        );
        return;
      }
      
      switch (rdvFlow.step) {
        case 'ASK_NAME': {
          // Validation : au moins 2 caractères, avec prénom et nom
          if (trimmedContent.length < 2) {
            addBotMessage("Merci de me donner ton prénom et nom complet. 📝", [], false);
            return;
          }
          
          const nameParts = trimmedContent.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || '';
          
          setRdvFlow(prev => ({
            ...prev,
            step: 'ASK_EMAIL',
            data: { ...prev.data, firstName, lastName },
          }));
          
          addBotMessage(
            `Enchanté ${firstName} ! 👋\n\nMaintenant, peux-tu me donner ton **adresse email** ?\n\n_(Nous l'utiliserons uniquement pour te contacter concernant ton rendez-vous)_`,
            [],
            false
          );
          return;
        }

        case 'ASK_EMAIL': {
          if (!validateEmail(trimmedContent)) {
            addBotMessage(
              "Hmm, cette adresse email ne semble pas valide. 🤔\n\nPeux-tu vérifier et me la redonner ? (exemple : prenom@email.com)",
              [],
              false
            );
            return;
          }
          
          setRdvFlow(prev => ({
            ...prev,
            step: 'ASK_PHONE',
            data: { ...prev.data, email: trimmedContent.toLowerCase().trim() },
          }));
          
          addBotMessage(
            "Parfait ! 📧\n\nPeux-tu maintenant me donner ton **numéro de téléphone** avec l'indicatif pays si tu es hors de France ?\n\n_(Exemple : 06 12 34 56 78 ou +33 6 12 34 56 78)_",
            [],
            false
          );
          return;
        }

        case 'ASK_PHONE': {
          if (!validatePhone(trimmedContent)) {
            addBotMessage(
              "Ce numéro ne semble pas valide. 📱\n\nMerci de me donner un numéro de téléphone valide (exemple : 06 12 34 56 78 ou +33 6 12 34 56 78).",
              [],
              false
            );
            return;
          }
          
          setRdvFlow(prev => ({
            ...prev,
            step: 'ASK_LOCATION',
            data: { ...prev.data, phone: trimmedContent },
          }));
          
          addBotMessage(
            "Super ! 📱\n\nDans quelle **ville / pays** te trouves-tu ?\n\n_(Cela nous aide à adapter le créneau horaire si nécessaire)_",
            [],
            false
          );
          return;
        }

        case 'ASK_LOCATION': {
          if (trimmedContent.length < 2) {
            addBotMessage("Merci d'indiquer ta ville ou ton pays. 🌍", [], false);
            return;
          }
          
          setRdvFlow(prev => ({
            ...prev,
            step: 'ASK_TYPE_RDV',
            data: { ...prev.data, location: trimmedContent },
          }));
          
          addBotMessage(
            "Merci ! 🌍\n\nQuel **type de rendez-vous** préfères-tu ?\n\n" +
            "1️⃣ **Appel découverte** (15 min) - Pour faire connaissance\n" +
            "2️⃣ **Appel qualification** (30 min) - Pour discuter de tes objectifs en détail\n\n" +
            "_(Réponds 1 ou 2, ou tape le nom complet)_",
            [
              { id: 'rdv_1', label: 'Appel découverte', action: 'rdv_type_decouverte', icon: '📞' },
              { id: 'rdv_2', label: 'Appel qualification', action: 'rdv_type_qualification', icon: '🎯' },
            ],
            false
          );
          return;
        }

        case 'ASK_TYPE_RDV': {
          let rdvType: AppointmentType = 'appel_decouverte';
          
          if (lowerContent === '1' || lowerContent.includes('découverte') || lowerContent.includes('decouverte') || lowerContent.includes('15')) {
            rdvType = 'appel_decouverte';
          } else if (lowerContent === '2' || lowerContent.includes('qualification') || lowerContent.includes('30')) {
            rdvType = 'appel_qualification';
          }
          
          setRdvFlow(prev => ({
            ...prev,
            step: 'ASK_AVAILABILITIES',
            data: { ...prev.data, type: rdvType },
          }));
          
          addBotMessage(
            `Parfait, un **${rdvType === 'appel_decouverte' ? 'appel découverte' : 'appel qualification'}** ! 📞\n\n` +
            `Quelles sont tes **disponibilités** pour ce rendez-vous ?\n\n` +
            `_(Tu peux indiquer des jours/heures précis ou tes préférences générales : matin, après-midi, soir, week-end...)_`,
            [],
            false
          );
          return;
        }

        case 'ASK_AVAILABILITIES': {
          if (trimmedContent.length < 3) {
            addBotMessage(
              "Merci d'indiquer au moins une disponibilité ou préférence horaire. 📅",
              [],
              false
            );
            return;
          }
          
          setRdvFlow(prev => ({
            ...prev,
            step: 'ASK_GOALS',
            data: { ...prev.data, availability: trimmedContent },
          }));
          
          addBotMessage(
            "Noté ! 📅\n\nEn quelques mots, quel est ton **objectif principal** avec le Bootcamp Élite ?\n\n_(Cela nous aide à mieux préparer notre échange)_",
            [],
            false
          );
          return;
        }

        case 'ASK_GOALS': {
          setRdvFlow(prev => ({
            ...prev,
            step: 'SUMMARY_CONFIRM',
            data: { ...prev.data, goals: trimmedContent || 'Non précisé' },
          }));
          
          const data = rdvFlow.data;
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
          const rdvTypeLabel = data.type === 'appel_qualification' ? 'Appel qualification (30 min)' : 'Appel découverte (15 min)';
          
          addBotMessage(
            `Super ! 🎯\n\n` +
            `**📋 Récapitulatif de ta demande :**\n\n` +
            `👤 **Nom** : ${fullName}\n` +
            `📧 **Email** : ${data.email}\n` +
            `📱 **Téléphone** : ${data.phone}\n` +
            `🌍 **Localisation** : ${data.location}\n` +
            `📞 **Type de RDV** : ${rdvTypeLabel}\n` +
            `📅 **Disponibilités** : ${data.availability}\n` +
            `🎯 **Objectif** : ${trimmedContent || 'Non précisé'}\n` +
            `🏷️ **Formule** : ${rdvFlow.context?.offerName || 'Bootcamp Élite'}\n\n` +
            `Est-ce que tout est correct ? ✅\n\n` +
            `_(Réponds "Oui" pour confirmer ou "Non" pour modifier)_`,
            [
              { id: 'confirm_yes', label: 'Oui, c\'est bon !', action: 'rdv_confirm_yes', icon: '✅' },
              { id: 'confirm_no', label: 'Non, modifier', action: 'rdv_confirm_no', icon: '✏️' },
            ],
            false
          );
          return;
        }

        case 'SUMMARY_CONFIRM': {
          if (lowerContent === 'oui' || lowerContent === 'yes' || lowerContent === 'ok' || lowerContent === 'confirmer') {
            // Passer à l'étape de soumission
            setRdvFlow(prev => ({ ...prev, step: 'SUBMIT_TO_BACKEND' }));
            
            // Soumettre la demande
            const payload: CreateAppointmentPayload = {
              offerId: rdvFlow.context?.offerId || 'immersion_elite',
              offerName: rdvFlow.context?.offerName || 'Bootcamp Élite',
              firstName: rdvFlow.data.firstName || '',
              lastName: rdvFlow.data.lastName || '',
              email: rdvFlow.data.email || '',
              phone: rdvFlow.data.phone || '',
              location: rdvFlow.data.location,
              type: rdvFlow.data.type || 'appel_decouverte',
              availability: rdvFlow.data.availability || '',
              goals: rdvFlow.data.goals,
              source: rdvFlow.context?.source || 'chatbot_direct',
              sessionId: rdvFlow.context?.sessionId,
              userId: user?.id,
            };
            
            try {
              const result = await submitAppointmentRequest(payload);
              
              if (result.success) {
                setRdvFlow({ active: false, step: 'ASK_NAME', data: {}, context: undefined });
                
                addBotMessage(
                  `🎉 **Merci ${rdvFlow.data.firstName} !**\n\n` +
                  `Ta demande de rendez-vous pour le **${rdvFlow.context?.offerName || 'Bootcamp Élite'}** est bien enregistrée !\n\n` +
                  `📩 Tu vas recevoir un email de confirmation à **${rdvFlow.data.email}**.\n\n` +
                  `Notre équipe te recontactera très rapidement pour confirmer le créneau.\n\n` +
                  `À très vite ! 👋`,
                  [
                    { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
                  ],
                  true
                );
              } else {
                throw new Error(result.error || 'Erreur inconnue');
              }
            } catch (error) {
              console.error('Erreur envoi RDV:', error);
              addBotMessage(
                `😔 Désolé, ta demande n'a pas pu être enregistrée.\n\n` +
                `Réessaie dans quelques minutes ou contacte-nous directement sur Discord.\n\n` +
                `_(Erreur technique : ${error instanceof Error ? error.message : 'Connexion impossible'})_`,
                [
                  { id: 'retry', label: 'Réessayer', action: 'rdv_retry', icon: '🔄' },
                  { id: 'contact', label: 'Contacter support', action: 'contact_human', icon: '💬' },
                ],
                false
              );
            }
            return;
          } else if (lowerContent === 'non' || lowerContent === 'no' || lowerContent === 'modifier') {
            // Recommencer le flux
            setRdvFlow(prev => ({
              ...prev,
              step: 'ASK_NAME',
              data: {
                offerId: prev.context?.offerId,
                offerName: prev.context?.offerName,
                source: prev.context?.source,
              },
            }));
            
            addBotMessage(
              "Pas de souci ! On reprend depuis le début. 📝\n\n" +
              "Peux-tu me redonner ton **prénom et nom** ?",
              [],
              false
            );
            return;
          } else {
            addBotMessage(
              "Merci de répondre par **Oui** pour confirmer ou **Non** pour modifier tes informations. 🙂",
              [
                { id: 'confirm_yes', label: 'Oui, c\'est bon !', action: 'rdv_confirm_yes', icon: '✅' },
                { id: 'confirm_no', label: 'Non, modifier', action: 'rdv_confirm_no', icon: '✏️' },
              ],
              false
            );
            return;
          }
        }

        default:
          // État inattendu, réinitialiser
          setRdvFlow({ active: false, step: 'ASK_NAME', data: {}, context: undefined });
          break;
      }
    }

    // ============================================
    // FLOW CONTACT INTELLIGENT
    // ============================================
    if (contactFlow.active) {
      const trimmedContent = content.trim();
      const lowerContent = trimmedContent.toLowerCase();
      
      // Permettre à l'utilisateur d'annuler
      if (lowerContent === 'annuler' || lowerContent === 'cancel') {
        setContactFlow({ active: false, step: 'ASK_NAME', data: {} });
        addBotMessage(
          "Pas de souci ! Ta demande a été annulée. 👋\n\nSi tu as d'autres questions, je suis là !",
          filterQuickReplies(config.quickReplies),
          false
        );
        return;
      }
      
      switch (contactFlow.step) {
        case 'ASK_NAME': {
          if (trimmedContent.length < 2) {
            addBotMessage("Merci de me donner ton prénom et nom complet. 📝", [], false);
            return;
          }
          
          const nameParts = trimmedContent.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || '';
          
          setContactFlow(prev => ({
            ...prev,
            step: 'ASK_EMAIL',
            data: { ...prev.data, firstName, lastName },
          }));
          
          addBotMessage(
            `Enchanté ${firstName} ! 👋\n\nMaintenant, peux-tu me donner ton **adresse email** ?\n\n_(Pour te recontacter concernant ta demande)_`,
            [],
            false
          );
          return;
        }

        case 'ASK_EMAIL': {
          if (!validateEmail(trimmedContent)) {
            addBotMessage(
              "Hmm, cette adresse email ne semble pas valide. 🤔\n\nPeux-tu vérifier et me la redonner ? (exemple : prenom@email.com)",
              [],
              false
            );
            return;
          }
          
          setContactFlow(prev => ({
            ...prev,
            step: 'ASK_PHONE',
            data: { ...prev.data, email: trimmedContent.toLowerCase().trim() },
          }));
          
          addBotMessage(
            "Parfait ! 📧\n\nTon **numéro de téléphone** ? _(optionnel - tape \"passer\" pour ignorer)_",
            [],
            false
          );
          return;
        }

        case 'ASK_PHONE': {
          if (lowerContent === 'passer' || lowerContent === 'skip' || lowerContent === 'non') {
            setContactFlow(prev => ({
              ...prev,
              step: 'ASK_SUBJECT',
              data: { ...prev.data, phone: undefined },
            }));
          } else if (!validatePhone(trimmedContent)) {
            addBotMessage(
              "Ce numéro ne semble pas valide. 📱\n\nTape un numéro valide ou \"passer\" pour ignorer cette étape.",
              [],
              false
            );
            return;
          } else {
            setContactFlow(prev => ({
              ...prev,
              step: 'ASK_SUBJECT',
              data: { ...prev.data, phone: trimmedContent },
            }));
          }
          
          addBotMessage(
            "Super ! 📱\n\nQuel est le **sujet** de ta demande ?\n\n" +
            "1️⃣ Question sur les offres\n" +
            "2️⃣ Support technique\n" +
            "3️⃣ Bootcamp / Immersion Élite\n" +
            "4️⃣ Partenariat\n" +
            "5️⃣ Autre\n\n" +
            "_(Réponds avec le numéro ou le nom)_",
            [
              { id: 'subj_1', label: 'Question offres', action: 'contact_subject_offres', icon: '💎' },
              { id: 'subj_2', label: 'Support technique', action: 'contact_subject_support', icon: '🔧' },
              { id: 'subj_3', label: 'Bootcamp', action: 'contact_subject_bootcamp', icon: '🚀' },
              { id: 'subj_4', label: 'Partenariat', action: 'contact_subject_partenariat', icon: '🤝' },
              { id: 'subj_5', label: 'Autre', action: 'contact_subject_autre', icon: '❓' },
            ],
            false
          );
          return;
        }

        case 'ASK_SUBJECT': {
          let subject: ContactRequestType = 'autre';
          
          if (lowerContent === '1' || lowerContent.includes('offre')) {
            subject = 'question_offres';
          } else if (lowerContent === '2' || lowerContent.includes('support') || lowerContent.includes('technique')) {
            subject = 'support_technique';
          } else if (lowerContent === '3' || lowerContent.includes('bootcamp') || lowerContent.includes('immersion') || lowerContent.includes('elite')) {
            subject = 'bootcamp_info';
          } else if (lowerContent === '4' || lowerContent.includes('partenariat') || lowerContent.includes('partenaire')) {
            subject = 'partenariat';
          }
          
          setContactFlow(prev => ({
            ...prev,
            step: 'ASK_MESSAGE',
            data: { ...prev.data, subject },
          }));
          
          addBotMessage(
            `Noté : **${contactTypeLabels[subject]}** 📋\n\n` +
            `Maintenant, décris-moi ta demande en détail. Plus tu es précis, mieux on pourra t'aider ! 💬`,
            [],
            false
          );
          return;
        }

        case 'ASK_MESSAGE': {
          if (trimmedContent.length < 10) {
            addBotMessage(
              "Peux-tu me donner un peu plus de détails ? (au moins quelques mots) 📝",
              [],
              false
            );
            return;
          }
          
          setContactFlow(prev => ({
            ...prev,
            step: 'SUMMARY_CONFIRM',
            data: { ...prev.data, message: trimmedContent },
          }));
          
          const data = contactFlow.data;
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
          
          addBotMessage(
            `Parfait ! 🎯\n\n` +
            `**📋 Récapitulatif de ta demande :**\n\n` +
            `👤 **Nom** : ${fullName}\n` +
            `📧 **Email** : ${data.email}\n` +
            `📱 **Téléphone** : ${data.phone || 'Non renseigné'}\n` +
            `🏷️ **Sujet** : ${contactTypeLabels[data.subject || 'autre']}\n` +
            `💬 **Message** : ${trimmedContent}\n\n` +
            `Est-ce que tout est correct ? ✅`,
            [
              { id: 'confirm_yes', label: 'Oui, envoyer !', action: 'contact_confirm_yes', icon: '✅' },
              { id: 'confirm_no', label: 'Non, modifier', action: 'contact_confirm_no', icon: '✏️' },
            ],
            false
          );
          return;
        }

        case 'SUMMARY_CONFIRM': {
          if (lowerContent === 'oui' || lowerContent === 'yes' || lowerContent === 'ok' || lowerContent === 'envoyer') {
            // Soumettre la demande de contact
            setContactFlow(prev => ({ ...prev, step: 'SUBMIT' }));
            
            const payload: ContactRequestPayload = {
              firstName: contactFlow.data.firstName || '',
              lastName: contactFlow.data.lastName || '',
              email: contactFlow.data.email || '',
              phone: contactFlow.data.phone,
              subject: contactFlow.data.subject || 'autre',
              message: contactFlow.data.message || '',
              source: 'chatbot_contact',
              userId: user?.id,
            };
            
            try {
              // Enregistrer dans la table contact_messages
              const { error } = await supabase
                .from('contact_messages')
                .insert({
                  name: `${payload.firstName} ${payload.lastName}`.trim(),
                  email: payload.email,
                  phone: payload.phone,
                  subject: contactTypeLabels[payload.subject],
                  message: payload.message,
                  source: 'chatbot',
                  user_id: payload.userId,
                });
              
              if (error) throw error;
              
              setContactFlow({ active: false, step: 'ASK_NAME', data: {} });
              
              addBotMessage(
                `🎉 **Merci ${contactFlow.data.firstName} !**\n\n` +
                `Ta demande a bien été envoyée à notre équipe !\n\n` +
                `📩 Tu recevras une réponse à **${contactFlow.data.email}** dans les 24-48h.\n\n` +
                `En attendant, n'hésite pas à consulter notre FAQ ou à poser d'autres questions ici ! 👋`,
                [
                  { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
                ],
                true
              );
            } catch (error) {
              console.error('Erreur envoi contact:', error);
              addBotMessage(
                `😔 Désolé, ta demande n'a pas pu être envoyée.\n\n` +
                `Tu peux réessayer ou nous contacter directement sur Discord.`,
                [
                  { id: 'retry', label: 'Réessayer', action: 'contact_human', icon: '🔄' },
                  { id: 'discord', label: 'Aller sur Discord', action: 'join_discord', icon: '💬' },
                ],
                false
              );
            }
            return;
          } else if (lowerContent === 'non' || lowerContent === 'no' || lowerContent === 'modifier') {
            setContactFlow(prev => ({
              ...prev,
              step: 'ASK_NAME',
              data: {},
            }));
            
            addBotMessage(
              "Pas de souci ! On reprend depuis le début. 📝\n\n" +
              "Peux-tu me redonner ton **prénom et nom** ?",
              [],
              false
            );
            return;
          } else {
            addBotMessage(
              "Merci de répondre par **Oui** pour envoyer ou **Non** pour modifier. 🙂",
              [
                { id: 'confirm_yes', label: 'Oui, envoyer !', action: 'contact_confirm_yes', icon: '✅' },
                { id: 'confirm_no', label: 'Non, modifier', action: 'contact_confirm_no', icon: '✏️' },
              ],
              false
            );
            return;
          }
        }

        default:
          setContactFlow({ active: false, step: 'ASK_NAME', data: {} });
          break;
      }
    }

    // ============================================
    // FLOW SUPPORT TECHNIQUE (pour clients)
    // ============================================
    if (supportFlow.active) {
      const trimmedContent = content.trim();
      const lowerContent = trimmedContent.toLowerCase();
      
      // Permettre à l'utilisateur d'annuler
      if (lowerContent === 'annuler' || lowerContent === 'cancel') {
        setSupportFlow({ active: false, step: 'ASK_NAME', data: {} });
        addBotMessage(
          "Pas de souci ! Ta demande de support a été annulée. 👋\n\nSi tu as d'autres questions, je suis là !",
          filterQuickReplies(config.quickReplies),
          false
        );
        return;
      }
      
      switch (supportFlow.step) {
        case 'ASK_NAME': {
          if (trimmedContent.length < 2) {
            addBotMessage("Merci de me donner ton prénom et nom complet. 📝", [], false);
            return;
          }
          
          const nameParts = trimmedContent.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || '';
          
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_EMAIL',
            data: { ...prev.data, firstName, lastName },
          }));
          
          addBotMessage(
            `Merci ${firstName} ! 👋\n\nTon **adresse email** associée à ton compte ?`,
            [],
            false
          );
          return;
        }

        case 'ASK_EMAIL': {
          if (!validateEmail(trimmedContent)) {
            addBotMessage(
              "Hmm, cette adresse email ne semble pas valide. 🤔\n\nPeux-tu vérifier ?",
              [],
              false
            );
            return;
          }
          
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_OFFER',
            data: { ...prev.data, email: trimmedContent.toLowerCase().trim() },
          }));
          
          addBotMessage(
            "Parfait ! 📧\n\nQuelle **offre** as-tu souscrite ?\n\n" +
            "1️⃣ Entrée (147€)\n" +
            "2️⃣ Transformation (497€)\n" +
            "3️⃣ Immersion Élite / Bootcamp (1997€)\n" +
            "4️⃣ Je ne sais plus",
            [],
            false
          );
          return;
        }

        case 'ASK_OFFER': {
          let offer = trimmedContent;
          
          if (lowerContent === '1' || lowerContent.includes('entrée') || lowerContent.includes('entree') || lowerContent.includes('147')) {
            offer = 'Entrée (147€)';
          } else if (lowerContent === '2' || lowerContent.includes('transformation') || lowerContent.includes('497')) {
            offer = 'Transformation (497€)';
          } else if (lowerContent === '3' || lowerContent.includes('immersion') || lowerContent.includes('bootcamp') || lowerContent.includes('elite') || lowerContent.includes('1997')) {
            offer = 'Immersion Élite (1997€)';
          } else if (lowerContent === '4' || lowerContent.includes('sais plus') || lowerContent.includes('sais pas')) {
            offer = 'Non précisé';
          }
          
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_PROBLEM_TYPE',
            data: { ...prev.data, offer },
          }));
          
          addBotMessage(
            `Noté : **${offer}** 📋\n\n` +
            `Quel **type de problème** rencontres-tu ?\n\n` +
            "1️⃣ Accès à la formation\n" +
            "2️⃣ Accès Discord\n" +
            "3️⃣ Problème de paiement\n" +
            "4️⃣ Vidéo ne se charge pas\n" +
            "5️⃣ Problème de compte\n" +
            "6️⃣ Autre problème",
            [
              { id: 'prob_1', label: 'Accès formation', action: 'support_problem_formation', icon: '📚' },
              { id: 'prob_2', label: 'Accès Discord', action: 'support_problem_discord', icon: '💬' },
              { id: 'prob_3', label: 'Paiement', action: 'support_problem_paiement', icon: '💳' },
              { id: 'prob_4', label: 'Vidéo bug', action: 'support_problem_video', icon: '🎥' },
              { id: 'prob_5', label: 'Compte', action: 'support_problem_compte', icon: '👤' },
              { id: 'prob_6', label: 'Autre', action: 'support_problem_autre', icon: '❓' },
            ],
            false
          );
          return;
        }

        case 'ASK_PROBLEM_TYPE': {
          let problemType: SupportProblemType = 'autre';
          
          if (lowerContent === '1' || lowerContent.includes('formation')) {
            problemType = 'acces_formation';
          } else if (lowerContent === '2' || lowerContent.includes('discord')) {
            problemType = 'acces_discord';
          } else if (lowerContent === '3' || lowerContent.includes('paiement') || lowerContent.includes('payer')) {
            problemType = 'paiement';
          } else if (lowerContent === '4' || lowerContent.includes('vidéo') || lowerContent.includes('video') || lowerContent.includes('charge')) {
            problemType = 'video_bug';
          } else if (lowerContent === '5' || lowerContent.includes('compte')) {
            problemType = 'compte';
          }
          
          setSupportFlow(prev => ({
            ...prev,
            step: 'ASK_DESCRIPTION',
            data: { ...prev.data, problemType },
          }));
          
          addBotMessage(
            `Compris : **${supportProblemLabels[problemType]}** 🔧\n\n` +
            `Peux-tu me **décrire précisément** le problème ?\n\n` +
            `_(Message d'erreur, ce que tu as essayé, depuis quand ça arrive, etc.)_`,
            [],
            false
          );
          return;
        }

        case 'ASK_DESCRIPTION': {
          if (trimmedContent.length < 10) {
            addBotMessage(
              "Peux-tu me donner un peu plus de détails pour qu'on puisse t'aider ? 📝",
              [],
              false
            );
            return;
          }
          
          setSupportFlow(prev => ({
            ...prev,
            step: 'SUMMARY_CONFIRM',
            data: { ...prev.data, description: trimmedContent },
          }));
          
          const data = supportFlow.data;
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
          
          addBotMessage(
            `Merci pour ces infos ! 🎯\n\n` +
            `**📋 Récapitulatif du ticket support :**\n\n` +
            `👤 **Nom** : ${fullName}\n` +
            `📧 **Email** : ${data.email}\n` +
            `🏷️ **Offre** : ${data.offer}\n` +
            `🔧 **Problème** : ${supportProblemLabels[data.problemType || 'autre']}\n` +
            `💬 **Description** : ${trimmedContent}\n\n` +
            `Est-ce que tout est correct ? ✅`,
            [
              { id: 'confirm_yes', label: 'Oui, envoyer !', action: 'support_confirm_yes', icon: '✅' },
              { id: 'confirm_no', label: 'Non, modifier', action: 'support_confirm_no', icon: '✏️' },
            ],
            false
          );
          return;
        }

        case 'SUMMARY_CONFIRM': {
          if (lowerContent === 'oui' || lowerContent === 'yes' || lowerContent === 'ok' || lowerContent === 'envoyer') {
            setSupportFlow(prev => ({ ...prev, step: 'SUBMIT' }));
            
            const payload: SupportRequestPayload = {
              firstName: supportFlow.data.firstName || '',
              lastName: supportFlow.data.lastName || '',
              email: supportFlow.data.email || '',
              offer: supportFlow.data.offer || 'Non précisé',
              problemType: supportFlow.data.problemType || 'autre',
              description: supportFlow.data.description || '',
              source: 'chatbot_support',
              userId: user?.id,
            };
            
            try {
              // Enregistrer dans la table contact_messages avec le sujet "Support technique"
              const { error } = await supabase
                .from('contact_messages')
                .insert({
                  name: `${payload.firstName} ${payload.lastName}`.trim(),
                  email: payload.email,
                  subject: `Support: ${supportProblemLabels[payload.problemType]}`,
                  message: `**Offre:** ${payload.offer}\n**Problème:** ${supportProblemLabels[payload.problemType]}\n\n${payload.description}`,
                  source: 'chatbot_support',
                  user_id: payload.userId,
                });
              
              if (error) throw error;
              
              setSupportFlow({ active: false, step: 'ASK_NAME', data: {} });
              
              addBotMessage(
                `🎉 **Merci ${supportFlow.data.firstName} !**\n\n` +
                `Ton ticket de support a bien été créé !\n\n` +
                `📩 Notre équipe te répondra à **${supportFlow.data.email}** dans les plus brefs délais.\n\n` +
                `En attendant, tu peux aussi poser ta question sur Discord pour une réponse plus rapide ! 💬`,
                [
                  { id: 'discord', label: 'Aller sur Discord', action: 'join_discord', icon: '💬' },
                  { id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' },
                ],
                true
              );
            } catch (error) {
              console.error('Erreur envoi support:', error);
              addBotMessage(
                `😔 Désolé, ton ticket n'a pas pu être créé.\n\n` +
                `Contacte-nous directement sur Discord pour une aide immédiate.`,
                [
                  { id: 'discord', label: 'Aller sur Discord', action: 'join_discord', icon: '💬' },
                ],
                false
              );
            }
            return;
          } else if (lowerContent === 'non' || lowerContent === 'no' || lowerContent === 'modifier') {
            setSupportFlow(prev => ({
              ...prev,
              step: 'ASK_NAME',
              data: {},
            }));
            
            addBotMessage(
              "Pas de souci ! On reprend depuis le début. 📝\n\n" +
              "Peux-tu me redonner ton **prénom et nom** ?",
              [],
              false
            );
            return;
          } else {
            addBotMessage(
              "Merci de répondre par **Oui** pour envoyer ou **Non** pour modifier. 🙂",
              [
                { id: 'confirm_yes', label: 'Oui, envoyer !', action: 'support_confirm_yes', icon: '✅' },
                { id: 'confirm_no', label: 'Non, modifier', action: 'support_confirm_no', icon: '✏️' },
              ],
              false
            );
            return;
          }
        }

        default:
          setSupportFlow({ active: false, step: 'ASK_NAME', data: {} });
          break;
      }
    }

    // ============================================
    // LOGIQUE HYBRIDE : LOCAL D'ABORD, GPT ENSUITE
    // ============================================
    
    // 1. Essayer d'abord de répondre avec les données locales (FAQ)
    // Aucune consommation de tokens OpenAI si une réponse locale est trouvée
    const localResult = findLocalIntent(content);
    
    if (localResult.intent) {
      // Réponse trouvée dans la FAQ locale - pas d'appel API
      addBotMessage(addFallbackHint(localResult.intent.answer), localResult.intent.followUps as QuickReply[], true);
      return;
    }

    // 2. Si aucune réponse locale : fallback GPT
    // Appel GPT uniquement si aucune réponse locale trouvée
    setIsTyping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Construire le contexte utilisateur pour le chatbot
      const chatbotContext = buildChatbotContext();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: content }
          ],
          // Envoyer le contexte utilisateur au backend
          context: chatbotContext
        })
      });

      // Stop typing avant d'utiliser addBotMessage (qui le relancera pour simuler l'écriture)
      setIsTyping(false);

      if (!response.ok) {
        const errorData = await response.json();
        
        // Gestion rate limit
        if (response.status === 429) {
           addBotMessage("Whoops, tu envoies trop de messages à la fois ! Je vais ralentir un peu, réessaie dans quelques instants. ⏳", [], true);
           return;
        }

        // Gestion contenu toxique ou trop long
        if (response.status === 400 && errorData.error) {
             addBotMessage(errorData.error, [], true);
             return;
        }

        // Gestion non configuré
        if (response.status === 503) {
           addBotMessage(errorData.error || "Le chatbot n'est pas encore configuré.", [], true);
           return;
        }
        throw new Error(errorData.error || 'Erreur API');
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content;

      if (aiContent) {
        addBotMessage(aiContent, [], true);
      } else {
        addBotMessage("Je n'ai pas pu générer de réponse.", [], false);
      }

    } catch (error) {
      console.error('Chatbot Error:', error);
      setIsTyping(false);
      addBotMessage("Désolé, une erreur est survenue lors de la communication avec l'assistant.", [], false);
    }
  }, [addBotMessage, userType, user?.id, rdvFlow, contactFlow, supportFlow, buildChatbotContext, config.quickReplies, filterQuickReplies]);

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
    // Réinitialiser le flux RDV si actif
    setRdvFlow({ active: false, step: 'ASK_NAME', data: {}, context: undefined });
    
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
        isOnline={isOnline}
      />
      
      <ChatWidget
        isOpen={isOpen}
        onToggle={handleToggle}
        unreadCount={unreadCount}
      />
    </div>
  );
}
