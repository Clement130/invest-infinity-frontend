import React, { useState } from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import JoinSteps from '../components/JoinSteps';
import FAQ from '../components/FAQ';
import AuthModal from '../components/AuthModal';
import ScammerWarning from '../components/ScammerWarning';
import TestimonialCarousel from '../components/TestimonialCarousel';
import NewsletterForm from '../components/NewsletterForm';
import { ScrollReveal } from '../components/ui/premium/ScrollReveal';

export default function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <>
      <ScammerWarning />
      {/* 1. Hero avec mini badge Trustpilot */}
      <Hero onOpenRegister={() => setIsRegisterOpen(true)} />
      
      {/* 2. Newsletter Lead Magnet - PDF gratuit */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal animation="fade-up">
            <NewsletterForm />
          </ScrollReveal>
        </div>
      </section>
      
      {/* 3. Services / Bénéfices */}
      <div className="relative">
        <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-b from-[rgb(15,15,19,0)] to-[rgb(15,15,19,1)] z-10" />
        <ScrollReveal animation="fade-up" duration={0.8}>
          <Services onOpenRegister={() => setIsRegisterOpen(true)} />
        </ScrollReveal>
      </div>
      
      {/* 4. Comment ça marche */}
      <ScrollReveal animation="fade-up" delay={0.2}>
        <JoinSteps onOpenRegister={() => setIsRegisterOpen(true)} />
      </ScrollReveal>
      
      {/* 5. FAQ */}
      <ScrollReveal animation="fade-up">
        <FAQ onOpenRegister={() => setIsRegisterOpen(true)} />
      </ScrollReveal>
      
      {/* 6. Trustpilot - Dernier argument avant conversion */}
      <ScrollReveal animation="scale-up">
        <TestimonialCarousel />
      </ScrollReveal>
      
      {/* Le CTA Final et Disclaimer sont maintenant dans le Footer */}
      
      <AuthModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        type="register"
      />
    </>
  );
}
