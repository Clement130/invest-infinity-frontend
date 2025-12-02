// Types pour le chatbot InvestInfinity

export type UserType = 'visitor' | 'client' | 'admin';

export interface MessageAttachment {
  url: string;
  type: 'image' | 'file';
  name: string;
  size?: number;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick-reply' | 'card' | 'loading' | 'feedback' | 'image' | 'file';
  quickReplies?: QuickReply[];
  cards?: Card[];
  showFeedback?: boolean;
  feedbackGiven?: 'positive' | 'negative' | null;
  // Attachment support
  attachmentUrl?: string;
  attachmentType?: string;
  attachments?: MessageAttachment[];
  // Database ID for persistence
  dbId?: string;
}

export interface QuickReply {
  id: string;
  label: string;
  action: string;
  icon?: string;
  requiresAuth?: boolean;      // Nécessite d'être connecté
  requiresLicense?: boolean;   // Nécessite un abonnement actif
  requiresAdmin?: boolean;     // Nécessite d'être admin
}

export interface Card {
  id: string;
  title: string;
  description: string;
  image?: string;
  buttons?: CardButton[];
}

export interface CardButton {
  label: string;
  action: string;
  type: 'primary' | 'secondary';
}

export interface ChatbotConfig {
  welcomeMessage: string;
  botName: string;
  botAvatar: string;
  primaryColor: string;
  quickReplies: QuickReply[];
}

export interface FAQItem {
  keywords: string[];
  question: string;
  answer: string;
  followUp?: QuickReply[];
  requiresAuth?: boolean;
}

// Types pour le logging/analytics
export interface ChatbotLogEvent {
  timestamp: Date;
  sessionId: string;
  userType: UserType;
  userId?: string;
  eventType: 'open' | 'close' | 'message_sent' | 'message_received' | 'quick_reply_click' | 'action_executed' | 'feedback' | 'error';
  action?: string;
  content?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// Configuration par type d'utilisateur
export const chatbotConfigs: Record<UserType, ChatbotConfig> = {
  visitor: {
    welcomeMessage: "Bonjour 👋 Je suis l'assistant virtuel InvestInfinity. Comment puis-je t'aider aujourd'hui ?",
    botName: "Assistant InvestInfinity",
    botAvatar: "/logo.png",
    primaryColor: "#ec4899",
    quickReplies: [
      { id: "discover", label: "Découvrir l'offre", action: "discover_offer", icon: "✨" },
      { id: "pricing", label: "Tarifs & plans", action: "show_pricing", icon: "💎" },
      { id: "testimonials", label: "Avis clients", action: "show_testimonials", icon: "⭐" },
      { id: "register", label: "S'inscrire", action: "open_register", icon: "🚀" },
      { id: "contact", label: "Contacter un conseiller", action: "contact_human", icon: "💬" },
    ],
  },
  client: {
    welcomeMessage: "Bonjour ! 👋 Comment puis-je t'aider aujourd'hui ?",
    botName: "Support InvestInfinity",
    botAvatar: "/logo.png",
    primaryColor: "#ec4899",
    quickReplies: [
      { id: "training", label: "Accéder à la formation", action: "go_training", icon: "📚", requiresAuth: true },
      { id: "account", label: "Mon compte", action: "go_account", icon: "👤", requiresAuth: true },
      { id: "subscription", label: "Mon abonnement", action: "show_subscription", icon: "💳", requiresAuth: true },
      { id: "support", label: "Support technique", action: "tech_support", icon: "🔧" },
      { id: "discord", label: "Rejoindre Discord", action: "join_discord", icon: "💬" },
    ],
  },
  admin: {
    welcomeMessage: "Bienvenue dans l'interface admin. Que souhaitez-vous consulter ?",
    botName: "Admin Bot",
    botAvatar: "/logo.png",
    primaryColor: "#8b5cf6",
    quickReplies: [
      { id: "stats", label: "Statistiques", action: "show_stats", icon: "📊", requiresAdmin: true },
      { id: "users", label: "Utilisateurs", action: "list_users", icon: "👥", requiresAdmin: true },
      { id: "subscriptions", label: "Abonnements", action: "show_subscriptions", icon: "💰", requiresAdmin: true },
      { id: "reports", label: "Rapports", action: "generate_report", icon: "📈", requiresAdmin: true },
      { id: "alerts", label: "Alertes", action: "show_alerts", icon: "🔔", requiresAdmin: true },
    ],
  },
};

// Base de FAQ scriptée
export const faqDatabase: FAQItem[] = [
  // Questions générales
  {
    keywords: ["investinfinity", "c'est quoi", "qu'est-ce", "présenter", "présentation"],
    question: "Qu'est-ce qu'InvestInfinity ?",
    answer: "InvestInfinity est une communauté premium dédiée aux traders qui veulent progresser sérieusement. Tu accèdes à des analyses quotidiennes de nos experts, des formations complètes, des lives hebdomadaires et une communauté Discord active de +100 membres motivés. Notre mission : t'accompagner pour devenir un trader autonome et rentable.",
    followUp: [
      { id: "pricing", label: "Voir les tarifs", action: "show_pricing", icon: "💎" },
      { id: "register", label: "S'inscrire", action: "open_register", icon: "🚀" },
    ],
  },
  {
    keywords: ["tarif", "prix", "coût", "combien", "abonnement", "offre", "formule"],
    question: "Quels sont les tarifs ?",
    answer: "Nous proposons plusieurs formules adaptées à tes besoins :\n\n💎 **Starter** - Pour bien débuter\n💎 **Pro** - Notre formule la plus populaire\n💎 **Elite** - L'accompagnement complet\n\nChaque formule inclut l'accès à la communauté Discord et aux analyses quotidiennes.",
    followUp: [
      { id: "pricing_page", label: "Voir les détails", action: "go_pricing", icon: "📋" },
      { id: "register", label: "S'inscrire", action: "open_register", icon: "🚀" },
    ],
  },
  {
    keywords: ["rejoindre", "inscription", "inscrire", "commencer", "démarrer", "comment"],
    question: "Comment rejoindre InvestInfinity ?",
    answer: "C'est simple et rapide !\n\n1️⃣ Sélectionne ton offre dans la section tarifs\n2️⃣ Active ton espace membre\n3️⃣ Accède à la formation et rejoins Discord\n\nTout le processus prend moins de 5 minutes !",
    followUp: [
      { id: "pricing", label: "Voir les tarifs", action: "show_pricing", icon: "💎" },
      { id: "register", label: "Créer mon compte", action: "open_register", icon: "🚀" },
    ],
  },
  {
    keywords: ["formation", "cours", "apprendre", "contenu", "programme"],
    question: "Comment est organisée la formation ?",
    answer: "La formation est divisée en deux parties :\n\n📱 **Sur Discord** : Lives trading, zone chill, et zone premium pour échanger avec nous et les autres élèves.\n\n💻 **Sur le site** : Dans ton espace membre dédié, avec toute la formation incluse (vidéos, modules, exercices).",
    followUp: [
      { id: "training", label: "Accéder à la formation", action: "go_training", icon: "📚", requiresAuth: true },
    ],
  },
  {
    keywords: ["signal", "signaux", "trade", "position", "alerte"],
    question: "Donnez-vous des signaux de trading ?",
    answer: "Non, et c'est volontaire ! On ne donne pas de \"signaux\" à copier bêtement.\n\nNos experts partagent leurs positions avec une analyse complète : point d'entrée, stop-loss, take profit, et surtout le POURQUOI derrière chaque trade.\n\n⚠️ **Disclaimer** : Ceci est une information à titre éducatif — ce n'est pas un conseil financier.\n\nL'objectif est de te rendre autonome, pas dépendant.",
    followUp: [
      { id: "discover", label: "En savoir plus", action: "discover_offer", icon: "✨" },
    ],
  },
  {
    keywords: ["live", "lives", "direct", "horaire", "quand"],
    question: "Quand sont les lives trading ?",
    answer: "Les lives trading sont programmés chaque semaine :\n\n📅 **Lundi & Mardi** : 16h - 17h30\n📅 **Mercredi à Vendredi** : 15h - 17h30\n\nTu peux poser tes questions directement à nos experts pendant les lives !",
    followUp: [
      { id: "discord", label: "Rejoindre Discord", action: "join_discord", icon: "💬" },
    ],
  },
  {
    keywords: ["débutant", "novice", "zéro", "commencer", "niveau"],
    question: "Je suis débutant, est-ce pour moi ?",
    answer: "Carrément ! 🎯\n\nNos formations commencent vraiment de zéro : qu'est-ce qu'un pip, comment lire un graphique, les bases du money management...\n\nTu seras guidé pas à pas. Et la communauté est là pour t'aider si tu bloques.",
    followUp: [
      { id: "register", label: "Commencer maintenant", action: "open_register", icon: "🚀" },
    ],
  },
  {
    keywords: ["broker", "courtier", "plateforme", "dépôt"],
    question: "Quel broker utiliser ?",
    answer: "Tu peux rejoindre la formation avec ton broker actuel, pas de souci !\n\nSi tu n'en as pas encore, nous avons des partenaires de confiance chez lesquels tu peux faire un dépôt en toute sécurité.\n\n⚠️ **Disclaimer** : Information à titre indicatif — fais tes propres recherches avant de choisir un broker.",
  },
  {
    keywords: ["sécurité", "données", "rgpd", "confidentialité", "privé"],
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument ! 🔒\n\nTes données personnelles sont protégées et jamais partagées avec des tiers. Nous utilisons un chiffrement SSL et respectons le RGPD.\n\nTu peux supprimer ton compte à tout moment.",
  },
  {
    keywords: ["support", "aide", "problème", "contact", "joindre"],
    question: "Comment contacter le support ?",
    answer: "Plusieurs options s'offrent à toi :\n\n💬 **Discord** : Mentionne @investinfinity\n🤖 **Chatbot** : Je suis là pour t'aider !\n🎥 **En live** : Pose tes questions directement à nos experts\n\nOn répond généralement sous 24h, souvent beaucoup plus vite !",
    followUp: [
      { id: "contact", label: "Contacter un humain", action: "contact_human", icon: "👤" },
    ],
  },
  {
    keywords: ["résultat", "performance", "gain", "profit", "rentable"],
    question: "Quels sont les résultats de vos experts ?",
    answer: "Nos experts partagent leurs résultats en toute transparence sur Discord. Tu peux consulter leur track record complet avec les gains ET les pertes.\n\nEn moyenne, ils visent un Risk/Reward de 3:1 avec 1-2 positions par jour.\n\n⚠️ **Disclaimer** : Les performances passées ne garantissent pas les résultats futurs. Le trading comporte des risques de perte en capital.",
  },
  {
    keywords: ["annuler", "résilier", "arrêter", "remboursement"],
    question: "Comment annuler mon abonnement ?",
    answer: "Tu peux annuler ton abonnement à tout moment depuis ton espace membre, section \"Mon abonnement\".\n\nL'annulation prend effet à la fin de ta période en cours. Tu conserves l'accès jusqu'à cette date.",
    followUp: [
      { id: "account", label: "Gérer mon compte", action: "go_account", icon: "👤", requiresAuth: true },
    ],
    requiresAuth: true,
  },
];

// Réponses par défaut
export const defaultResponses = {
  notUnderstood: "Je n'ai pas bien compris ta question. Peux-tu reformuler ?",
  disclaimer: "\n\n⚠️ **Disclaimer** : Je suis un assistant virtuel (IA). Pour les sujets liés au trading et à l'investissement, rappelle-toi que ces informations sont à titre éducatif uniquement et ne constituent pas un conseil financier.",
  humanEscalation: "Je comprends que tu aies besoin d'une aide plus personnalisée. Tu peux contacter notre équipe directement sur Discord en mentionnant @investinfinity, ou nous écrire à support@investinfinity.com.",
  accessDenied: "🔐 Désolé, tu n'as pas les permissions nécessaires pour cette action.",
  authRequired: "🔐 Tu dois être connecté pour accéder à cette fonctionnalité.\n\nConnecte-toi via 'Mon Compte' en haut à droite, ou crée un compte si tu n'en as pas encore.",
  licenseRequired: "💎 Cette fonctionnalité est réservée aux membres avec un abonnement actif.\n\nDécouvre nos formules pour accéder à tous les contenus !",
  fallbackHint: "\n\n💡 *Si tu ne trouves pas ce que tu cherches, tape librement ta question ou contacte notre équipe.*",
  feedbackRequest: "\n\n---\n*Cette réponse t'a-t-elle été utile ?*",
};

// Actions disponibles avec leurs prérequis
export const actionRequirements: Record<string, { requiresAuth?: boolean; requiresLicense?: boolean; requiresAdmin?: boolean }> = {
  go_training: { requiresAuth: true },
  go_account: { requiresAuth: true },
  show_subscription: { requiresAuth: true },
  show_stats: { requiresAdmin: true },
  list_users: { requiresAdmin: true },
  show_subscriptions: { requiresAdmin: true },
  generate_report: { requiresAdmin: true },
  show_alerts: { requiresAdmin: true },
  go_admin: { requiresAdmin: true },
};
