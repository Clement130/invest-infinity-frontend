import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import './Header.css';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

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
              <div className="header__nav-links">
                <button
                  className={`header__link ${activeSection === 'services' ? 'text-pink-500' : ''}`}
                  onClick={() => handleClick('services')}
                >
                  Services
                </button>
                <button
                  className={`header__link ${activeSection === 'faq' ? 'text-pink-500' : ''}`}
                  onClick={() => handleClick('faq')}
                >
                  FAQ
                </button>
                <button
                  className="header__button"
                  onClick={() => setIsRegisterOpen(true)}
                >
                  Inscription
                </button>
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
            className="fixed inset-0 bg-[#0f0f13]/95 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              <button
                className={`text-gray-400 text-xl hover:text-pink-500 transition-colors ${
                  activeSection === 'services' ? 'text-pink-500' : ''
                }`}
                onClick={() => handleClick('services')}
              >
                Services
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
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-500 text-white rounded-full hover:from-pink-500 hover:to-pink-600 transition-all transform hover:scale-105"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsRegisterOpen(true);
                }}
              >
                Inscription
              </button>
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        type="register"
      />
    </>
  );
}