import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface Step2Props {
  onBack: () => void;
  onNext: () => void;
}

const Step2JoinDiscord: React.FC<Step2Props> = ({ onBack, onNext }) => {
  const handleJoinDiscord = () => {
    window.open('https://discord.gg/Y9RvKDCrWH', '_blank', 'noopener,noreferrer');
    onNext();
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* HEADER */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
          🛎️ Étape 2 : Rejoins notre Discord privé
        </h2>
        <p className="text-gray-600 text-sm">
          Tu y trouveras les alertes en temps réel, la communauté, les modules privés et plus encore.
        </p>
      </div>

      {/* CTA Discord */}
      <button
        onClick={handleJoinDiscord}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 
                   bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300 
                   rounded-xl shadow-lg font-bold text-base text-white w-full"
      >
        <img src="/discord-icon.webp" alt="Discord" className="w-5 h-5" />
        Rejoindre le Discord
        <ArrowUpRight className="w-5 h-5" />
      </button>

      {/* AVERTISSEMENT */}
      <p className="text-red-600 font-medium mt-3 text-center text-sm px-4">
        ⚠️ L'accès complet est activé après validation de ton compte de trading par notre équipe.
      </p>

      {/* Retour */}
      <div className="mt-6 text-center">
        <p className="text-gray-700 text-sm mb-2">
          Tu n’as pas encore ouvert ton compte de trading ?
        </p>
        <button
          onClick={onBack}
          className="inline-block px-6 py-2 bg-yellow-500 hover:bg-yellow-600 
                     transition-colors duration-300 rounded-md shadow text-white 
                     font-semibold text-sm"
        >
          ⬅️ Retour à l'étape précédente
        </button>
      </div>
    </div>
  );
};

export default Step2JoinDiscord;
