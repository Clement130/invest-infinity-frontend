import React, { useState } from 'react';
import { ChevronDown, Sparkles, HelpCircle, CreditCard, Shield, Users, MessageCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import clsx from 'clsx';

interface FAQProps {
  onOpenRegister?: () => void;
}

// Catégories de FAQ avec icônes
// Dernière mise à jour: FAQ complète - chatbot, horaires lives, organisation formation
// Build: 2025-11-28 - Toutes modifications FAQ déployées
const faqCategories = [
  {
    icon: HelpCircle,
    title: "Général",
    questions: [
      {
        question: "Qu'est-ce qu'Invest Infinity ?",
        answer: "Invest Infinity est une communauté premium dédiée aux traders qui veulent progresser sérieusement. Tu accèdes à des analyses quotidiennes de nos experts, des formations complètes, des lives hebdomadaires et une communauté Discord active de +100 membres motivés. Notre mission : t'accompagner pour devenir un trader autonome et rentable."
      },
      {
        question: "À qui s'adresse Invest Infinity ?",
        answer: "Que tu sois débutant complet ou trader intermédiaire, Invest Infinity est fait pour toi. Nos formations partent des bases jusqu'aux stratégies avancées. Le seul prérequis : avoir 18 ans minimum et la motivation de progresser."
      }
    ]
  },
  {
    icon: Zap,
    title: "Accès & Inscription",
    questions: [
      {
        question: "Comment rejoindre Invest Infinity ?",
        answer: "C'est simple et rapide :\n\n1️⃣ Sélectionne ton offre dans tarif\n2️⃣ Active ton espace membre\n3️⃣ Accède à la formation\n\nTout le processus prend moins de 5 minutes !"
      }
    ]
  },
  {
    icon: CreditCard,
    title: "Trading & Alertes",
    questions: [
      {
        question: "Quand est-ce qu'il y a les live trading ?",
        answer: "Lundi et mardi de 16h à 17h30,\n\net du mercredi au vendredi de 15h à 17h30."
      },
      {
        question: "Comment se passe l'accompagnement ?",
        answer: "Tu auras accès à un groupe exclusif qui te permettra de poser toutes les questions que tu veux, de partager tes futures analyses et zones tracées à n'importe quelle heure, pour qu'on puisse te corriger ou valider ce que tu fais, et échanger avec nous dessus et en live aussi."
      },
      {
        question: "Que vais-je apprendre dans la formation ?",
        answer: "Tout est conçu pour tous les niveaux, du débutant au plus avancé.\n\nTout est mis en place pour que tu puisses comprendre : du vocabulaire jusqu'à la manière de prendre une position sur les marchés, avec une vraie stratégie qui rentable."
      }
    ]
  },
  {
    icon: Shield,
    title: "Sécurité & Brokers",
    questions: [
      {
        question: "Puis-je rejoindre la formation avec n'importe quel broker ?",
        answer: "Oui, pas de souci.\n\nPour ça, vous pouvez rejoindre la communauté avec votre broker actuel.\n\nEt si vous n'en avez pas, nous avons des partenaires de confiance chez lesquels vous pouvez faire un dépôt."
      },
      {
        question: "Mes données sont-elles sécurisées ?",
        answer: "Absolument ! Tes données personnelles sont protégées et jamais partagées avec des tiers. On utilise un chiffrement SSL et on respecte le RGPD. Tu peux supprimer ton compte à tout moment."
      }
    ]
  },
  {
    icon: Users,
    title: "Communauté & Support",
    questions: [
      {
        question: "Comment contacter le support ?",
        answer: "Plusieurs options :\n\n💬 Sur Discord : mentionne @investinfinity\n🤖 Via le chatbot : disponible sur le site\n🎥 En live : pose tes questions directement à nos experts\n\nOn répond généralement sous 24h, souvent beaucoup plus vite !"
      }
    ]
  },
  {
    icon: MessageCircle,
    title: "Autres questions",
    questions: [
      {
        question: "Je suis débutant total, est-ce pour moi ?",
        answer: "Carrément ! Nos formations commencent vraiment de zéro : qu'est-ce qu'un pip, comment lire un graphique, les bases du money management... Tu seras guidé pas à pas. Et la communauté est là pour t'aider si tu bloques."
      }
    ]
  }
];

export default function FAQ({ onOpenRegister }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number>(0);

  // Flatten all questions with unique IDs
  const allQuestions = faqCategories.flatMap((cat, catIndex) => 
    cat.questions.map((q, qIndex) => ({
      ...q,
      id: `${catIndex}-${qIndex}`,
      category: cat.title,
      icon: cat.icon
    }))
  );

  // Get questions for active category or all
  const displayedQuestions = activeCategory === -1 
    ? allQuestions 
    : faqCategories[activeCategory]?.questions.map((q, qIndex) => ({
        ...q,
        id: `${activeCategory}-${qIndex}`,
        category: faqCategories[activeCategory].title,
        icon: faqCategories[activeCategory].icon
      })) || [];

  return (
    <section id="faq" className="relative bg-[#0f0f13] py-16 sm:py-24 lg:py-32 overflow-hidden">

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {/* Badge "Questions Fréquentes" - style pill violet foncé */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 mb-8">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span className="text-pink-200 font-medium text-sm sm:text-base">Questions Fréquentes</span>
          </div>

          {/* Titre avec gradient rose/violet amélioré */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            <span className="block">Tout ce que tu dois</span>
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-500 to-purple-500">
              savoir avant de commencer
            </span>
          </h2>

          {/* Sous-texte */}
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Tu as des questions ? On a les réponses. Si tu ne trouves pas ce que tu cherches, pose ta question au chatbot !
          </p>
        </motion.div>

        {/* Category tabs - avec scroll horizontal sur mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:justify-center sm:flex-wrap">
            {/* Bouton "Toutes" */}
            <button
              onClick={() => setActiveCategory(-1)}
              className={clsx(
                'flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap',
                activeCategory === -1
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-[#1f1f23] text-gray-400 hover:text-white hover:bg-[#2a2a30]'
              )}
            >
              Toutes ({allQuestions.length})
            </button>

            {/* Boutons de catégories */}
            {faqCategories.map((cat, index) => {
              const Icon = cat.icon;
              const isActive = activeCategory === index;
              
              return (
                <button
                  key={index}
                  onClick={() => setActiveCategory(index)}
                  className={clsx(
                    'flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap',
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-[#1f1f23] text-gray-400 hover:text-white hover:bg-[#2a2a30]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {cat.title}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* FAQ Items - Accordéons améliorés */}
        <div className="grid gap-4 mb-12">
          <AnimatePresence mode="wait">
            {displayedQuestions.map((faq, index) => {
              const isOpen = openIndex === faq.id;
              
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative group"
                >
                  
                  {/* Conteneur de l'accordéon */}
                  <div className="relative bg-[#1f1f23] rounded-2xl overflow-hidden border border-pink-500/10 transition-all duration-500 hover:border-pink-500/20">
                    <button
                      className="w-full px-6 sm:px-8 py-5 text-left flex justify-between items-start gap-4 group/button"
                      onClick={() => setOpenIndex(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="flex-1">
                        <span className={clsx(
                          "text-base sm:text-lg font-medium block transition-colors",
                          isOpen ? "text-pink-400" : "text-white group-hover/button:text-pink-400"
                        )}>
                          {faq.question}
                        </span>
                        {activeCategory === -1 && (
                          <span className="text-xs text-pink-400/60 mt-1 block">{faq.category}</span>
                        )}
                      </div>
                      
                      {/* Chevron icon */}
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                        isOpen 
                          ? "bg-pink-500/30 rotate-180" 
                          : "bg-pink-500/10 group-hover/button:bg-pink-500/20"
                      )}>
                        <ChevronDown className="w-5 h-5 text-pink-400 transition-transform duration-300" />
                      </div>
                    </button>
                    
                    {/* Contenu de la réponse avec animation */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 sm:px-8 pb-6 text-gray-300 leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Call to Action Chatbot - Bouton avec gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-4 text-base sm:text-lg">
            Tu n'as pas trouvé ta réponse ?
          </p>
          <button
            onClick={() => {
              // Déclencher un événement personnalisé pour ouvrir le chatbot
              window.dispatchEvent(new CustomEvent('openChatbot'));
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/25 hover:scale-105 active:scale-95"
            aria-label="Ouvrir le chatbot pour poser une question"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Pose ta question au chatbot</span>
          </button>
        </motion.div>
      </div>

      {/* Styles pour masquer la scrollbar sur mobile */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
