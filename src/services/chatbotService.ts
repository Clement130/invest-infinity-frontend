import { supabase } from '../lib/supabaseClient';
import { getUserProgressSummary, type UserProgressSummary } from './progressService';
import { getActiveChallenges, joinChallenge, type ChallengeWithParticipation } from './challengesService';
import { fetchUserQuests, type UserQuest } from './questsService';
import { getModules, getLessonsForModule, type TrainingLesson } from './trainingService';
import { callOpenAI, type ChatContext } from './openaiService';

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

    let response: ChatbotResponse;

    switch (intent) {
      case 'greeting':
        response = this.handleGreeting();
        break;

      case 'goodbye':
        response = this.handleGoodbye();
        break;

      case 'progress':
        response = this.handleProgress();
        break;

      case 'training_content':
        response = this.handleTrainingContent();
        break;

      case 'challenges':
        response = this.handleChallenges();
        break;

      case 'quests':
        response = this.handleQuests();
        break;

      case 'continue_learning':
        response = this.handleContinueLearning();
        break;

      case 'search_content':
        response = await this.handleSearchContent(message);
        break;

      case 'discord':
        response = this.handleDiscord();
        break;

      case 'registration':
        response = this.handleRegistration();
        break;

      case 'raisefx':
        response = this.handleRaiseFX();
        break;

      case 'how_it_works':
        response = this.handleHowItWorks();
        break;

      case 'pricing':
        response = this.handlePricing();
        break;

      case 'onboarding':
        response = this.handleOnboarding();
        break;

      case 'founder':
        response = this.handleFounder();
        break;

      case 'results':
        response = this.handleResults();
        break;

      case 'signals':
        response = this.handleSignals();
        break;

      case 'money_management':
        response = this.handleMoneyManagement();
        break;

      case 'technical_analysis':
        response = this.handleTechnicalAnalysis();
        break;

      case 'psychology':
        response = this.handlePsychology();
        break;

      case 'strategies':
        response = this.handleStrategies();
        break;

      case 'prop_firm':
        response = this.handlePropFirm();
        break;

      case 'technical_support':
        response = this.handleTechnicalSupport(message);
        break;

      case 'contact':
        response = this.handleContact();
        break;

      case 'help':
        response = this.handleHelp();
        break;

      case 'thanks':
        response = this.handleThanks();
        break;

      default:
        response = this.handleDefault(message);
        break;
    }

    // Si la confiance est très faible (< 0.5) ou si c'est une réponse par défaut, essayer OpenAI
    // On utilise un seuil bas pour maximiser l'utilisation de la logique locale (80% des cas)
    if (response.confidence && response.confidence < 0.5) {
      const aiResponse = await this.tryOpenAIFallback(userMessage, response);
      if (aiResponse) {
        return aiResponse;
      }
    }

    return response;
  }

  /**
   * Essaie d'obtenir une réponse de l'IA OpenAI en fallback
   */
  private async tryOpenAIFallback(
    userMessage: string,
    fallbackResponse: ChatbotResponse
  ): Promise<ChatbotResponse | null> {
    try {
      // Construire le contexte utilisateur
      const context: ChatContext = {
        userId: this.context.userId,
        userName: this.context.userProfile?.full_name,
        progress: this.context.progress ? {
          completedModules: this.context.progress.modules.filter(m => m.isCompleted).length,
          totalModules: this.context.progress.modules.length,
          continueLearning: this.context.progress.continueLearning ? {
            moduleTitle: this.context.progress.continueLearning.moduleTitle,
            lessonTitle: this.context.progress.continueLearning.lessonTitle,
          } : undefined,
        } : undefined,
        challenges: this.context.challenges?.slice(0, 3).map(c => ({
          title: c.title,
          progress: c.progress,
          target: c.target,
        })),
      };

      const aiResponse = await callOpenAI(userMessage, context);

      if (aiResponse && aiResponse.message) {
        return {
          message: aiResponse.message,
          confidence: 0.85, // Confiance élevée pour les réponses IA
          suggestions: fallbackResponse.suggestions, // Garder les suggestions du fallback
        };
      }
    } catch (error) {
      console.error('[chatbotService] Error calling OpenAI fallback:', error);
    }

    return null; // Retourner null pour utiliser la réponse par défaut
  }

  private analyzeIntent(message: string): string {
    const msg = message.toLowerCase().trim();

    // Salutations (priorité haute)
    if (/\b(salut|bonjour|hello|hey|coucou|bonsoir|salutations|bon matin|bonne soirée|hi|ciao)\b/.test(msg)) {
      return 'greeting';
    }

    // Au revoir
    if (/\b(au revoir|bye|à bientôt|ciao|à plus|à tout|goodbye|see you|à la prochaine)\b/.test(msg) && msg.length < 30) {
      return 'goodbye';
    }

    // Progrès et apprentissage
    if (/\b(progrès|progression|avancement|avancé|où.*en suis|mon niveau|mes stats|statistiques|combien.*terminé|pourcentage)\b/.test(msg)) {
      return 'progress';
    }

    // Formations disponibles / contenu
    if (/\b(formation|formations|cours|leçon|leçons|module|modules|contenu|programme|curriculum|syllabus|quelles.*formations|quels.*cours)\b/.test(msg)) {
      return 'training_content';
    }

    // Challenges
    if (/\b(challenge|challenges|défi|défis|concours|compétition|compétitions|classement|leaderboard|ranking)\b/.test(msg)) {
      return 'challenges';
    }

    // Quêtes
    if (/\b(quêtes|quête|mission|missions|objectif|objectifs|daily|hebdo|quotidien|hebdomadaire|tâche|tâches)\b/.test(msg)) {
      return 'quests';
    }

    // Continuer l'apprentissage
    if (/\b(continuer|reprendre|suivant|next|what.*next|où.*continuer|prochaine.*leçon|prochain.*cours|reprendre.*où)\b/.test(msg)) {
      return 'continue_learning';
    }

    // Recherche de contenu spécifique
    if (/\b(chercher|rechercher|trouver|search|where|où.*trouver|où.*voir|où.*voir|localiser)\b/.test(msg)) {
      return 'search_content';
    }

    // Discord / Communauté
    if (/\b(discord|serveur|communauté|groupe|chat|membres|rejoindre.*discord|lien.*discord|comment.*discord)\b/.test(msg)) {
      return 'discord';
    }

    // Inscription / Compte
    if (/\b(inscrire|inscription|s'inscrire|créer.*compte|compte|register|signup|sign.*up|rejoindre|adhérer)\b/.test(msg)) {
      return 'registration';
    }

    // RaiseFX / Broker
    if (/\b(raisefx|broker|courtier|compte.*trading|ouvrir.*compte|compte.*broker|courtier.*partenaire)\b/.test(msg)) {
      return 'raisefx';
    }

    // Comment ça fonctionne / Fonctionnement
    if (/\b(comment.*fonctionne|comment.*ça.*marche|fonctionnement|fonctionne|principe|modèle|système|processus|méthode)\b/.test(msg)) {
      return 'how_it_works';
    }

    // Prix / Gratuit / Coût
    if (/\b(prix|coût|gratuit|gratuite|payant|payer|abonnement|tarif|combien|money|pay|cost|free|pricing)\b/.test(msg)) {
      return 'pricing';
    }

    // Débuter / Commencer
    if (/\b(débuter|commencer|start|begin|tutorial|premiers.*pas|par.*où.*commencer|comment.*débuter|nouveau)\b/.test(msg)) {
      return 'onboarding';
    }

    // Mickaël / Fondateur
    if (/\b(mickaël|mickael|michael|fondateur|créateur|qui.*créé|qui.*fondé|trader.*principal|mentor|coach)\b/.test(msg)) {
      return 'founder';
    }

    // Résultats / Performances
    if (/\b(résultat|résultats|performance|performances|gain|gains|profit|profits|rentable|rentabilité|track.*record|stats.*mickael)\b/.test(msg)) {
      return 'results';
    }

    // Signaux / Alertes
    if (/\b(signal|signaux|alerte|alertes|position|positions|trade|trades|setup|setups|opportunité|opportunités)\b/.test(msg)) {
      return 'signals';
    }

    // Money Management / Risk Management
    if (/\b(money.*management|gestion.*risque|risk.*reward|risk.*reward|gestion.*capital|position.*sizing|taille.*position)\b/.test(msg)) {
      return 'money_management';
    }

    // Analyse technique
    if (/\b(analyse.*technique|technical.*analysis|indicateur|indicateurs|support|résistance|tendance|chart|graphique|pattern)\b/.test(msg)) {
      return 'technical_analysis';
    }

    // Psychologie du trading
    if (/\b(psychologie|mental|émotion|émotions|discipline|patience|stress|peur|greed|avide|gestion.*émotion)\b/.test(msg)) {
      return 'psychology';
    }

    // Stratégies de trading
    if (/\b(stratégie|stratégies|strategy|méthode.*trading|approche|style.*trading|scalping|swing|day.*trading|position.*trading)\b/.test(msg)) {
      return 'strategies';
    }

    // TopStep / Prop Firm
    if (/\b(topstep|top.*step|prop.*firm|firme.*propriétaire|funded.*account|compte.*financé|challenge.*prop)\b/.test(msg)) {
      return 'prop_firm';
    }

    // Support technique / Problèmes
    if (/\b(problème|bug|erreur|marcher|fonctionne|issue|error|bug|crash|planté|ne.*marche|ne.*fonctionne|aide.*technique)\b/.test(msg)) {
      return 'technical_support';
    }

    // Contact / Support
    if (/\b(contact|contacter|support|aide|help|comment.*contacter|où.*contacter|email|téléphone|phone|assistance)\b/.test(msg)) {
      return 'contact';
    }

    // Aide générale
    if (/\b(aide|help|comment|how|assistance|guide|tutoriel|explication)\b/.test(msg)) {
      return 'help';
    }

    // Remerciements
    if (/\b(merci|thanks|thank.*you|grazie|danke|remerciement|apprécie|génial|super|parfait|cool|excellent)\b/.test(msg)) {
      return 'thanks';
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

  private handleGoodbye(): ChatbotResponse {
    const message = `À très vite ! 👋\n\n` +
      `N'oublie pas :\n` +
      `• Continue tes formations régulièrement\n` +
      `• Rejoins-nous sur Discord pour les alertes\n` +
      `• Participe aux challenges pour progresser\n\n` +
      `On se retrouve bientôt ! 🚀`;

    return {
      message,
      confidence: 0.9
    };
  }

  private handleTrainingContent(): ChatbotResponse {
    let message = `📚 **Nos Formations Complètes**\n\n`;

    if (this.context.progress) {
      const totalModules = this.context.progress.modules.length;
      const completedModules = this.context.progress.modules.filter(m => m.isCompleted).length;
      
      message += `Tu as accès à **${totalModules} modules** de formation !\n\n`;
      
      if (completedModules > 0) {
        message += `✅ **Modules terminés :** ${completedModules}/${totalModules}\n\n`;
      }

      // Lister les modules disponibles
      const activeModules = this.context.progress.modules.filter(m => m.is_active !== false);
      if (activeModules.length > 0) {
        message += `**Modules disponibles :**\n`;
        activeModules.slice(0, 5).forEach(module => {
          const completionRate = module.completionRate || 0;
          message += `• **${module.moduleTitle}** (${completionRate}%)\n`;
        });
        if (activeModules.length > 5) {
          message += `... et ${activeModules.length - 5} autres modules\n`;
        }
      }
    } else {
      message += `Nos formations couvrent tout le trading :\n\n` +
        `• 📖 **Bases du trading** pour débutants\n` +
        `• 📊 **Analyse technique** avancée\n` +
        `• 💰 **Money management** et gestion du risque\n` +
        `• 🧠 **Psychologie du trader**\n` +
        `• 🎯 **Stratégies** de Mickaël\n` +
        `• 📈 **Analyse de marché** en temps réel\n\n` +
        `Tout est en vidéo, accessible 24/7 sur ton espace membre !`;
    }

    const actions: ChatAction[] = [];
    if (this.context.progress?.continueLearning) {
      actions.push({
        type: 'continue_lesson',
        label: `Continuer "${this.context.progress.continueLearning.lessonTitle}"`,
        data: this.context.progress.continueLearning
      });
    }

    return {
      message,
      actions,
      confidence: 0.9
    };
  }

  private handleDiscord(): ChatbotResponse {
    const message = `💬 **Discord VIP Invest Infinity**\n\n` +
      `Notre Discord VIP c'est le cœur de la communauté ! Voici ce que tu y trouveras :\n\n` +
      `🔥 **Contenu quotidien :**\n` +
      `• Alertes trading de Mickaël avec analyses complètes\n` +
      `• Explications détaillées de chaque position\n` +
      `• Partage de setups et opportunités\n\n` +
      `📺 **Lives réguliers :**\n` +
      `• Lives hebdomadaires avec Mickaël\n` +
      `• Analyses de marché en direct\n` +
      `• Q&A avec la communauté\n\n` +
      `🤝 **Communauté active :**\n` +
      `• +100 membres actifs et motivés\n` +
      `• Entraide entre traders\n` +
      `• Partage d'expériences et stratégies\n\n` +
      `🚀 **Comment rejoindre ?**\n` +
      `Le lien Discord VIP t'est envoyé automatiquement après ton inscription et l'ouverture de ton compte RaiseFX !`;

    return {
      message,
      confidence: 0.95
    };
  }

  private handleRegistration(): ChatbotResponse {
    const message = `🚀 **Rejoindre Invest Infinity**\n\n` +
      `C'est simple et rapide ! Voici les étapes :\n\n` +
      `1️⃣ **Crée ton compte**\n` +
      `   Clique sur "S'inscrire" en haut à droite\n` +
      `   Remplis le formulaire avec ton email\n\n` +
      `2️⃣ **Ouvre un compte RaiseFX**\n` +
      `   Notre broker partenaire (obligatoire pour l'accès premium)\n` +
      `   C'est rapide et sécurisé\n\n` +
      `3️⃣ **Accède au Discord VIP**\n` +
      `   Le lien t'est envoyé automatiquement\n` +
      `   Rejoins la communauté de traders\n\n` +
      `4️⃣ **Commence les formations**\n` +
      `   Accède à toutes les vidéos de formation\n` +
      `   Apprends à ton rythme\n\n` +
      `⏱️ **Temps total : moins de 10 minutes !**\n\n` +
      `Besoin d'aide pour une étape spécifique ?`;

    return {
      message,
      actions: [{
        type: 'view_progress',
        label: 'Voir les formations disponibles'
      }],
      confidence: 0.95
    };
  }

  private handleRaiseFX(): ChatbotResponse {
    const message = `🏦 **RaiseFX - Notre Broker Partenaire**\n\n` +
      `RaiseFX est notre broker de confiance qui permet à Invest Infinity d'être 100% gratuit !\n\n` +
      `✅ **Pourquoi RaiseFX ?**\n` +
      `• Broker régulé et sécurisé\n` +
      `• Spreads compétitifs\n` +
      `• Exécution rapide et fiable\n` +
      `• Plateforme professionnelle\n` +
      `• Support réactif\n\n` +
      `🤝 **Le Partenariat :**\n` +
      `Grâce à notre partenariat avec RaiseFX, nous pouvons t'offrir :\n` +
      `• Toutes les formations vidéo GRATUITEMENT\n` +
      `• Accès au Discord VIP GRATUITEMENT\n` +
      `• Tous les contenus premium GRATUITEMENT\n\n` +
      `💡 **Comment ça marche ?**\n` +
      `En ouvrant un compte chez RaiseFX, tu accèdes à tout le contenu Invest Infinity. ` +
      `C'est notre modèle économique : pas d'abonnement, pas de frais cachés !\n\n` +
      `Prêt à ouvrir ton compte ?`;

    return {
      message,
      confidence: 0.95
    };
  }

  private handleHowItWorks(): ChatbotResponse {
    const message = `⚙️ **Comment Invest Infinity fonctionne**\n\n` +
      `Notre modèle est simple et transparent :\n\n` +
      `🎯 **1. Inscription gratuite**\n` +
      `   Crée ton compte en quelques clics\n\n` +
      `🏦 **2. Compte RaiseFX**\n` +
      `   Ouvre un compte chez notre broker partenaire\n` +
      `   C'est grâce à ce partenariat qu'on peut être gratuit\n\n` +
      `🎁 **3. Accès immédiat**\n` +
      `   Dès que ton compte RaiseFX est ouvert :\n` +
      `   ✅ Toutes les formations vidéo\n` +
      `   ✅ Discord VIP avec alertes\n` +
      `   ✅ Communauté de traders\n` +
      `   ✅ Support et accompagnement\n\n` +
      `💰 **Pourquoi c'est gratuit ?**\n` +
      `Nous travaillons en partenariat avec RaiseFX. ` +
      `Quand tu ouvres un compte chez eux, ils nous rémunèrent. ` +
      `C'est comme ça qu'on peut t'offrir tout gratuitement !\n\n` +
      `🚫 **Pas de piège :**\n` +
      `• Aucun abonnement caché\n` +
      `• Aucun frais supplémentaire\n` +
      `• Tu peux quitter quand tu veux\n` +
      `• Tout reste accessible tant que tu as un compte RaiseFX`;

    return {
      message,
      confidence: 0.95
    };
  }

  private handleFounder(): ChatbotResponse {
    const message = `👤 **Mickaël - Fondateur & Trader Principal**\n\n` +
      `Mickaël est le créateur d'Invest Infinity et trader principal de la communauté.\n\n` +
      `🎯 **Son objectif :**\n` +
      `Te rendre autonome et rentable en trading. Il partage quotidiennement :\n` +
      `• Ses analyses de marché\n` +
      `• Ses positions avec explications complètes\n` +
      `• Son processus de décision\n` +
      `• Ses erreurs et apprentissages\n\n` +
      `📊 **Transparence totale :**\n` +
      `Tu peux voir son track record complet sur le Discord avec :\n` +
      `• Tous les gains ET les pertes\n` +
      `• Le Risk/Reward de chaque trade\n` +
      `• Les statistiques réelles\n\n` +
      `💡 **Philosophie :**\n` +
      `"On ne fait pas de signaux à copier. Chaque position est accompagnée d'une analyse ` +
      `pour que tu comprennes le POURQUOI. L'objectif est de te former, pas de te rendre dépendant."\n\n` +
      `🎯 **Objectif Risk/Reward :** 3:1 en moyenne`;

    return {
      message,
      confidence: 0.95
    };
  }

  private handleResults(): ChatbotResponse {
    const message = `📈 **Résultats & Performances**\n\n` +
      `Mickaël partage ses résultats en toute transparence sur le Discord !\n\n` +
      `✅ **Ce que tu peux voir :**\n` +
      `• Track record complet avec gains ET pertes\n` +
      `• Risk/Reward de chaque position\n` +
      `• Statistiques détaillées\n` +
      `• Analyse de chaque trade\n\n` +
      `🎯 **Objectif Risk/Reward :** 3:1 en moyenne\n\n` +
      `⚠️ **Important :**\n` +
      `Les performances passées ne garantissent pas les résultats futurs. ` +
      `Le trading comporte des risques. Ne trade jamais avec de l'argent que tu ne peux pas te permettre de perdre.\n\n` +
      `💡 **Notre approche :**\n` +
      `On ne promet pas de gains faciles. On t'apprend à devenir un trader autonome ` +
      `avec une bonne gestion du risque et une discipline solide.`;

    return {
      message,
      confidence: 0.9
    };
  }

  private handleSignals(): ChatbotResponse {
    const message = `🎯 **Alertes & Positions de Mickaël**\n\n` +
      `Mickaël partage ses positions quotidiennement sur le Discord VIP, mais attention :\n\n` +
      `❌ **Ce qu'on ne fait PAS :**\n` +
      `• On ne donne pas de "signaux" à copier bêtement\n` +
      `• On ne promet pas de gains faciles\n` +
      `• On ne crée pas de dépendance\n\n` +
      `✅ **Ce qu'on fait VRAIMENT :**\n` +
      `• Chaque position est accompagnée d'une analyse COMPLÈTE\n` +
      `• Explication du POURQUOI de l'entrée\n` +
      `• Gestion du risque détaillée\n` +
      `• Suivi et explication de la sortie\n\n` +
      `🎓 **L'objectif :**\n` +
      `Te former pour que tu comprennes la logique derrière chaque trade. ` +
      `L'idée n'est pas de copier, mais d'apprendre à analyser toi-même.\n\n` +
      `💡 **Philosophie :**\n` +
      `"Un trader autonome vaut mieux qu'un trader dépendant."`;

    return {
      message,
      confidence: 0.95
    };
  }

  private handleMoneyManagement(): ChatbotResponse {
    const message = `💰 **Money Management & Gestion du Risque**\n\n` +
      `La gestion du capital est LA compétence la plus importante en trading !\n\n` +
      `📚 **Ce que tu apprendras :**\n` +
      `• Comment calculer la taille de tes positions\n` +
      `• Le Risk/Reward optimal (objectif 3:1)\n` +
      `• Gestion du drawdown\n` +
      `• Protection du capital\n` +
      `• Position sizing adapté à ton capital\n\n` +
      `🎯 **Règles d'or :**\n` +
      `• Ne jamais risquer plus de 1-2% par trade\n` +
      `• Toujours avoir un stop loss\n` +
      `• Respecter son plan de trading\n` +
      `• Ne jamais trader sur émotion\n\n` +
      `📖 **Dans nos formations :**\n` +
      `Tu trouveras des modules complets sur le money management avec exemples concrets ` +
      `et calculs détaillés. C'est essentiel pour devenir rentable sur le long terme !`;

    return {
      message,
      actions: [{
        type: 'search_content',
        label: 'Rechercher formations money management',
        data: { query: 'money management' }
      }],
      confidence: 0.9
    };
  }

  private handleTechnicalAnalysis(): ChatbotResponse {
    const message = `📊 **Analyse Technique**\n\n` +
      `L'analyse technique est un pilier du trading !\n\n` +
      `📚 **Ce que tu apprendras :**\n` +
      `• Support et résistance\n` +
      `• Tendances et canaux\n` +
      `• Indicateurs techniques (RSI, MACD, etc.)\n` +
      `• Patterns de chandeliers\n` +
      `• Analyse multi-timeframe\n` +
      `• Volume et liquidité\n\n` +
      `🎯 **Notre approche :**\n` +
      `On t'apprend à combiner plusieurs outils pour prendre des décisions éclairées. ` +
      `Pas de recette magique, mais une méthode solide et reproductible.\n\n` +
      `📖 **Dans nos formations :**\n` +
      `Des modules complets avec exemples réels et analyses détaillées de Mickaël.`;

    return {
      message,
      actions: [{
        type: 'search_content',
        label: 'Rechercher formations analyse technique',
        data: { query: 'analyse technique' }
      }],
      confidence: 0.9
    };
  }

  private handlePsychology(): ChatbotResponse {
    const message = `🧠 **Psychologie du Trader**\n\n` +
      `La psychologie représente 80% du succès en trading !\n\n` +
      `📚 **Ce que tu apprendras :**\n` +
      `• Gérer ses émotions (peur, greed, FOMO)\n` +
      `• Développer la discipline\n` +
      `• Rester patient et cohérent\n` +
      `• Accepter les pertes\n` +
      `• Éviter le revenge trading\n` +
      `• Maintenir la confiance sans arrogance\n\n` +
      `🎯 **Les pièges à éviter :**\n` +
      `• Trader sur émotion\n` +
      `• Vouloir récupérer ses pertes immédiatement\n` +
      `• Ne pas respecter son plan\n` +
      `• Sur-trader par ennui\n\n` +
      `💡 **Notre approche :**\n` +
      `On t'aide à développer un mindset de trader professionnel. ` +
      `C'est souvent la différence entre un trader qui perd et un trader qui gagne.`;

    return {
      message,
      actions: [{
        type: 'search_content',
        label: 'Rechercher formations psychologie',
        data: { query: 'psychologie trader' }
      }],
      confidence: 0.9
    };
  }

  private handleStrategies(): ChatbotResponse {
    const message = `🎯 **Stratégies de Trading**\n\n` +
      `Il n'y a pas UNE seule stratégie qui marche, mais plusieurs approches valides !\n\n` +
      `📚 **Types de stratégies :**\n` +
      `• **Scalping** : trades très courts (minutes)\n` +
      `• **Day Trading** : trades dans la journée\n` +
      `• **Swing Trading** : positions sur plusieurs jours\n` +
      `• **Position Trading** : positions long terme\n\n` +
      `🎯 **Stratégies de Mickaël :**\n` +
      `Mickaël partage ses stratégies préférées dans les formations et sur le Discord. ` +
      `Chaque stratégie est expliquée avec :\n` +
      `• Les règles d'entrée\n` +
      `• La gestion du risque\n` +
      `• Les critères de sortie\n` +
      `• Des exemples concrets\n\n` +
      `💡 **Important :**\n` +
      `Trouve la stratégie qui correspond à ta personnalité et à ton capital. ` +
      `Il vaut mieux maîtriser une stratégie que d'en tester 10 sans succès.`;

    return {
      message,
      actions: [{
        type: 'search_content',
        label: 'Rechercher stratégies trading',
        data: { query: 'stratégie trading' }
      }],
      confidence: 0.9
    };
  }

  private handlePropFirm(): ChatbotResponse {
    const message = `🏢 **TopStep & Prop Firms**\n\n` +
      `Les prop firms (firmes propriétaires) permettent de trader avec le capital de la firme !\n\n` +
      `📚 **Comment ça marche :**\n` +
      `• Tu passes un challenge (évaluation)\n` +
      `• Si tu réussis, tu obtiens un compte financé\n` +
      `• Tu trades avec leur capital\n` +
      `• Tu partages les profits avec eux\n\n` +
      `✅ **Avantages :**\n` +
      `• Trader avec plus de capital que le tien\n` +
      `• Pas de risque sur ton propre argent\n` +
      `• Possibilité de scaler rapidement\n\n` +
      `⚠️ **Attention :**\n` +
      `• Les règles sont strictes (drawdown, profit target)\n` +
      `• Il faut une bonne discipline\n` +
      `• Ce n'est pas pour les débutants\n\n` +
      `📖 **Dans nos formations :**\n` +
      `On t'apprend comment réussir les challenges prop firm avec des stratégies adaptées ` +
      `et une gestion du risque rigoureuse.`;

    return {
      message,
      actions: [{
        type: 'search_content',
        label: 'Rechercher formations TopStep',
        data: { query: 'topstep prop firm' }
      }],
      confidence: 0.9
    };
  }

  private handleContact(): ChatbotResponse {
    const message = `📞 **Nous Contacter**\n\n` +
      `Plusieurs façons de nous joindre :\n\n` +
      `💬 **Discord VIP**\n` +
      `• @investinfinity sur le serveur\n` +
      `• Réponse généralement sous 24h\n` +
      `• Souvent beaucoup plus rapide !\n\n` +
      `📧 **Email**\n` +
      `• support@investinfinity.com\n` +
      `• Pour les questions importantes\n\n` +
      `🎥 **Lives Discord**\n` +
      `• Poses tes questions en direct\n` +
      `• Lives hebdomadaires avec Mickaël\n\n` +
      `💡 **Astuce :**\n` +
      `Pour les questions rapides, le Discord est le meilleur moyen. ` +
      `Pour les problèmes techniques complexes, l'email est préférable.`;

    return {
      message,
      confidence: 0.95
    };
  }

  private handleThanks(): ChatbotResponse {
    const message = `Avec plaisir ! 😊\n\n` +
      `N'hésite pas si tu as d'autres questions. ` +
      `On est là pour t'aider à devenir un trader autonome et rentable ! 🚀\n\n` +
      `Continue ton apprentissage et reste discipliné. C'est la clé du succès ! 💪`;

    return {
      message,
      confidence: 0.9
    };
  }

  private handleDefault(message: string): ChatbotResponse {
    const msg = message.toLowerCase();

    // Analyser le message pour des mots-clés spécifiques avec patterns améliorés
    const keywordPatterns = [
      {
        pattern: /\b(mickaël|mickael|michael|fondateur|créateur)\b/,
        response: "Mickaël est notre fondateur et trader principal. Il partage quotidiennement ses analyses et positions avec la communauté. Tu peux voir son track record complet sur le Discord ! 📊",
        confidence: 0.85
      },
      {
        pattern: /\b(raisefx|broker|courtier)\b/,
        response: "RaiseFX est notre broker partenaire de confiance ! 🏦 Régulé avec des spreads compétitifs et une exécution rapide. C'est grâce à ce partenariat qu'on peut te proposer l'accès à tout notre contenu premium.",
        confidence: 0.85
      },
      {
        pattern: /\b(discord|serveur|communauté)\b/,
        response: "Notre Discord VIP c'est le cœur d'Invest Infinity ! 💬 Alertes quotidiennes, lives hebdomadaires, entraide entre membres actifs. Une vraie communauté de traders motivés !",
        confidence: 0.85
      },
      {
        pattern: /\b(signal|signaux|alerte|alertes)\b/,
        response: "On ne fait pas de 'signaux' à copier bêtement ! 🎯 Chaque position est accompagnée d'une analyse complète pour que tu comprennes le POURQUOI. L'objectif est de te former, pas de te rendre dépendant.",
        confidence: 0.85
      },
      {
        pattern: /\b(argent|gain|profit|rentable|gagner|perdre)\b/,
        response: "Mickaël partage ses résultats en toute transparence ! 📈 Tu peux voir son track record complet sur le Discord avec les gains ET les pertes. Il vise un Risk/Reward de 3:1 en moyenne.",
        confidence: 0.8
      },
      {
        pattern: /\b(débutant|nouveau|commencer|premiers.*pas)\b/,
        response: "Parfait pour débuter ! 🚀 Nos formations commencent par les bases du trading. Commence par le module 'Bases du trading' et progresse étape par étape. On t'accompagne tout au long de ton parcours !",
        confidence: 0.8
      },
      {
        pattern: /\b(temps|durée|combien.*temps|rapidement)\b/,
        response: "Le temps d'apprentissage varie selon chacun ! ⏱️ Certains maîtrisent les bases en quelques semaines, d'autres prennent plusieurs mois. L'important c'est la régularité : mieux vaut 30min par jour que 5h une fois par semaine. 📚",
        confidence: 0.75
      },
      {
        pattern: /\b(sécurité|sûr|risque|danger|perdre.*argent)\b/,
        response: "Le trading comporte des risques, c'est normal ! ⚠️ C'est pour ça qu'on t'apprend la gestion du risque dès le début. Ne trade JAMAIS avec de l'argent que tu ne peux pas te permettre de perdre. Notre objectif : te former pour minimiser les risques et maximiser tes chances de succès. 💪",
        confidence: 0.8
      }
    ];

    for (const { pattern, response, confidence } of keywordPatterns) {
      if (pattern.test(msg)) {
        return {
          message: response,
          confidence
        };
      }
    }

    // Réponse par défaut avec suggestions améliorées
    const defaultMessage = `Je ne suis pas sûr de bien comprendre ta question. 🤔\n\n` +
      `Je peux t'aider avec :\n` +
      `• 📊 Ton progrès dans les formations\n` +
      `• 🏆 Les challenges et quêtes actifs\n` +
      `• 🔍 Recherche de contenu spécifique\n` +
      `• 💰 Questions sur notre modèle\n` +
      `• 🎯 Informations sur les formations\n` +
      `• 💬 Comment rejoindre Discord\n` +
      `• 🆘 Support technique\n\n` +
      `Essaie de reformuler ta question ou choisis une option ci-dessous !`;

    const suggestions = [
      "Comment ça fonctionne ?",
      "Mon progrès dans les formations",
      "Quels challenges sont disponibles ?",
      "Comment rejoindre Discord ?"
    ];

    return {
      message: defaultMessage,
      suggestions,
      confidence: 0.35 // Confiance très basse pour déclencher OpenAI
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
