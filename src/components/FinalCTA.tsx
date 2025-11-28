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
      {/* Points de lumière néon */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
      </div>

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
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500" />
              
              <div className="relative px-8 py-4 bg-[#1f1f23] rounded-full flex items-center space-x-2 transform hover:scale-105 transition-all duration-500 border border-pink-500/20">
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

