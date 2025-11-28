import { supabase } from '../lib/supabaseClient';
import { getUserProgressSummary, type UserProgressSummary } from './progressService';
import { getActiveChallenges, joinChallenge, type ChallengeWithParticipation } from './challengesService';
import { fetchUserQuests, type UserQuest } from './questsService';
import { getModules, getLessonsForModule, type TrainingLesson } from './trainingService';

export interface ChatbotContext {
  userId?: string;
  userProfile?: {
    full_name?: string;
    email?: string;
    role?: string;
  };
  progress?: UserProgressSummary;
  challenges?: ChallengeWithParticipation[];
  quests?: UserQuest[];
  conversationHistory?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'action' | 'suggestion';
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'continue_lesson' | 'join_challenge' | 'view_progress' | 'search_content' | 'claim_reward';
  label: string;
  data?: Record<string, unknown>;
}

export interface ChatbotResponse {
  message: string;
  actions?: ChatAction[];
  suggestions?: string[];
  confidence?: number;
}

class ChatbotService {
  private context: ChatbotContext = {};

  async initializeContext(userId?: string): Promise<void> {
    if (!userId) {
      this.context = {};
      return;
    }

    this.context.userId = userId;

    try {
      // Récupérer le profil utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', userId)
        .single();

      if (profile) {
        this.context.userProfile = profile;
      }

      // Récupérer la progression
      this.context.progress = await getUserProgressSummary(userId);

      // Récupérer les challenges actifs
      this.context.challenges = await getActiveChallenges(userId);

      // Récupérer les quêtes
      this.context.quests = await fetchUserQuests(userId);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation du contexte chatbot:', error);
    }
  }

  addToConversation(message: ChatMessage): void {
    if (!this.context.conversationHistory) {
      this.context.conversationHistory = [];
    }

    this.context.conversationHistory.push(message);

    // Garder seulement les 10 derniers messages pour le contexte
    if (this.context.conversationHistory.length > 10) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-10);
    }
  }

  async generateResponse(userMessage: string): Promise<ChatbotResponse> {
    const message = userMessage.toLowerCase().trim();

    // Analyse de l'intention de l'utilisateur
    const intent = this.analyzeIntent(message);

    switch (intent) {
      case 'greeting':
        return this.handleGreeting();

      case 'progress':
        return this.handleProgress();

      case 'challenges':
        return this.handleChallenges();

      case 'quests':
        return this.handleQuests();

      case 'continue_learning':
        return this.handleContinueLearning();

      case 'search_content':
        return this.handleSearchContent(message);

      case 'help':
        return this.handleHelp();

      case 'technical_support':
        return this.handleTechnicalSupport(message);

      case 'pricing':
        return this.handlePricing();

      case 'onboarding':
        return this.handleOnboarding();

      default:
        return this.handleDefault(message);
    }
  }

  private analyzeIntent(message: string): string {
    // Salutations
    if (/\b(salut|bonjour|hello|hey|coucou|bonsoir|salutations)\b/.test(message)) {
      return 'greeting';
    }

    // Progrès et apprentissage
    if (/\b(progrès|progression|avancement|formation|cours|leçon|apprendre|étudier)\b/.test(message)) {
      return 'progress';
    }

    // Challenges
    if (/\b(challenge|défi|concours|compétition)\b/.test(message)) {
      return 'challenges';
    }

    // Quêtes
    if (/\b(quêtes|quête|mission|objectif|daily|hebdo)\b/.test(message)) {
      return 'quests';
    }

    // Continuer l'apprentissage
    if (/\b(continuer|reprendre|suivant|next|what.*next)\b/.test(message)) {
      return 'continue_learning';
    }

    // Recherche
    if (/\b(chercher|rechercher|trouver|search|where)\b/.test(message)) {
      return 'search_content';
    }

    // Aide
    if (/\b(aide|help|comment|how|support)\b/.test(message)) {
      return 'help';
    }

    // Support technique
    if (/\b(problème|bug|erreur|marcher|fonctionne|issue|error)\b/.test(message)) {
      return 'technical_support';
    }

    // Prix
    if (/\b(prix|coût|gratuit|tarif|money|pay|cost)\b/.test(message)) {
      return 'pricing';
    }

    // Démarrage
    if (/\b(débuter|commencer|start|begin|tutorial)\b/.test(message)) {
      return 'onboarding';
    }

    return 'default';
  }

  private handleGreeting(): ChatbotResponse {
    const userName = this.context.userProfile?.full_name?.split(' ')[0] || 'Trader';

    let message = `Salut ${userName} ! 👋 Je suis ton assistant personnel Invest Infinity. `;

    const actions: ChatAction[] = [];
    const suggestions: string[] = [];

    // Si l'utilisateur a du progrès, suggérer de continuer
    if (this.context.progress?.continueLearning) {
      const { moduleTitle, lessonTitle } = this.context.progress.continueLearning;
      message += `Prêt à continuer où tu t'étais arrêté dans "${moduleTitle}" ?`;
      actions.push({
        type: 'continue_lesson',
        label: `Continuer "${lessonTitle}"`,
        data: this.context.progress.continueLearning
      });
    } else {
      message += `Comment puis-je t'aider aujourd'hui ?`;
    }

    // Suggestions basées sur le contexte
    if (this.context.challenges && this.context.challenges.length > 0) {
      const activeChallenge = this.context.challenges.find(c => !c.participation?.completed_at);
      if (activeChallenge) {
        suggestions.push(`Participer au challenge "${activeChallenge.title}"`);
      }
    }

    if (this.context.quests && this.context.quests.length > 0) {
      const activeQuest = this.context.quests.find(q => q.status === 'active');
      if (activeQuest) {
        suggestions.push(`Voir mes quêtes actives`);
      }
    }

    suggestions.push("Mon progrès dans les formations", "Comment rejoindre Discord ?", "Comment ça fonctionne ?");

    return {
      message,
      actions,
      suggestions,
      confidence: 0.9
    };
  }

  private handleProgress(): ChatbotResponse {
    if (!this.context.progress) {
      return {
        message: "Je n'arrive pas à récupérer tes informations de progression pour le moment. Réessaie dans quelques instants.",
        confidence: 0.5
      };
    }

    const { modules, continueLearning } = this.context.progress;
    const totalModules = modules.length;
    const completedModules = modules.filter(m => m.isCompleted).length;
    const totalLessons = modules.reduce((sum, m) => sum + m.totalLessons, 0);
    const completedLessons = modules.reduce((sum, m) => sum + m.completedLessons, 0);

    let message = `📊 **Ton Progrès Global**\n\n`;
    message += `• Modules terminés : ${completedModules}/${totalModules}\n`;
    message += `• Leçons complétées : ${completedLessons}/${totalLessons}\n`;
    message += `• Taux d'avancement : ${totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%\n\n`;

    const actions: ChatAction[] = [];

    if (continueLearning) {
      message += `🎯 **Suggestion :** Continue avec "${continueLearning.lessonTitle}" dans "${continueLearning.moduleTitle}" (${continueLearning.completionRate}% terminé)`;
      actions.push({
        type: 'continue_lesson',
        label: `Continuer "${continueLearning.lessonTitle}"`,
        data: continueLearning
      });
    }

    // Modules en cours
    const inProgressModules = modules.filter(m => !m.isCompleted && m.completedLessons > 0);
    if (inProgressModules.length > 0) {
      message += `\n\n📚 **Modules en cours :**\n`;
      inProgressModules.slice(0, 3).forEach(module => {
        message += `• ${module.moduleTitle} : ${module.completionRate}% (${module.completedLessons}/${module.totalLessons} leçons)\n`;
      });
    }

    actions.push({
      type: 'view_progress',
      label: 'Voir tout mon progrès'
    });

    return {
      message,
      actions,
      confidence: 0.95
    };
  }

  private handleChallenges(): ChatbotResponse {
    if (!this.context.challenges || this.context.challenges.length === 0) {
      return {
        message: "Il n'y a pas de challenges actifs pour le moment. Reste connecté, de nouveaux défis arrivent bientôt ! 🎯",
        confidence: 0.8
      };
    }

    let message = `🏆 **Challenges Actifs**\n\n`;
    const actions: ChatAction[] = [];

    this.context.challenges.slice(0, 3).forEach((challenge, index) => {
      const progressPercent = Math.round((challenge.progress / challenge.target) * 100);
      const isCompleted = challenge.participation?.completed_at;

      message += `${index + 1}. **${challenge.title}**\n`;
      message += `   ${challenge.description}\n`;
      message += `   Progrès : ${challenge.progress}/${challenge.target} (${progressPercent}%)\n`;
      message += `   Récompense : ${challenge.reward}\n`;
      message += `   Participants : ${challenge.participants}\n`;

      if (challenge.userRank) {
        message += `   Ton classement : #${challenge.userRank}\n`;
      }

      if (!challenge.participation) {
        actions.push({
          type: 'join_challenge',
          label: `Rejoindre "${challenge.title}"`,
          data: { challengeId: challenge.id }
        });
      } else if (isCompleted && !challenge.participation.reward_claimed) {
        actions.push({
          type: 'claim_reward',
          label: `Récupérer récompense "${challenge.title}"`,
          data: { challengeId: challenge.id }
        });
      }

      message += '\n';
    });

    return {
      message,
      actions,
      confidence: 0.9
    };
  }

  private handleQuests(): ChatbotResponse {
    if (!this.context.quests || this.context.quests.length === 0) {
      return {
        message: "Aucune quête active pour le moment. Elles se renouvellent régulièrement ! 🎮",
        confidence: 0.7
      };
    }

    const activeQuests = this.context.quests.filter(q => q.status === 'active');
    const claimedQuests = this.context.quests.filter(q => q.status === 'claimed');

    let message = `🎮 **Tes Quêtes**\n\n`;

    if (activeQuests.length > 0) {
      message += `**Actives (${activeQuests.length})**\n`;
      activeQuests.forEach((quest, index) => {
        const progressPercent = Math.round(quest.percentage);
        message += `${index + 1}. ${quest.title}\n`;
        message += `   ${quest.description}\n`;
        message += `   Progrès : ${quest.progress}/${quest.target} (${progressPercent}%)\n`;
        if (quest.reward.xp) {
          message += `   Récompense : ${quest.reward.xp} XP\n`;
        }
        message += '\n';
      });
    }

    if (claimedQuests.length > 0) {
      message += `**Terminées (${claimedQuests.length})**\n`;
      claimedQuests.slice(0, 2).forEach(quest => {
        message += `✅ ${quest.title} - Récompense récupérée\n`;
      });
      if (claimedQuests.length > 2) {
        message += `... et ${claimedQuests.length - 2} autres\n`;
      }
    }

    return {
      message,
      actions: [],
      confidence: 0.85
    };
  }

  private handleContinueLearning(): ChatbotResponse {
    if (!this.context.progress?.continueLearning) {
      return {
        message: "Il semble que tu n'aies pas de leçon en cours. Veux-tu commencer une nouvelle formation ? Je peux te guider ! 🚀",
        actions: [{
          type: 'view_progress',
          label: 'Voir mes formations disponibles'
        }],
        confidence: 0.8
      };
    }

    const { moduleTitle, lessonTitle, completionRate } = this.context.progress.continueLearning;

    let message = `🎯 **Continuons où tu t'es arrêté !**\n\n`;
    message += `Tu étais en train d'étudier :\n`;
    message += `**${lessonTitle}**\n`;
    message += `Dans le module : **${moduleTitle}**\n`;
    message += `Progrès du module : ${completionRate}%\n\n`;
    message += `Prêt à reprendre ? Je t'emmène directement là où tu t'es arrêté !`;

    return {
      message,
      actions: [{
        type: 'continue_lesson',
        label: `Continuer "${lessonTitle}"`,
        data: this.context.progress.continueLearning
      }],
      confidence: 0.95
    };
  }

  private async handleSearchContent(message: string): Promise<ChatbotResponse> {
    // Extraire les termes de recherche du message
    const searchTerms = message.replace(/\b(chercher|rechercher|trouver|search|where)\b/gi, '').trim();

    if (!searchTerms) {
      return {
        message: "Que recherches-tu exactement ? Je peux t'aider à trouver des formations, leçons ou sujets spécifiques. 🔍",
        confidence: 0.6
      };
    }

    try {
      // Rechercher dans les modules
      const modules = await getModules();
      const matchingModules = modules.filter(module =>
        module.title.toLowerCase().includes(searchTerms.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchTerms.toLowerCase())
      );

      let message = `🔍 **Résultats pour "${searchTerms}"**\n\n`;

      if (matchingModules.length > 0) {
        message += `**Modules trouvés :**\n`;
        matchingModules.slice(0, 3).forEach(module => {
          message += `• **${module.title}**\n`;
          if (module.description) {
            message += `  ${module.description.substring(0, 100)}${module.description.length > 100 ? '...' : ''}\n`;
          }
          message += '\n';
        });
      }

      // Rechercher dans les leçons si nécessaire
      if (matchingModules.length === 0) {
        const allLessons: TrainingLesson[] = [];
        for (const module of modules.slice(0, 5)) { // Limiter pour performance
          const lessons = await getLessonsForModule(module.id);
          allLessons.push(...lessons);
        }

        const matchingLessons = allLessons.filter(lesson =>
          lesson.title.toLowerCase().includes(searchTerms.toLowerCase()) ||
          lesson.description?.toLowerCase().includes(searchTerms.toLowerCase())
        );

        if (matchingLessons.length > 0) {
          message += `**Leçons trouvées :**\n`;
          matchingLessons.slice(0, 3).forEach(lesson => {
            const module = modules.find(m => m.id === lesson.module_id);
            message += `• **${lesson.title}**\n`;
            if (module) message += `  Dans : ${module.title}\n`;
            message += '\n';
          });
        }
      }

      if (matchingModules.length === 0 && allLessons?.length === 0) {
        message += `Aucun résultat trouvé pour "${searchTerms}".\n\n`;
        message += `Essaie avec d'autres termes comme :\n`;
        message += `• "analyse technique"\n`;
        message += `• "psychologie trader"\n`;
        message += `• "money management"\n`;
      }

      return {
        message,
        actions: [{
          type: 'search_content',
          label: 'Nouvelle recherche',
          data: { query: searchTerms }
        }],
        confidence: 0.8
      };

    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return {
        message: "Désolé, je n'arrive pas à effectuer la recherche pour le moment. Réessaie dans quelques instants.",
        confidence: 0.3
      };
    }
  }

  private handleHelp(): ChatbotResponse {
    const message = `🤖 **Comment je peux t'aider ?**\n\n` +
      `Je suis là pour te guider dans ton parcours Invest Infinity ! Voici ce que je peux faire :\n\n` +
      `📊 **Suivi de progression**\n` +
      `• Voir ton avancement dans les formations\n` +
      `• Te suggérer la prochaine leçon à suivre\n\n` +
      `🏆 **Gamification**\n` +
      `• Informations sur les challenges actifs\n` +
      `• Suivi de tes quêtes quotidiennes/hebdomadaires\n\n` +
      `🔍 **Recherche**\n` +
      `• Trouver des formations spécifiques\n` +
      `• Rechercher du contenu précis\n\n` +
      `💬 **Support**\n` +
      `• Réponses à tes questions\n` +
      `• Guide pour rejoindre la communauté\n\n` +
      `💰 **Informations**\n` +
      `• Tout sur notre modèle et tarifs\n` +
      `• Comment ouvrir un compte RaiseFX\n\n` +
      `Que veux-tu savoir ?`;

    const suggestions = [
      "Comment rejoindre Invest Infinity ?",
      "Mon progrès dans les formations",
      "Quels challenges sont actifs ?",
      "Comment contacter le support ?"
    ];

    return {
      message,
      suggestions,
      confidence: 0.95
    };
  }

  private handleTechnicalSupport(message: string): ChatbotResponse {
    let response = `🔧 **Support Technique**\n\n`;

    // Détecter le type de problème
    if (message.includes('connexion') || message.includes('login') || message.includes('connect')) {
      response += `**Problème de connexion ?**\n\n`;
      response += `• Vérifie que ton email et mot de passe sont corrects\n`;
      response += `• Essaie de te déconnecter/reconnecter\n`;
      response += `• Vérifie ta connexion internet\n`;
      response += `• Si tu as oublié ton mot de passe, utilise "Mot de passe oublié"\n\n`;
    } else if (message.includes('vidéo') || message.includes('video') || message.includes('lecture')) {
      response += `**Problème de vidéo ?**\n\n`;
      response += `• Actualise la page (F5 ou Ctrl+R)\n`;
      response += `• Essaie un autre navigateur\n`;
      response += `• Vérifie ta connexion internet\n`;
      response += `• Désactive les bloqueurs de pubs\n\n`;
    } else if (message.includes('discord') || message.includes('serveur')) {
      response += `**Problème Discord ?**\n\n`;
      response += `• Vérifie que tu as bien rejoint le serveur\n`;
      response += `• Accepte les règles du serveur\n`;
      response += `• Contacte @investinfinity sur Discord\n\n`;
    } else {
      response += `**Problème technique général**\n\n`;
      response += `Décris-moi ton problème en détail et je t'aiderai !\n\n`;
    }

    response += `Si le problème persiste, contacte-nous :\n`;
    response += `• Sur Discord : @investinfinity\n`;
    response += `• Par email : support@investinfinity.com\n`;
    response += `• Dans le chat d'aide du site`;

    return {
      message: response,
      confidence: 0.85
    };
  }

  private handlePricing(): ChatbotResponse {
    const message = `💰 **Le modèle Invest Infinity**\n\n` +
      `✅ **Ce qui est inclus :**\n` +
      `• Accès à toutes les formations vidéo\n` +
      `• Discord VIP avec alertes quotidiennes\n` +
      `• Communauté de traders actifs\n` +
      `• Analyse technique partagée par Mickaël\n` +
      `• Support et accompagnement\n\n` +
      `🤝 **Notre modèle :**\n` +
      `Nous travaillons en partenariat avec RaiseFX, notre broker de confiance. ` +
      `Pour accéder au contenu premium, tu dois ouvrir un compte chez eux.\n\n` +
      `🚀 **Aucun abonnement caché, aucune surprise !**\n\n` +
      `Prêt à commencer ton aventure trading ?`;

    return {
      message,
      actions: [{
        type: 'view_progress',
        label: 'Commencer les formations'
      }],
      confidence: 0.95
    };
  }

  private handleOnboarding(): ChatbotResponse {
    const message = `🚀 **Bienvenue dans Invest Infinity !**\n\n` +
      `Voici comment commencer ton parcours :\n\n` +
      `1️⃣ **Crée ton compte**\n` +
      `   Inscris-toi sur le site\n\n` +
      `2️⃣ **Ouvre un compte RaiseFX**\n` +
      `   Notre broker partenaire (nécessaire pour l'accès premium)\n\n` +
      `3️⃣ **Rejoins le Discord VIP**\n` +
      `   Lien automatique après inscription\n\n` +
      `4️⃣ **Commence les formations**\n` +
      `   Bases du trading → Analyse technique → Psychologie\n\n` +
      `5️⃣ **Participe aux challenges**\n` +
      `   Gagne des badges et améliore-toi !\n\n` +
      `Besoin d'aide pour une étape spécifique ?`;

    const onboardingSuggestions = [
      "Comment créer mon compte ?",
      "Comment ouvrir un compte RaiseFX ?",
      "Accéder aux formations"
    ];

    return {
      message,
      actions: [{
        type: 'view_progress',
        label: 'Voir mes formations'
      }],
      suggestions: onboardingSuggestions,
      confidence: 0.9
    };
  }

  private handleDefault(message: string): ChatbotResponse {
    // Analyser le message pour des mots-clés spécifiques
    const keywords = {
      mickael: "Mickaël est notre fondateur et trader principal. Il partage quotidiennement ses analyses et positions avec la communauté. Tu peux voir son track record complet sur le Discord ! 📊",
      raisefx: "RaiseFX est notre broker partenaire de confiance ! 🏦 Régulé avec des spreads compétitifs et une exécution rapide. C'est grâce à ce partenariat qu'on peut te proposer l'accès à tout notre contenu premium.",
      discord: "Notre Discord VIP c'est le cœur d'Invest Infinity ! 💬 Alertes quotidiennes, lives hebdomadaires, entraide entre membres actifs. Une vraie communauté de traders motivés !",
      signal: "On ne fait pas de 'signaux' à copier bêtement ! 🎯 Chaque position est accompagnée d'une analyse complète pour que tu comprennes le POURQUOI. L'objectif est de te former, pas de te rendre dépendant.",
      argent: "Mickaël partage ses résultats en toute transparence ! 📈 Tu peux voir son track record complet sur le Discord avec les gains ET les pertes. Il vise un Risk/Reward de 3:1 en moyenne."
    };

    for (const [keyword, response] of Object.entries(keywords)) {
      if (message.includes(keyword)) {
        return {
          message: response,
          confidence: 0.8
        };
      }
    }

    // Réponse par défaut avec suggestions
    const defaultMessage = `Je ne suis pas sûr de bien comprendre ta question. 🤔\n\n` +
      `Je peux t'aider avec :\n` +
      `• Ton progrès dans les formations\n` +
      `• Les challenges et quêtes actifs\n` +
      `• Recherche de contenu spécifique\n` +
      `• Questions sur Invest Infinity\n` +
      `• Support technique\n\n` +
      `Essaie de reformuler ou choisis une option ci-dessous !`;

    const suggestions = [
      "Mon progrès dans les formations",
      "Quels challenges sont disponibles ?",
      "Comment contacter le support ?",
      "Comment ça fonctionne ?"
    ];

    return {
      message: defaultMessage,
      suggestions,
      confidence: 0.4
    };
  }

  // Générer des suggestions proactives basées sur le contexte
  generateProactiveSuggestions(): ChatbotResponse | null {
    if (!this.context.userId) return null;

    const suggestions: string[] = [];
    const actions: ChatAction[] = [];

    // Si l'utilisateur a du progrès mais n'a pas continué récemment
    if (this.context.progress?.continueLearning) {
      const lastActivity = this.context.progress.continueLearning;
      suggestions.push(`Continuer "${lastActivity.lessonTitle}" dans "${lastActivity.moduleTitle}"`);
      actions.push({
        type: 'continue_lesson',
        label: `Continuer la formation`,
        data: lastActivity
      });
    }

    // Si des challenges sont disponibles
    if (this.context.challenges && this.context.challenges.length > 0) {
      const activeChallenge = this.context.challenges.find(c => !c.participation?.completed_at);
      if (activeChallenge && !activeChallenge.participation) {
        suggestions.push(`Rejoindre le challenge "${activeChallenge.title}"`);
        actions.push({
          type: 'join_challenge',
          label: `Rejoindre "${activeChallenge.title}"`,
          data: { challengeId: activeChallenge.id }
        });
      }
    }

    // Si des quêtes sont disponibles
    if (this.context.quests && this.context.quests.length > 0) {
      const activeQuest = this.context.quests.find(q => q.status === 'active' && q.progress < q.target);
      if (activeQuest) {
        suggestions.push(`Avancer dans ta quête "${activeQuest.title}" (${activeQuest.progress}/${activeQuest.target})`);
      }
    }

    // Suggestions générales basées sur le temps
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      suggestions.push("Commencer ta journée de trading avec les dernières analyses");
    } else if (hour >= 12 && hour < 18) {
      suggestions.push("Voir les opportunités de l'après-midi");
    } else if (hour >= 18 && hour < 22) {
      suggestions.push("Faire le point sur tes trades de la journée");
    }

    if (suggestions.length === 0) {
      return null;
    }

    return {
      message: `💡 **Suggestion intelligente**\n\nJe vois que tu es actif ! Voici ce que tu pourrais faire :`,
      actions,
      suggestions,
      confidence: 0.9
    };
  }

  // Vérifier si on devrait afficher une suggestion proactive
  shouldShowProactiveSuggestion(): boolean {
    if (!this.context.userId) return false;

    // Ne pas afficher si le chat est vide ou si le dernier message est récent
    if (this.context.conversationHistory && this.context.conversationHistory.length > 1) {
      const lastMessage = this.context.conversationHistory[this.context.conversationHistory.length - 1];
      const minutesSinceLastMessage = (Date.now() - lastMessage.timestamp.getTime()) / (1000 * 60);

      // Attendre au moins 5 minutes depuis le dernier message
      if (minutesSinceLastMessage < 5) return false;
    }

    // Vérifier s'il y a du contenu utile à suggérer
    const hasProgress = this.context.progress?.continueLearning;
    const hasChallenges = this.context.challenges?.some(c => !c.participation);
    const hasActiveQuests = this.context.quests?.some(q => q.status === 'active');

    return !!(hasProgress || hasChallenges || hasActiveQuests);
  }

  // Méthodes utilitaires pour les actions
  async executeAction(action: ChatAction): Promise<string> {
    switch (action.type) {
      case 'continue_lesson':
        // Logique pour rediriger vers la leçon
        const lessonData = action.data as { lessonTitle?: string } | undefined;
        return `Redirection vers la leçon "${lessonData?.lessonTitle || 'la leçon suivante'}"...`;

      case 'join_challenge':
        if (this.context.userId && action.data) {
          try {
            const challengeData = action.data as { challengeId: string };
            await joinChallenge(challengeData.challengeId, this.context.userId);
            // Recharger le contexte
            await this.initializeContext(this.context.userId);
            return `✅ Challenge rejoint avec succès !`;
          } catch (error) {
            console.error('Erreur lors de la participation au challenge:', error);
            return `❌ Erreur lors de la participation au challenge.`;
          }
        }
        return `Connecte-toi pour rejoindre les challenges !`;

      case 'claim_reward':
        // Logique pour récupérer les récompenses
        return `🎉 Récompense récupérée !`;

      default:
        return `Action non reconnue.`;
    }
  }
}

export const chatbotService = new ChatbotService();
