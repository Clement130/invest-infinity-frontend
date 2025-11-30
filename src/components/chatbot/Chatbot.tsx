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

  // Trouver une réponse dans les Intents locaux
  const findLocalIntent = (query: string) => {
    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Score de correspondance simple
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

    return bestMatch;
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

      default:
        logActionExecuted(userType, action, false, user?.id, 'unknown_action');
        addBotMessage(
          addFallbackHint("Cette fonctionnalité arrive bientôt ! En attendant, n'hésite pas à me poser d'autres questions."),
          [{ id: 'other', label: 'Autre question', action: 'other_question', icon: '❓' }],
          true
        );
    }
  }, [navigate, user, profile, role, userType, config.quickReplies, checkActionPermission, filterQuickReplies, rdvFlow, addBotMessage]);

  // Gérer l'envoi d'un message utilisateur
  const handleSendMessage = useCallback(async (content: string) => {
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

    // 1. Chercher d'abord dans les intents locaux
    const localIntent = findLocalIntent(content);
    
    if (localIntent) {
      addBotMessage(addFallbackHint(localIntent.answer), localIntent.followUps as QuickReply[], true);
      return;
    }

    // 2. Si pas trouvé, utiliser OpenAI (Fallback)
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
  }, [addBotMessage, userType, user?.id, rdvFlow, buildChatbotContext]);

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
      />
      
      <ChatWidget
        isOpen={isOpen}
        onToggle={handleToggle}
        unreadCount={unreadCount}
      />
    </div>
  );
}
