import React, { useState } from 'react';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

interface FAQProps {
  onOpenRegister?: () => void;
}

export default function FAQ({ onOpenRegister }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Qu’est-ce qu’Invest Infinity ?",
      answer: "Invest Infinity est une communauté dédiée au trading, où des traders souhaitent devenir sérieux, indépendants et professionnels. Nous partageons des analyses, des stratégies et des opportunités exclusives pour aider nos membres à évoluer dans leur parcours de trader."
    },
    {
      question: "Comment rejoindre Invest Infinity ?",
      answer: "Pour accéder à notre communauté, il suffit de :\n- Être âgé de 18 ans ou plus.\n- Posséder un compte de trading actif ouvert via l’un de nos partenaires."
    },
    {
      question: "Est-ce que l’accès au serveur est gratuit ?",
      answer: "Oui, l’accès à notre serveur est 100% gratuit, mais certaines sections et avantages exclusifs sont réservés aux membres ayant un compte actif chez nos partenaires."
    },
    {
      question: "Que vais-je trouver sur le Discord ?",
      answer: "En rejoignant notre serveur, tu auras accès à :\n- Analyses et stratégies de trading.\n- Lives et discussions avec des traders expérimentés.\n- Alertes et opportunités de marché.\n- Échange avec une communauté active et bienveillante."
    },
    {
      question: "Donnez-vous des signaux de trading ?",
      answer: "Non, nous ne fournissons aucun signal de trading. Nous ne sommes pas conseillers financiers. En revanche, Mickaël, notre trader, partage ses positions. Notre objectif est de rester axé sur l’éducation et d’aider nos membres à développer leur propre analyse."
    },
    {
      question: "Puis-je trader avec n’importe quel broker ?",
      answer: "Non, pour profiter de nos ressources et accès exclusifs, il est nécessaire d’avoir un compte actif chez l’un de nos partenaires."
    },
    {
      question: "Comment contacter un modérateur en cas de problème ?",
      answer: "Si tu rencontres un souci, tu peux taguer @investinfinity et nous te répondrons dans les plus brefs délais."
    },
    {
      question: "J’ai une question qui ne figure pas dans la FAQ, que faire ?",
      answer: "N’hésite pas à poser ta question sur le serveur dans la section #discussion ou à contacter un @investinfinity."
    },
    {
      question: "Les brokers partenaires sont-ils sûrs et régulés ?",
      answer: "Nous sélectionnons uniquement des brokers fiables et reconnus, mais nous te conseillons toujours de faire tes propres recherches avant d’ouvrir un compte."
    },
    {
      question: "Comment Invest Infinity se finance-t-il ?",
      answer: "Notre communauté est financée via des partenariats avec des brokers. Cela nous permet de proposer un accès gratuit tout en garantissant des avantages exclusifs à nos membres."
    },
    {
      question: "Je suis déjà inscrit chez RaiseFX via un autre affilié, comment puis-je rejoindre Invest Infinity ?",
      answer: "Si tu es déjà chez RaiseFX mais affilié à quelqu’un d’autre, tu peux demander à être rattaché à Invest Infinity en suivant une procédure simple.\nIl te suffit d’envoyer un e-mail à RaiseFX en demandant le transfert de ton compte vers notre affiliation.\nL’e-mail à envoyer est déjà disponible sur le Discord dans la section dédiée.\nUne fois ta demande envoyée, RaiseFX s’occupera du reste."
    }
  ];
  

  return (
    <section id="faq" className="relative bg-[#0f0f13] py-32 overflow-hidden">
      {/* Points de lumière néon */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full filter blur-[150px] animate-pulse delay-500" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 backdrop-blur-sm border border-pink-500/10 mb-8">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <span className="text-pink-200 font-medium">Questions Fréquentes</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Tout ce que vous devez
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500 mt-2">
                savoir pour commencer
              </span>
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid gap-6 mb-16">
          {faqs.map((faq, index) => (
            <AnimatedSection key={index}>
              <div className="relative group">
                {/* Neon glow effect */}
                <div className="absolute -inset-0.5 bg-pink-500 opacity-0 group-hover:opacity-20 blur-lg rounded-2xl transition duration-500" />
                
                <div className="relative bg-[#1f1f23] rounded-2xl overflow-hidden border border-pink-500/10 transition-all duration-500">
                  <button
                    className="w-full px-8 py-6 text-left flex justify-between items-center group/button"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <span className="text-lg font-medium text-white group-hover:text-pink-400 transition-colors">
                      {faq.question}
                    </span>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      bg-pink-500/10 group-hover:bg-pink-500/20
                      transition-all duration-300
                      ${openIndex === index ? 'rotate-180' : ''}
                    `}>
                      <ChevronDown className="w-5 h-5 text-pink-400" />
                    </div>
                  </button>
                  
                  <div
                    className={`
                      overflow-hidden transition-all duration-500
                      ${openIndex === index ? 'max-h-96' : 'max-h-0'}
                    `}
                  >
                    <div className="px-8 pb-6 text-gray-400">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Final CTA */}
        <AnimatedSection>
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-8">
              Prêt à commencer votre voyage vers la réussite ?
            </h3>
            <button 
              onClick={onOpenRegister}
              className="group relative inline-flex items-center"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500" />
              
              <div className="relative px-8 py-4 bg-[#1f1f23] rounded-full flex items-center space-x-2 transform hover:scale-105 transition-all duration-500 border border-pink-500/20">
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500">
                  Commencer Maintenant
                </span>
                <ArrowRight className="w-5 h-5 text-pink-500 transform group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}