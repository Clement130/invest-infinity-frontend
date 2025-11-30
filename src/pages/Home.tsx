import React, { useState } from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import JoinSteps from '../components/JoinSteps';
import FAQ from '../components/FAQ';
import AuthModal from '../components/AuthModal';
import ScammerWarning from '../components/ScammerWarning';
import TestimonialCarousel from '../components/TestimonialCarousel';

export default function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <>
      <ScammerWarning />
      {/* 1. Hero avec mini badge Trustpilot */}
      <Hero onOpenRegister={() => setIsRegisterOpen(true)} />
      
      {/* 2. Services / Bénéfices */}
      <div className="relative">
        <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-b from-[rgb(15,15,19,0)] to-[rgb(15,15,19,1)] z-10" />
        <Services onOpenRegister={() => setIsRegisterOpen(true)} />
      </div>
      
      {/* 3. Comment ça marche */}
      <JoinSteps onOpenRegister={() => setIsRegisterOpen(true)} />
      
      {/* 4. FAQ */}
      <FAQ onOpenRegister={() => setIsRegisterOpen(true)} />
      
      {/* 5. Trustpilot - Dernier argument avant conversion */}
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