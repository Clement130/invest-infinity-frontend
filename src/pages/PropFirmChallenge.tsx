import React, { useEffect } from 'react';
import { Check, ArrowRight, ChevronDown, Disc as Discord } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PropFirmChallenge() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#0A0A0A] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            DERNIÈRE ÉTAPE
          </h1>
        </div>

        {/* Main Content */}
        <div className="relative mb-16">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30" />
          <div className="relative bg-black/90 rounded-2xl p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left Side - Features */}
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Challenge PropFirm
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 mt-2">
                      RMF
                    </span>
                  </h2>
                </div>

                {/* Logo */}
                <div className="mb-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-xl blur-xl" />
                  <div className="relative bg-black/40 rounded-xl p-8">
                    <img
                      src="/RMF_Long.avif"
                      alt="RMF Logo"
                      className="h-24 w-full object-contain mx-auto"
                    />
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {[
                    'COMPTE JUSQU\'À 200K€',
                    'SUPPORT 24/7 EN FRANÇAIS',
                    'JUSQU\'À 90% DES PROFITS',
                    'PAIEMENT RAPIDE DES GAINS',
                    'TRADING SUR MT4/MT5',
                    'CHALLENGE EN 2 PHASES'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 bg-blue-900/10 p-3 rounded-xl border border-blue-500/10">
                      <div className="bg-blue-500/10 rounded-full p-1 shrink-0">
                        <Check className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm text-blue-100">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button 
                  onClick={() => navigate('/register')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-4 px-6 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>COMMENCER LE CHALLENGE</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Right Side - Video */}
              <div className="relative flex items-center">
                <div className="relative rounded-xl overflow-hidden bg-gray-900 w-full">
                  <div className="relative pb-[56.25%] h-0">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                      title="RMF PropFirm Présentation"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center mb-8">
          <ChevronDown className="w-8 h-8 text-blue-400 animate-bounce" />
        </div>

        {/* Next Steps Section */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-50" />
            <div className="relative bg-black/90 rounded-2xl p-8 text-center border border-blue-500/20">
              <h2 className="text-2xl font-bold text-white mb-6">UNE FOIS INSCRIT</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-lg text-blue-400 font-semibold mb-2">débloque tes accès</p>
                  <a 
                    href="https://discord.gg/Y9RvKDCrWH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-[#5865F2] hover:bg-[#4752C4] transition-colors rounded-xl"
                  >
                    <Discord className="w-6 h-6 text-white" />
                    <span className="text-2xl font-bold text-white">DISCORD</span>
                  </a>
                </div>
                <div className="bg-blue-900/20 rounded-xl p-6">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Envoie nous un message avec l'identifiant du compte que tu as créé
                  </p>
                  <p className="text-gray-300 text-lg mt-4">
                    Nous te donnerons directement les accès au groupe privé 🔐
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}