import React, { useRef, useState, useEffect } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { PremiumButton } from "./ui/premium/PremiumButton";
import { TextGradient } from "./ui/premium/TextGradient";
import { ScrollReveal } from "./ui/premium/ScrollReveal";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface HeroProps {
  onOpenRegister?: () => void;
}

export default function Hero({ onOpenRegister }: HeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { shouldReduceMotion, isMobile } = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Sur mobile, on désactive complètement Framer Motion et on utilise un scroll simple
  const shouldUseFramerMotion = !shouldReduceMotion && !isMobile;
  
  // Version desktop avec Framer Motion - toujours appelé mais peut être ignoré
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Utiliser les transforms seulement si on doit utiliser Framer Motion
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  // Version mobile : calcul simple du scroll progress
  useEffect(() => {
    if (shouldUseFramerMotion) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / windowHeight));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shouldUseFramerMotion]);

  // Calculer les valeurs pour mobile
  const mobileYBg = shouldUseFramerMotion ? 0 : `${scrollProgress * 25}%`;
  const mobileOpacity = shouldUseFramerMotion ? 1 : Math.max(0, 1 - scrollProgress * 2);
  const mobileScale = shouldUseFramerMotion ? 1 : Math.max(0.9, 1 - scrollProgress * 0.1);

  const scrollToServices = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <section ref={containerRef} className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Fond vidéo avec effet de parallaxe */}
      {shouldUseFramerMotion ? (
        <motion.div style={{ y: yBg }} className="absolute inset-0 z-0 h-[120vh]">
          <img 
            src="/background.png" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black/40" />
        </motion.div>
      ) : (
        <div 
          className="absolute inset-0 z-0 h-[120vh]"
          style={{ 
            transform: `translateY(${mobileYBg})`,
            willChange: 'transform',
          }}
        >
          <img 
            src="/background.png" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black/40" />
        </div>
      )}

      {/* Contenu principal */}
      {shouldUseFramerMotion ? (
        <motion.div 
          style={{ opacity: opacityHero, scale: scaleHero }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 mt-20"
        >
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Titre */}
          <div className="mb-6 relative text-center">
            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight"
            >
              REJOINS UNE COMMUNAUTÉ
            </motion.h1>

            <motion.h2 
              variants={itemVariants}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold mt-2"
            >
              <TextGradient>DE TRADERS PERFORMANTS</TextGradient>
            </motion.h2>
          </div>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
          >
            Rejoins Invest Infinity et accède à nos analyses, à des stratégies structurées et à une formation complète, avec un accompagnement réel pour progresser chaque jour.
          </motion.p>

          {/* Boutons */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-6">
            <PremiumButton 
              size="lg"
              onClick={() => navigate('/pricing')}
              className="group"
            >
              <span className="font-bold">Forme-toi dès maintenant</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </PremiumButton>
            
            {/* Réassurance */}
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <span>✓ Garantie 14 jours</span>
              <span className="text-gray-600">•</span>
              <span>Accès à vie</span>
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <div 
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 mt-20"
          style={{ 
            opacity: mobileOpacity, 
            transform: `scale(${mobileScale})`,
            willChange: 'opacity, transform',
          }}
        >
          <div className="text-center">
            {/* Titre */}
            <div className="mb-6 relative text-center">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                REJOINS UNE COMMUNAUTÉ
              </h1>
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold mt-2">
                <TextGradient>DE TRADERS PERFORMANTS</TextGradient>
              </h2>
            </div>

            {/* Description */}
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Rejoins Invest Infinity et accède à nos analyses, à des stratégies structurées et à une formation complète, avec un accompagnement réel pour progresser chaque jour.
            </p>

            {/* Boutons */}
            <div className="flex flex-col items-center gap-6">
              <PremiumButton 
                size="lg"
                onClick={() => navigate('/pricing')}
                className="group"
              >
                <span className="font-bold">Forme-toi dès maintenant</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </PremiumButton>
              
              {/* Réassurance */}
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <span>✓ Garantie 14 jours</span>
                <span className="text-gray-600">•</span>
                <span>Accès à vie</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bouton de défilement */}
      {shouldUseFramerMotion ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-[-100px] left-1/2 transform -translate-x-1/2 z-20"
        >
          <button
            onClick={scrollToServices}
            className="group flex flex-col items-center gap-2"
          >
            <span className="text-sm font-medium tracking-wider uppercase text-white/80 group-hover:text-white transition-colors">
              Découvrir
            </span>

            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 ease-out" />
              <div className="relative bg-pink-500/10 rounded-full p-2 transition-colors group-hover:bg-pink-500/20">
                <ChevronDown className="w-6 h-6 text-white animate-bounce" />
              </div>
            </div>
          </button>
        </motion.div>
      ) : (
        <div className="absolute bottom-[-100px] left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={scrollToServices}
            className="group flex flex-col items-center gap-2"
          >
            <span className="text-sm font-medium tracking-wider uppercase text-white/80 group-hover:text-white transition-colors">
              Découvrir
            </span>
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 ease-out" />
              <div className="relative bg-pink-500/10 rounded-full p-2 transition-colors group-hover:bg-pink-500/20">
                <ChevronDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-50 pointer-events-none" />
    </section>
  );
}
