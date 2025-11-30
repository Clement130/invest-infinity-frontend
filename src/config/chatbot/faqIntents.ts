export type ChatbotIntentId =
  | 'offers_overview'
  | 'offer_entree_details'
  | 'offer_transformation_details'
  | 'offer_immersion_details'
  | 'difference_entree_transformation'
  | 'difference_transformation_immersion'
  | 'access_duration'
  | 'how_to_subscribe'
  | 'payment_methods'
  | 'refund_policy'
  | 'login_help'
  | 'forgot_password'
  | 'video_not_playing'
  | 'discord_access'
  | 'support_contact'
  | 'training_level_required'
  | 'what_is_included_client_area'
  | 'immersion_location_dates'
  | 'immersion_logistics'
  | 'legal_risk_trading'
  | 'no_financial_advice'
  | 'earnings_promise'
  | 'results_transparency'
  | 'broker_choice'
  | 'other';

export type ChatbotIntent = {
  id: ChatbotIntentId;
  category: 'Tarifs' | 'Formation' | 'Technique' | 'Compte' | 'Immersion' | 'Légal' | 'Autre';
  // Variations de formulations possibles côté utilisateur
  patterns: string[]; 
  // Réponse pré-écrite, en texte ou Markdown court
  answer: string;
  // Quick-replies éventuellement à proposer ensuite
  followUps?: { id: string; label: string; action: string; icon?: string }[];
};

export const CHATBOT_INTENTS: ChatbotIntent[] = [
  // --- TARIFS & OFFRES ---
  {
    id: 'offers_overview',
    category: 'Tarifs',
    patterns: ['tarifs', 'prix', 'offres', 'formules', 'combien ça coûte', 'abonnement', 'payer'],
    answer: "Nous proposons 3 formules adaptées à vos besoins :\n\n🔹 **Starter (97€)** : Pour débuter sereinement avec les alertes et la communauté.\n🔹 **Pro (347€)** : Pour progresser avec les lives trading et replays.\n🔹 **Elite (497€)** : La meilleure offre ! Formation complète + coaching 1-to-1.\n\n💡 Paiement en 3x sans frais disponible sur Pro et Elite.\n\nQuelle formule vous intéresse ?",
    followUps: [
      { id: 'entree', label: 'Offre Starter', action: 'show_entree', icon: '🌱' },
      { id: 'transfo', label: 'Offre Pro', action: 'show_transformation', icon: '🚀' },
      { id: 'immersion', label: 'Offre Elite', action: 'show_immersion', icon: '👑' }
    ]
  },
  {
    id: 'offer_entree_details',
    category: 'Tarifs',
    patterns: ['offre entrée', 'starter', 'formule entrée', 'détail entrée', 'entrée contient quoi'],
    answer: "L'offre **Starter (97€ au lieu de 149€)** est idéale pour débuter sereinement.\n\n✅ Alertes de trading\n✅ Accès à la communauté\n✅ Support 7/7\n✅ Vidéos TopStepX/Apex/Metatrader\n\n💰 -35% de réduction ! Paiement unique, accès à vie.",
    followUps: [
      { id: 'buy_entree', label: 'Choisir Starter', action: 'go_pricing', icon: '🛒' },
      { id: 'compare', label: 'Comparer les offres', action: 'show_pricing', icon: '⚖️' }
    ]
  },
  {
    id: 'offer_transformation_details',
    category: 'Tarifs',
    patterns: ['offre transformation', 'pro', 'formule transformation', 'transformation contient quoi', 'intermédiaire'],
    answer: "L'offre **Pro (347€ au lieu de 497€)** pour progresser rapidement ! 🚀\n\n✅ Tout ce qui est dans Starter\n✅ Lives trading (15h-17h30, lun-ven)\n✅ Accès aux replays\n\n💰 -30% de réduction ! Ou 3x 116€/mois sans frais.",
    followUps: [
      { id: 'buy_transfo', label: 'Choisir Pro', action: 'go_pricing', icon: '🛒' },
      { id: 'compare', label: 'Comparer', action: 'show_pricing', icon: '⚖️' }
    ]
  },
  {
    id: 'offer_immersion_details',
    category: 'Tarifs',
    patterns: ['offre immersion', 'élite', 'formule immersion', 'présentiel', 'marseille', 'immersion contient quoi'],
    answer: "L'offre **Elite (497€ au lieu de 1656€)** est notre MEILLEURE OFFRE ! 👑\n\n✅ Tout ce qui est dans Pro\n✅ Zone Premium (analyses avancées)\n✅ Formation complète Invest Infinity\n✅ 2 stratégies rentables\n✅ Mises à jour à vie\n🎁 **BONUS** : Appel 1-to-1 de 30min (valeur 200€)\n\n💰 -70% de réduction ! Ou 3x 166€/mois sans frais.\n🛡️ Garantie 14 jours satisfait ou remboursé.",
    followUps: [
      { id: 'buy_immersion', label: 'Choisir Elite', action: 'go_pricing', icon: '👑' },
      { id: 'compare', label: 'Comparer les offres', action: 'show_pricing', icon: '⚖️' }
    ]
  },
  {
    id: 'payment_methods',
    category: 'Tarifs',
    patterns: ['moyens de paiement', 'payer comment', 'paypal', 'carte bancaire', 'crypto', 'klarna', 'plusieurs fois'],
    answer: "Nous acceptons les paiements sécurisés par **Carte Bancaire** (Stripe) et **Klarna** (paiement en plusieurs fois possible selon éligibilité).\n\nLes transactions sont 100% sécurisées et chiffrées.",
    followUps: [
      { id: 'pricing', label: 'Voir les tarifs', action: 'go_pricing', icon: '💎' }
    ]
  },

  // --- FORMATION ---
  {
    id: 'training_level_required',
    category: 'Formation',
    patterns: ['niveau requis', 'débutant', 'novice', 'je ne connais rien', 'zéro connaissance', 'difficile'],
    answer: "Pas d'inquiétude ! 🎓\n\nNos formations sont conçues pour partir de **zéro**. Nous expliquons les bases (vocabulaire, lecture graphique, outils) avant d'aller vers des stratégies complexes.\n\nVous avancez à votre rythme.",
    followUps: [
      { id: 'start', label: 'Commencer', action: 'open_register', icon: '🚀' }
    ]
  },
  {
    id: 'access_duration',
    category: 'Formation',
    patterns: ['combien de temps', 'durée accès', 'accès à vie', 'limite de temps', 'expiration'],
    answer: "L'accès à nos formations est **à vie** pour toutes les offres ! ♾️\n\nUne fois membre, vous profitez des mises à jour futures du contenu sans surcoût.",
  },
  {
    id: 'what_is_included_client_area',
    category: 'Formation',
    patterns: ['espace client', 'dashboard', 'mon compte', 'plateforme', 'trouver les cours'],
    answer: "Votre Espace Membre centralise tout :\n\n📚 Vos modules de formation\n📈 Votre progression\n👤 Vos paramètres de compte\n\nC'est votre QG pour apprendre le trading.",
    followUps: [
      { id: 'login', label: 'Se connecter', action: 'go_account', icon: 'Login' }
    ]
  },

  // --- TECHNIQUE & COMPTE ---
  {
    id: 'login_help',
    category: 'Compte',
    patterns: ['connexion impossible', 'jarrive pas a me connecter', 'login marche pas', 'bug connexion'],
    answer: "Si vous n'arrivez pas à vous connecter :\n\n1. Vérifiez que vous utilisez bien l'email de votre inscription.\n2. Si vous avez oublié votre mot de passe, utilisez la fonction 'Mot de passe oublié'.\n3. Vérifiez vos spams pour l'email de confirmation.",
    followUps: [
      { id: 'forgot_pw', label: 'Mot de passe oublié', action: 'ask_forgot_password', icon: '🔑' }
    ]
  },
  {
    id: 'forgot_password',
    category: 'Compte',
    patterns: ['mot de passe oublié', 'reset password', 'changer mot de passe', 'perdu mot de passe'],
    answer: "Pour réinitialiser votre mot de passe, cliquez sur 'Se connecter' puis sur le lien **'Mot de passe oublié ?'**.\n\nVous recevrez un lien par email pour en créer un nouveau.",
  },
  {
    id: 'video_not_playing',
    category: 'Technique',
    patterns: ['vidéo marche pas', 'écran noir', 'chargement vidéo', 'lecture impossible', 'bug vidéo'],
    answer: "Problème de lecture vidéo ? 🎥\n\n1. Essayez de désactiver vos bloqueurs de publicité (AdBlock).\n2. Testez sur un autre navigateur (Chrome recommandé).\n3. Vérifiez votre connexion internet.\n\nSi le problème persiste, contactez le support.",
    followUps: [
      { id: 'contact', label: 'Contacter support', action: 'contact_human', icon: '🔧' }
    ]
  },

  // --- COMMUNAUTÉ & IMMERSION ---
  {
    id: 'discord_access',
    category: 'Autre',
    patterns: ['discord', 'rejoindre discord', 'lien discord', 'communauté', 'chat membres'],
    answer: "L'accès au Discord est réservé aux membres. Le lien d'invitation se trouve dans votre **Espace Membre** une fois connecté.\n\nC'est là que se passent les lives et les échanges quotidiens !",
    followUps: [
      { id: 'go_account', label: 'Mon Espace', action: 'go_account', icon: '👤' }
    ]
  },
  {
    id: 'immersion_logistics',
    category: 'Immersion',
    patterns: ['date immersion', 'lieu immersion', 'logement', 'marseille', 'où se passe immersion'],
    answer: "Les sessions d'Immersion Élite se déroulent à **Marseille** dans nos locaux privés.\n\nLes dates sont définies par sessions (généralement une par trimestre). Le logement et le transport restent à votre charge, mais nous pouvons vous recommander des hôtels partenaires à proximité.",
    followUps: [
      { id: 'contact_immersion', label: 'Plus d\'infos', action: 'contact_human', icon: '📞' }
    ]
  },

  // --- LÉGAL & DISCLAIMERS ---
  {
    id: 'no_financial_advice',
    category: 'Légal',
    patterns: ['conseil investissement', 'quoi acheter', 'quel token', 'tu me conseilles quoi', 'conseil financier'],
    answer: "⚠️ **Rappel important** : Je suis une IA à but éducatif.\n\nNous ne donnons **aucun conseil en investissement** ni incitation à acheter ou vendre des actifs spécifiques. Nos contenus servent à vous apprendre à analyser les marchés par vous-même.",
  },
  {
    id: 'earnings_promise',
    category: 'Légal',
    patterns: ['gagner combien', 'devenir riche', 'rentabilité garantie', 'combien je peux gagner', 'millionnaire'],
    answer: "Le trading comporte des risques et les gains ne sont jamais garantis. 📉\n\nVotre réussite dépend de votre travail, de votre discipline et de votre gestion du risque. Méfiez-vous des promesses de gains faciles : elles sont souvent fausses.",
  },
  {
    id: 'broker_choice',
    category: 'Autre',
    patterns: ['quel broker', 'choisir courtier', 'plateforme trading', 'vantage', 'binance', 'bybit'],
    answer: "Le choix du broker vous appartient. Nous recommandons d'utiliser des courtiers régulés et fiables.\n\nDans la formation, nous montrons comment utiliser les plateformes standards (MT4/MT5, TradingView), compatibles avec la plupart des courtiers.",
  },
  
  // --- SUPPORT ---
  {
    id: 'support_contact',
    category: 'Autre',
    patterns: ['parler humain', 'contact support', 'email', 'téléphone', 'problème technique', 'bug'],
    answer: "Besoin d'aide personnalisée ? 🤝\n\nVous pouvez nous contacter :\n1. Sur le Discord (ticket support)\n2. Par email à support@investinfinity.fr\n3. Via ce chat en demandant 'Parler à un humain'",
    followUps: [
      { id: 'human', label: 'Parler à un humain', action: 'contact_human', icon: '👤' }
    ]
  }
];

