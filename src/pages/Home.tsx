import React, { useState } from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import JoinSteps from '../components/JoinSteps';
import FAQ from '../components/FAQ';
import AuthModal from '../components/AuthModal';
import ScammerWarning from '../components/ScammerWarning';
import TestimonialCarousel from '../components/TestimonialCarousel';
import SEO from '../components/SEO';
import { generateOrganizationStructuredData, generateFAQStructuredData } from '../utils/structuredData';

// Questions FAQ pour structured data
const faqQuestions = [
  {
    question: "Qu'est-ce qu'Invest Infinity ?",
    answer: "Invest Infinity est une communauté premium dédiée aux traders qui veulent progresser sérieusement. Tu accèdes à des analyses quotidiennes de nos experts, des formations complètes, des lives hebdomadaires et une communauté Discord active de +100 membres motivés. Notre mission : t'accompagner pour devenir un trader autonome et rentable."
  },
  {
    question: "À qui s'adresse Invest Infinity ?",
    answer: "Que tu sois débutant complet ou trader intermédiaire, Invest Infinity est fait pour toi. Nos formations partent des bases jusqu'aux stratégies avancées. Le seul prérequis : avoir 18 ans minimum et la motivation de progresser."
  },
  {
    question: "Comment rejoindre Invest Infinity ?",
    answer: "C'est simple et rapide : 1️⃣ Sélectionne ton offre dans tarif 2️⃣ Active ton espace membre 3️⃣ Accède à la formation. Tout le processus prend moins de 5 minutes !"
  },
  {
    question: "Quand est-ce qu'il y a les live trading ?",
    answer: "Lundi et mardi de 16h à 17h30, et du mercredi au vendredi de 15h à 17h30."
  },
  {
    question: "Comment se passe l'accompagnement ?",
    answer: "Tu auras accès à un groupe exclusif qui te permettra de poser toutes les questions que tu veux, de partager tes futures analyses et zones tracées à n'importe quelle heure, pour qu'on puisse te corriger ou valider ce que tu fais, et échanger avec nous dessus et en live aussi."
  },
  {
    question: "Que vais-je apprendre dans la formation ?",
    answer: "Tout est conçu pour tous les niveaux, du débutant au plus avancé. Tout est mis en place pour que tu puisses comprendre : du vocabulaire jusqu'à la manière de prendre une position sur les marchés, avec une vraie stratégie qui rentable."
  },
  {
    question: "Puis-je rejoindre la formation avec n'importe quel broker ?",
    answer: "Oui, pas de souci. Pour ça, vous pouvez rejoindre la communauté avec votre broker actuel. Et si vous n'en avez pas, nous avons des partenaires de confiance chez lesquels vous pouvez faire un dépôt."
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument ! Tes données personnelles sont protégées et jamais partagées avec des tiers. On utilise un chiffrement SSL et on respecte le RGPD. Tu peux supprimer ton compte à tout moment."
  },
  {
    question: "Comment contacter le support ?",
    answer: "Plusieurs options : 💬 Sur Discord : mentionne @investinfinity 🤖 Via le chatbot : disponible sur le site 🎥 En live : pose tes questions directement à nos experts. On répond généralement sous 24h, souvent beaucoup plus vite !"
  },
  {
    question: "Je suis débutant total, est-ce pour moi ?",
    answer: "Carrément ! Nos formations commencent vraiment de zéro : qu'est-ce qu'un pip, comment lire un graphique, les bases du money management... Tu seras guidé pas à pas. Et la communauté est là pour t'aider si tu bloques."
  }
];

export default function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Structured data combiné
  const structuredData = [
    generateOrganizationStructuredData(),
    generateFAQStructuredData(faqQuestions)
  ];

  return (
    <>
      <SEO
        title="Invest Infinity - Formation Trading & Éducation Financière"
        description="Apprenez le trading avec Invest Infinity. Formations complètes, communauté active, sessions de trading en direct et accompagnement personnalisé. Rejoignez des milliers de traders qui réussissent."
        keywords="trading, formation trading, éducation financière, trading en ligne, apprendre le trading, communauté traders, analyse technique, analyse fondamentale, forex, crypto, actions"
        url="https://investinfinity.fr"
        type="website"
        structuredData={structuredData}
      />
      <ScammerWarning />
      {/* 1. Hero avec mini badge Trustpilot */}
      <Hero onOpenRegister={() => setIsRegisterOpen(true)} />
      
      {/* 2. Services / Bénéfices */}
      <div className="relative">
        <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-b from-[rgb(15,15,19,0)] to-[rgb(15,15,19,1)] z-10" />
        <Services onOpenRegister={() => setIsRegisterOpen(true)} />
      </div>
      
      {/* 4. Comment ça marche */}
      <JoinSteps onOpenRegister={() => setIsRegisterOpen(true)} />
      
      {/* 5. FAQ */}
      <FAQ onOpenRegister={() => setIsRegisterOpen(true)} />
      
      {/* 6. Trustpilot - Dernier argument avant conversion */}
      <TestimonialCarousel />
      
      {/* Le CTA Final et Disclaimer sont maintenant dans le Footer */}
      
      <AuthModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        type="register"
      />
    </>
  );
}
