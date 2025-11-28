import React, { useState } from 'react';
import { ChevronDown, Sparkles, HelpCircle, CreditCard, Shield, Users, MessageCircle, Zap } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

interface FAQProps {
  onOpenRegister?: () => void;
}

// Catégories de FAQ avec icônes
// Dernière mise à jour: FAQ mise à jour - questions brokers modifiées et supprimées
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
        question: "Comment est organisée la formation ?",
        answer: "Vous avez une partie sur notre Discord qui englobe :\n\nles lives trading, la zone chill, et la zone premium pour échanger avec nous et les élèves actuels.\n\nEt vous avez une autre partie sur le site, dans votre espace membre dédié, avec toute la formation incluse."
      },
      {
        question: "Donnez-vous des signaux de trading ?",
        answer: "Non, et c'est volontaire ! On ne donne pas de \"signaux\" à copier bêtement. Nos experts partagent leurs positions avec une analyse complète : point d'entrée, stop-loss, take profit, et surtout le POURQUOI derrière chaque trade. L'objectif est de te rendre autonome, pas dépendant."
      },
      {
        question: "Quels sont les résultats de nos experts ?",
        answer: "Nos experts partagent leurs résultats en toute transparence sur le Discord. Tu peux consulter leur track record complet avec les gains ET les pertes. En moyenne, ils visent un Risk/Reward de 3:1 avec 1-2 positions par jour. Les lives permettent de voir leur analyse en temps réel."
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
        answer: "Plusieurs options :\n\n💬 Sur Discord : mentionne @investinfinity\n📧 Par email : via le formulaire de contact\n🎥 En live : pose tes questions directement à nos experts\n\nOn répond généralement sous 24h, souvent beaucoup plus vite !"
      },
      {
        question: "Y a-t-il des lives réguliers ?",
        answer: "Oui ! Nos experts animent des lives hebdomadaires où ils analysent les marchés en temps réel, répondent à vos questions et partagent leurs setups. C'est le moment idéal pour apprendre et interagir directement avec eux."
      }
    ]
  },
  {
    icon: MessageCircle,
    title: "Autres questions",
    questions: [
      {
        question: "Comment Invest Infinity gagne-t-il de l'argent ?",
        answer: "Transparence totale : on est rémunéré par nos brokers partenaires via un système d'affiliation. Quand tu trades, une partie du spread nous revient. C'est gagnant-gagnant : tu accèdes à tout gratuitement, et on peut continuer à développer du contenu de qualité."
      },
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
    <section id="faq" className="relative bg-[#0f0f13] py-32 overflow-hidden">
      {/* Points de lumière néon */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full filter blur-[150px] animate-pulse delay-500" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 backdrop-blur-sm border border-pink-500/10 mb-8">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <span className="text-pink-200 font-medium">Questions Fréquentes</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Tout ce que tu dois
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500 mt-2">
                savoir avant de commencer
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Tu as des questions ? On a les réponses. Si tu ne trouves pas ce que tu cherches, pose ta question au chatbot !
            </p>
          </div>
        </AnimatedSection>

        {/* Category tabs */}
        <AnimatedSection>
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <button
              onClick={() => setActiveCategory(-1)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === -1
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-[#1f1f23] text-gray-400 hover:text-white hover:bg-[#2a2a30]'
              }`}
            >
              Toutes ({allQuestions.length})
            </button>
            {faqCategories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <button
                  key={index}
                  onClick={() => setActiveCategory(index)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === index
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-[#1f1f23] text-gray-400 hover:text-white hover:bg-[#2a2a30]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.title}
                </button>
              );
            })}
          </div>
        </AnimatedSection>

        {/* FAQ Items */}
        <div className="grid gap-4">
          {displayedQuestions.map((faq) => (
            <AnimatedSection key={faq.id}>
              <div className="relative group">
                {/* Neon glow effect */}
                <div className="absolute -inset-0.5 bg-pink-500 opacity-0 group-hover:opacity-20 blur-lg rounded-2xl transition duration-500" />
                
                <div className="relative bg-[#1f1f23] rounded-2xl overflow-hidden border border-pink-500/10 transition-all duration-500">
                  <button
                    className="w-full px-6 sm:px-8 py-5 text-left flex justify-between items-start gap-4 group/button"
                    onClick={() => setOpenIndex(openIndex === faq.id ? null : faq.id)}
                  >
                    <div className="flex-1">
                      <span className="text-base sm:text-lg font-medium text-white group-hover:text-pink-400 transition-colors block">
                        {faq.question}
                      </span>
                      {activeCategory === -1 && (
                        <span className="text-xs text-pink-400/60 mt-1 block">{faq.category}</span>
                      )}
                    </div>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      bg-pink-500/10 group-hover:bg-pink-500/20
                      transition-all duration-300
                      ${openIndex === faq.id ? 'rotate-180 bg-pink-500/30' : ''}
                    `}>
                      <ChevronDown className="w-5 h-5 text-pink-400" />
                    </div>
                  </button>
                  
                  <div
                    className={`
                      overflow-hidden transition-all duration-500 ease-in-out
                      ${openIndex === faq.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="px-6 sm:px-8 pb-6 text-gray-300 leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Contact CTA */}
        <AnimatedSection>
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">
              Tu n'as pas trouvé ta réponse ?
            </p>
            <button
              onClick={() => {
                // Déclencher un événement personnalisé pour ouvrir le chatbot
                window.dispatchEvent(new CustomEvent('openChatbot'));
              }}
              className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-medium transition-colors cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              Pose ta question au chatbot
            </button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
