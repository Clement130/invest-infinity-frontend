import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User, Shield, Sparkles, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import './Header.css';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [redirectTo, setRedirectTo] = useState<'client' | 'admin'>('client');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsAtTop(scrollPosition < 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleOptionClick = (mode: 'login' | 'register', target: 'client' | 'admin') => {
    setAuthMode(mode);
    setRedirectTo(target);
    setShowAuthModal(true);
    setIsDropdownOpen(false);
  };

  const handleClick = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 300);
    } else {
      scrollToSection(sectionId);
    }
    setIsMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerHeight = 80;
      const sectionTop = section.offsetTop - headerHeight;

      window.scrollTo({
        top: sectionTop,
        behavior: 'smooth',
      });

      setActiveSection(sectionId);
    }
  };

  const scrollToTop = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Émettre un événement quand le menu mobile s'ouvre/ferme
  // ET ajouter un attribut data + classe CSS sur le body pour une détection plus robuste (iOS Safari + Brave)
  useEffect(() => {
    if (isMenuOpen) {
      document.dispatchEvent(new CustomEvent('mobile-menu-open'));
      document.body.setAttribute('data-mobile-menu-open', 'true');
      // Forcer l'ajout de la classe avec plusieurs tentatives (pour Brave)
      document.body.classList.add('mobile-menu-open');
      // Empêcher le scroll du body quand le menu est ouvert
      document.body.style.overflow = 'hidden';
      // Double vérification après un court délai
      setTimeout(() => {
        if (!document.body.classList.contains('mobile-menu-open')) {
          document.body.classList.add('mobile-menu-open');
        }
      }, 10);
    } else {
      document.dispatchEvent(new CustomEvent('mobile-menu-close'));
      document.body.removeAttribute('data-mobile-menu-open');
      document.body.classList.remove('mobile-menu-open');
      // Réactiver le scroll
      document.body.style.overflow = '';
    }
  }, [isMenuOpen]);

  return (
    <>
      <header className="header">
        <div
          className={`
            header__container 
            transition-all 
            duration-300 
            ${isAtTop 
              ? 'bg-transparent backdrop-blur-none border-transparent'
              : 'bg-[#0f0f13]/95 backdrop-blur-md border-b border-pink-500/10'
            }
          `}
        >
          <div className="header__content">
            <button
              onClick={scrollToTop}
              className="header__logo group"
              aria-label="Retour en haut de la page"
            >
              <img
                src="/logo_typo.png"
                alt="Invest Infinity Logo"
                className="w-[80%] max-w-[200px] object-contain transform group-hover:scale-110 transition-transform duration-300"
              />
            </button>

            <nav className="header__nav">
              <div className="header__nav-links flex items-center">
                <button
                  className={`header__link ${activeSection === 'services' ? 'text-pink-500' : ''}`}
                  onClick={() => handleClick('services')}
                >
                  Accueil
                </button>
                <button
                  className="header__link"
                  onClick={() => navigate('/pricing')}
                >
                  Tarifs
                </button>
                <button
                  className={`header__link ${activeSection === 'faq' ? 'text-pink-500' : ''}`}
                  onClick={() => handleClick('faq')}
                >
                  FAQ
                </button>
                <button
                  className="header__link"
                  onClick={() => navigate('/contact')}
                >
                  Contact
                </button>
                
                {/* Bouton "Mon Compte" avec dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all transform hover:scale-[1.02] whitespace-nowrap"
                  >
                    <User size={18} />
                    <span>Mon Compte</span>
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-pink-500/30 rounded-lg shadow-xl overflow-hidden z-50">
                      {/* Option 1: Espace Client */}
                      <button
                        onClick={() => handleOptionClick('login', 'client')}
                        className="w-full px-4 py-3 text-left hover:bg-pink-500/10 flex items-center gap-3 text-white transition-colors"
                      >
                        <User size={18} className="text-pink-500" />
                        <span>Espace Client</span>
                      </button>

                      {/* Option 2: Espace Admin */}
                      <button
                        onClick={() => handleOptionClick('login', 'admin')}
                        className="w-full px-4 py-3 text-left hover:bg-pink-500/10 flex items-center gap-3 text-gray-300 transition-colors"
                      >
                        <Shield size={18} className="text-violet-500" />
                        <span>Espace Admin</span>
                      </button>

                      {/* Séparateur */}
                      <div className="border-t border-white/10 my-1"></div>

                      {/* Option 3: Créer un compte */}
                      <button
                        onClick={() => handleOptionClick('register', 'client')}
                        className="w-full px-4 py-3 text-left hover:bg-pink-500/10 flex items-center gap-3 text-white transition-colors"
                      >
                        <Sparkles size={18} className="text-pink-500" />
                        <span>Créer un compte</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </nav>

            <button
              className="header__mobile-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-[#0f0f13]/80 z-[60] transition-opacity duration-200"
            onClick={() => setIsMenuOpen(false)}
            style={{ display: isMenuOpen ? 'block' : 'none' }}
          >
            <div 
              className="flex flex-col items-center justify-center h-full space-y-6 relative z-10"
            >
              <button
                className={`text-gray-400 text-xl hover:text-pink-500 transition-colors ${
                  activeSection === 'services' ? 'text-pink-500' : ''
                }`}
                onClick={() => handleClick('services')}
              >
                Accueil
              </button>
              <button
                className="text-gray-400 text-xl hover:text-pink-500 transition-colors"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/pricing');
                }}
              >
                Tarifs
              </button>
              <button
                className={`text-gray-400 text-xl hover:text-pink-500 transition-colors ${
                  activeSection === 'faq' ? 'text-pink-500' : ''
                }`}
                onClick={() => handleClick('faq')}
              >
                FAQ
              </button>
              <button
                className="text-gray-400 text-xl hover:text-pink-500 transition-colors"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/contact');
                }}
              >
                Contact
              </button>
              
              {/* Options du menu mobile */}
              <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/10 w-full max-w-xs">
                <button
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 relative z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    // Petit délai pour s'assurer que le menu se ferme avant d'ouvrir le modal
                    setTimeout(() => {
                      handleOptionClick('login', 'client');
                    }, 100);
                  }}
                >
                  <User size={18} />
                  Espace Client
                </button>
                
                <button
                  className="w-full px-6 py-3 bg-slate-800/50 text-gray-300 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 border border-violet-500/30 relative z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    setTimeout(() => {
                      handleOptionClick('login', 'admin');
                    }, 100);
                  }}
                >
                  <Shield size={18} />
                  Espace Admin
                </button>
                
                <button
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 relative z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    setTimeout(() => {
                      handleOptionClick('register', 'client');
                    }, 100);
                  }}
                >
                  <Sparkles size={18} />
                  Créer un compte
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* AuthModal unique avec mode et redirectTo dynamiques */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          type={authMode}
          redirectTo={redirectTo}
        />
      )}
    </>
  );
}