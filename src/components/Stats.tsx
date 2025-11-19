import React, { useEffect, useRef } from 'react';
import { Users, Bell, BookOpen } from 'lucide-react';

export default function Stats() {
  const statsRef = useRef<HTMLDivElement>(null);

  // Animation d'entrée au scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!statsRef.current) return;

      const statsRect = statsRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const distanceFromViewport = statsRect.top - viewportHeight;
      const entryProgress = Math.max(0, Math.min(1, 1 - distanceFromViewport / viewportHeight));
      
      const cards = statsRef.current.querySelectorAll('.stat-card');
      cards.forEach((card) => {
        const startY = '50';
        const startScale = 0.8;
        
        const currentY = startY * (1 - entryProgress);
        const currentScale = startScale + ((1 - startScale) * entryProgress);
        const currentOpacity = entryProgress;
        
        (card as HTMLElement).style.transform = `
          translateY(${currentY}%)
          scale(${currentScale})
        `;
        (card as HTMLElement).style.opacity = currentOpacity.toString();
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    {
      icon: Users,
      value: '+8000',
      label: 'Followers',
      gradient: 'from-pink-500 to-pink-800'
    },
    {
      icon: Bell,
      value: '+10',
      label: 'Alertes / semaine',
      gradient: 'from-pink-600 to-pink-900'
    },
    {
      icon: BookOpen,
      value: '100%',
      label: 'Analyse fondamentale quotidienne',
      gradient: 'from-pink-800 to-pink-950'
    }
  ];

  return (
    <section 
      id="stats"
      className="py-24 bg-black relative overflow-visible">
      {/* Fade from previous section */}
      <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-black z-10 pointer-events-none" />
      
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-pink-900/5 via-black to-black" />
      </div>
      
      <div ref={statsRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="stat-card relative transition-all duration-500 ease-out will-change-transform"
              style={{ 
                transformOrigin: 'center center',
                opacity: 0,
                transform: 'translateY(50%) scale(0.8)'
              }}
            >
              {/* Gradient border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/50 to-pink-800/50 rounded-2xl blur-sm opacity-50" />
              
              {/* Card content */}
              <div className="relative bg-black border border-pink-500/10 rounded-2xl p-8 flex flex-col items-center text-center">
                {/* Icon with gradient background */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} p-3 -mt-12 mb-6`}>
                  <stat.icon className="w-full h-full text-white" />
                </div>
                
                {/* Text content */}
                <div>
                  <div className="text-3xl font-bold mb-2 text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}