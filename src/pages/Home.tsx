import React, { useState } from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import JoinSteps from '../components/JoinSteps';
import FAQ from '../components/FAQ';
import AuthModal from '../components/AuthModal';

export default function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <>
      <Hero onOpenRegister={() => setIsRegisterOpen(true)} />
      <div className="relative">
        {/* Transition gradient entre Hero et Services */}
        <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-b from-[rgb(15,15,19,0)] to-[rgb(15,15,19,1)] z-10" />
        <Services onOpenRegister={() => setIsRegisterOpen(true)} />
      </div>
      <JoinSteps onOpenRegister={() => setIsRegisterOpen(true)} />
      <FAQ onOpenRegister={() => setIsRegisterOpen(true)} />
      <AuthModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        type="register"
      />
    </>
  );
}