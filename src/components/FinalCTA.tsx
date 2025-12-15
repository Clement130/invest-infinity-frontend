import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

interface FinalCTAProps {
  onOpenRegister?: () => void;
}

export default function FinalCTA({ onOpenRegister }: FinalCTAProps) {
  const navigate = useNavigate();
  
  return (
    <section className="relative bg-[#0f0f13] py-20 overflow-hidden">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection>
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-8">
              Prêt à commencer votre voyage vers la réussite ?
            </h3>
            <button 
              onClick={() => navigate('/pricing')}
              className="group relative inline-flex items-center"
            >
              <div className="relative px-8 py-4 bg-[#1f1f23] rounded-full flex items-center space-x-2 transform md:hover:scale-105 transition-all duration-700 md:duration-500 border border-pink-500/20">
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500">
                  Commencer Maintenant
                </span>
                <ArrowRight className="w-5 h-5 text-pink-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

