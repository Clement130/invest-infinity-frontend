import React, { useEffect, useRef } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroProps {
  onOpenRegister?: () => void;
}

export default function Hero({ onOpenRegister }: HeroProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToServices = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };


  return (
<section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
{/* Fond vidéo avec effet de parallaxe */}
<div className="absolute inset-0 z-0 h-screen">
      <img 
        src="/background.png" 
        alt="Background" 
        className="w-full h-full object-cover scale-110"
      />

        
        {/* Overlay principal avec effet de parallaxe */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black/40" />
          
          {/* Effets de lumière dynamiques */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-400/10 rounded-full filter blur-[120px] animate-pulse delay-500" />
          </div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 mt-20">
        <div className="text-center">
{/* Titre avec animation de glitch */}
<div className="mb-6 relative text-center">
  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
    <span className="relative inline-block">
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <span className="absolute text-pink-500 opacity-0 animate-pulse filter blur-sm">REJOINS</span>
      </div>
      REJOINS
    </span>
    {' '}
    <span className="relative inline-block">
      UNE COMMUNAUTÉ
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <span className="absolute text-pink-500 opacity-0 animate-pulse filter blur-sm">UNE COMMUNAUTÉ</span>
      </div>
    </span>
  </h1>

  {/* Deuxième ligne avec une plus grande taille et bien centrée */}
{/* Deuxième ligne avec une taille identique au titre */}
<h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-500 to-pink-500 animate-gradient mt-2">
  DE TRADERS PERFORMANTS
</h2>


</div>


          {/* Description avec effet de fade-in */}
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto opacity-0 animate-fade-in">
            Rejoins Invest Infinity et accède à nos analyses, à des stratégies structurées et à une formation complète, avec un accompagnement réel pour progresser chaque jour.
          </p>

          {/* Bouton avec effets néon */}
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => navigate('/pricing')}
              className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-500 text-white rounded-xl overflow-hidden"
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-pink-400/50 to-pink-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              {/* Contenu du bouton */}
              <div className="relative flex items-center justify-center gap-2">
                <span className="font-semibold">Forme-toi dès maintenant</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Effet de glow */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-pink-500 blur-xl -z-10" />
            </button>
            
            {/* Réassurance */}
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <span>✓ Garantie 14 jours</span>
              <span className="text-gray-600">•</span>
              <span>Accès à vie</span>
            </p>
          </div>
        </div>

        {/* Bouton de défilement avec effet de pulsation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={scrollToServices}
            className="group flex flex-col items-center gap-2"
          >
            <span className="text-sm font-medium tracking-wider uppercase text-white/80 group-hover:text-white transition-colors">
              Découvrir
            </span>

            <div className="relative">
              {/* Cercle pulsant */}
              <div className="absolute inset-0 bg-pink-500/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 ease-out" />
              <div className="relative bg-pink-500/10 rounded-full p-2 transition-colors group-hover:bg-pink-500/20">
                <ChevronDown className="w-6 h-6 text-white animate-bounce" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Effet de vignette sur les bords */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-50 pointer-events-none" />
    </section>
  );
}