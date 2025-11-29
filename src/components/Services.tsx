import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Brain, Users, ArrowRight } from 'lucide-react';

interface ServicesProps {
  onOpenRegister?: () => void;
}

const services = [
  {
    icon: Bell,
    title: 'Alertes Trading',
    description:
      'Reçois des alertes de trading chaque jours grâce aux analyses de nos experts pour saisir les meilleures opportunités du marché.',
    image: 'https://i.postimg.cc/DwdC8NcW/image.png',
    stats: [
      { value: '3', label: 'Risk/Reward moyen' },
      { value: '1', label: 'Positions par jours' },
    ],
    features: [
      'Alertes précises et facile à prendre',
      'Notifications en temps réel',
      'Risk management sérieux',
      'Track record (suivis des performances)',
    ],
    color: '#ec4899',
  },
  {
    icon: Brain,
    title: "Live Trading",
    description:
      "Chaque semaine, on trade en direct devant toi. Tu vois exactement comment on analyse le marché, quand on entre, et pourquoi. L'objectif : que tu deviennes autonome rapidement.",
    image: 'https://i.postimg.cc/8zJ71ydw/image.png',
    stats: [],
    features: [
      'Analyse et identification de la tendance en direct',
      'Identification des zones clés',
      'Plan complet : point d\'entrée, stop-loss et take profit expliqué',
      'Questions/réponses en live pour clarifier chaque décision',
    ],
    color: '#fb7185',
  },
  {
    icon: BookOpen,
    title: 'Formation et Accompagnement',
    description: 'Accédez à une formation claire et structurée pour comprendre et appliquer une stratégie qui fonctionne réellement, tout en étant accompagné étape par étape pour progresser efficacement.',
    image: 'https://i.postimg.cc/zXNhcQqG/image.png',
    stats: [],
    features: [
      'Modules expliqués simplement, accessibles à tous',
      'Accompagnement complet pour répondre à toutes vos questions',
      'Un Salon exclusif qui vous est dédié pour partager vos plans, poser vos questions et obtenir toutes les validations dont vous avez besoin',
    ],
    color: '#f472b6',
  },
  {
    icon: Users,
    title: 'Communauté ❤️',
    description: "Une communauté unie où l'on progresse et encaisse ensemble.",
    image: 'https://i.postimg.cc/jdQRMgjK/Screenshot-2025-02-16-155649.png',
    stats: [
      { value: '100+', label: 'membres' },
      { value: '7/7', label: 'support' },
    ],
    features: ['Mentorat', 'Sessions live hebdomadaires'],
    color: '#fda4af',
  },
];

export default function Services({ onOpenRegister }: ServicesProps) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null); // conservé au cas où
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const calculateProgress = () => {
    if (!sectionRef.current) return;

    const section = sectionRef.current;
    const sectionRect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const sectionTop = sectionRect.top;
    const sectionHeight = sectionRect.height;

    let progress;
    if (sectionTop >= viewportHeight) {
      progress = 0;
    } else if (sectionTop <= -sectionHeight + viewportHeight) {
      progress = 1;
    } else {
      progress = Math.abs(sectionTop - viewportHeight) / (sectionHeight - viewportHeight);
    }

    setScrollProgress(Math.max(0, Math.min(1, progress)));

    cardsRef.current.forEach((card, index) => {
      if (card) {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.top + cardRect.height / 2;
        if (cardCenter > 0 && cardCenter < viewportHeight) {
          setActiveSection(index);
        }
      }
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = cardsRef.current.findIndex((ref) => ref === entry.target);
          if (index !== -1 && entry.isIntersecting) {
            setVisibleCards((prev) => [...new Set([...prev, index])].sort());
          }
        });
      },
      {
        rootMargin: '0px 0px 200px 0px',
        threshold: 0.1,
      }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => requestAnimationFrame(calculateProgress);
    window.addEventListener('scroll', handleScroll, { passive: true });
    calculateProgress();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;
    const offset = window.innerHeight * 0.3;
    const cardPosition = card.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: cardPosition - offset,
      behavior: 'smooth',
    });
  };

  return (
    <section ref={sectionRef} id="services" className="py-24 bg-[#0f0f13] relative overflow-visible">
      {/* Points de lumière néon */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/30 rounded-full filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/30 rounded-full filter blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/20 rounded-full filter blur-[150px] animate-pulse delay-500" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Une communautée créée
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500 mt-2">
              pour ta réussite
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">Découvre ce qui t'attend dans la formation !</p>
        </div>

        <div className="relative flex flex-col lg:flex-row gap-8">
          {/* Service Cards */}
          <div className="flex-1 space-y-16">
            {services.map((service, index) => (
              <div
                key={index}
                ref={(el) => (cardsRef.current[index] = el)}
                className={`transform transition-all duration-1000 ${
                  visibleCards.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
              >
                <div className="relative">
                  {/* Neon glow effect */}
                  <div className="absolute -inset-0.5 bg-pink-500 opacity-20 blur-lg rounded-3xl group-hover:opacity-30 transition duration-500" />

                  <div className="relative bg-[#1f1f23] rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(236,72,153,0.15)]">
                    <div className="grid md:grid-cols-2 gap-0">
                      {/* Image Section */}
                      <div className="relative h-96 md:h-full">
                        {/* Fallback gradient background */}
                        <div 
                          className="absolute inset-0 w-full h-full"
                          style={{
                            background: `linear-gradient(135deg, ${service.color}20, ${service.color}40)`,
                          }}
                        />
                        <img
                          src={service.image}
                          alt={service.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            // Masquer l'image si elle ne charge pas, le gradient de fond sera visible
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1f23] to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <div className="flex items-center gap-3 text-white">
                            <service.icon
                              className="w-8 h-8"
                              style={{ filter: 'drop-shadow(0 0 8px rgba(236,72,153,0.5))' }}
                            />
                            <h3
                              className="text-2xl font-bold"
                              style={{ textShadow: '0 0 10px rgba(236,72,153,0.5)' }}
                            >
                              {service.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-8">
                        <p className="text-gray-400 mb-8">{service.description}</p>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                          {service.stats.map((stat, statIndex) => (
                            <div key={statIndex} className="text-center">
                              <div
                                className="text-2xl font-bold mb-1"
                                style={{
                                  color: service.color,
                                  textShadow: `0 0 10px ${service.color}80`,
                                }}
                              >
                                {stat.value}
                              </div>
                              <div className="text-sm text-gray-500">{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          {service.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-start text-gray-300">
                              <div
                                className="w-1.5 h-1.5 rounded-full mr-3 shrink-0"
                                style={{
                                  backgroundColor: service.color,
                                  boxShadow: `0 0 8px ${service.color}80`,
                                  marginTop: '0.4rem',
                                }}
                              />
                              <span className="flex-1 leading-relaxed">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Sidebar - Now on the right */}
          <div className="hidden lg:block sticky top-32 h-[calc(100vh-8rem)] w-64 shrink-0">
            <div className="relative h-full flex flex-col justify-between py-8">
              <div
                className="absolute left-1/2 top-16 bottom-16 w-0.5 bg-pink-950 transform -translate-x-1/2"
                style={{ zIndex: 0 }}
              >
                {(() => {
                  const total = services.length;
                  const pct = ((activeSection + 1) / total) * 100;
                  return (
                    <div
                      className="absolute top-0 w-0.5 bg-gradient-to-b from-pink-400 to-pink-500 transition-all duration-300 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                      style={{ height: `${pct}%`, zIndex: 1 }}
                    />
                  );
                })()}
              </div>

              {services.map((service, index) => (
  <div key={index} className="relative my-4 px-2 py-2 rounded">
    {/* Cache uniquement la ligne verticale */}
    <div className="absolute top-1/2 left-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 bg-[#0f0f13] rounded-full z-20 pointer-events-none" />

    <button
      onClick={() => scrollToSection(index)}
      className={`relative flex items-center transition-all duration-500 group ${
        index <= activeSection ? 'opacity-100' : 'opacity-50'
      }`}
      style={{ zIndex: 20 }}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
          index <= activeSection ? 'shadow-[0_0_15px_rgba(236,72,153,0.5)]' : ''
        }`}
        style={{
          backgroundColor: index <= activeSection ? service.color : '#1f1f23',
          transform: index <= activeSection ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <service.icon
          className={`w-5 h-5 transition-colors duration-500 ${
            index <= activeSection ? 'text-white' : 'text-gray-600'
          }`}
        />
      </div>
      <div
        className={`ml-4 transition-all duration-500 ${
          index <= activeSection ? 'text-white' : 'text-gray-600'
        }`}
      >
        <p className="font-medium">{service.title}</p>
      </div>
    </button>
  </div>
))}

            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-20 text-center">
          <button onClick={() => navigate('/pricing')} className="group relative inline-flex items-center">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500" />

            <div className="relative px-8 py-4 bg-[#1f1f23] rounded-full flex items-center space-x-2 transform hover:scale-105 transition-all duration-500 border border-pink-500/20">
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500">
                Je m'inscris pour rejoindre le groupe
              </span>
              <ArrowRight className="w-5 h-5 text-pink-500 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
