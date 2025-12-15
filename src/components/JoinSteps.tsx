import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Wallet, MessageSquare, ArrowRight } from 'lucide-react';

interface JoinStepsProps {
  onOpenRegister: () => void;
}

export default function JoinSteps({ onOpenRegister }: JoinStepsProps) {
  const navigate = useNavigate();
  
  const steps = [
    {
      icon: UserPlus,
      title: "INSCRIS TOI",
      description: "Sélectionne l'offre qui te correspond pour rejoindre notre communauté et progresser avec nous",
      gradient: "from-pink-400 to-pink-500"
    },
    {
      icon: Wallet,
      title: "CONFIGURE TON COMPTE",
      description: "Active ton espace membre en quelques secondes et débloque immédiatement ton accès",
      gradient: "from-pink-500 to-pink-500"
    },
    {
      icon: MessageSquare,
      title: "ACCÈDE À LA FORMATION",
      description: "Accède à notre formation et progresse avec nos analyses, stratégies et lives.",
      gradient: "from-pink-500 to-pink-600"
    }
  ];

  return (
    <section id="cta-section" className="py-24 bg-white relative overflow-visible">
      {/* Animated background gradients */}
      <div className="relative w-full overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-50 via-white to-white" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[1]">
        <div className="text-center mb-20">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500 text-lg font-semibold mb-4 block">
            COMMENT ÇA MARCHE
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
  3 étapes{' '}
  <span className="relative inline-block">
    <span className="relative z-10">simples</span>
    {/* Effet de surlignage */}
    <span className="absolute inset-x-0 bottom-0 h-2 bg-pink-400/50 rounded-sm"></span>
  </span>
  {' '}pour commencer
</h2>

          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Rejoins notre communauté et commence à trader dès aujourd'hui
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-20">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex-1 group relative text-left"
            >
              {/* Connecting lines */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-pink-200 to-transparent transform -translate-y-1/2" />
              )}
              
              {/* Card */}
              <div className="relative h-full">
                
                {/* Main content */}
                <div className="relative h-full bg-white p-8 rounded-2xl border border-pink-100 group-hover:border-pink-200 transition-all duration-500 shadow-lg">
                  {/* Step number */}
                  <div className="absolute -top-5 left-8 bg-white px-4 py-2 rounded-full shadow-md">
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${step.gradient} font-bold text-lg`}>
                      ÉTAPE {index + 1}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="relative w-16 h-16 mb-8 mt-4">
                    <div className="relative h-full rounded-2xl bg-white p-4 flex items-center justify-center transform group-hover:scale-110 transition-all duration-500 shadow-lg">
                      <step.icon className="w-8 h-8 text-pink-500" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <button 
            onClick={() => navigate('/pricing')}
            className="group relative"
          >
            
            {/* Button content */}
            <div className="relative px-8 py-4 bg-white rounded-full flex items-center space-x-2 transform hover:scale-105 transition-all duration-500 shadow-lg">
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500">
                COMMENCER MAINTENANT
              </span>
              <ArrowRight className="w-5 h-5 text-pink-500 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}