import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle, Info, Sparkles } from 'lucide-react';

interface Step1Props {
  onNext: () => void;
}

const Step1OpenAccount: React.FC<Step1Props> = ({ onNext }) => {
  const [showWhy, setShowWhy] = useState(false);

  const benefits = [
    'Formation vidéo avancée offerte',
    'Alertes de trading en temps réel',
    'Modules privés + coach dédié',
    'PDF exclusif : “Faire grossir un petit compte”',
    'Accès immédiat à la communauté Discord',
  ];

  const handleOpenAccount = () => {
    window.open(
      'https://partners.raisefx.com/visit/?bta=167838&brand=raisefx',
      '_blank',
      'noopener,noreferrer'
    );
    onNext();
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* HEADER */}
      <div className="text-center mb-6">
        <h2 className="flex items-center justify-center gap-2 text-2xl font-extrabold text-gray-900">
          <Sparkles className="w-6 h-6 text-pink-500" />
          Ouvre ton compte de trading
        </h2>
        <p className="mt-2 text-gray-600">
          En moins de 5 minutes, débloque notre pack complet : formations, alertes, coaching — 100 % offert.
        </p>
      </div>

      {/* POURQUOI CE COMPTE */}
      <div className="text-center mb-6">
        <button
          onClick={() => setShowWhy((v) => !v)}
          className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Info className="w-5 h-5 mr-1" />
          Pourquoi ce compte ?
        </button>
        {showWhy && (
          <p className="mt-3 text-gray-700 text-sm bg-gray-100 p-3 rounded-lg">
            Pour commencer à trader, tu as besoin d’un compte de trading.  
            En passant par notre partenaire, tu profites des mêmes conditions que moi : spread très faible, exécution rapide, et support prioritaire.  
            Le courtier est régulé et reconnu, et ton dépôt reste ton capital : tu es libre d’en disposer.
          </p>
        )}
      </div>

      {/* BÉNÉFICES */}
      <ul className="w-full space-y-3 mb-8">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <span className="flex-1 text-gray-800">{b}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-auto">
        <button
          onClick={handleOpenAccount}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4
                     bg-gradient-to-r from-pink-500 to-pink-600
                     hover:from-pink-600 hover:to-pink-800
                     text-white font-bold rounded-xl shadow-lg
                     transition-transform hover:scale-105"
        >
          Ouvrir mon compte de trading maintenant
          <ArrowUpRight className="w-5 h-5" />
        </button>
        <p className="mt-2 text-gray-500 text-xs text-center">
          ⚡ Accès immédiat au Discord après validation.
        </p>
      </div>

      {/* Lien vers formation gratuite */}
      <div className="mt-4 text-center">
        <a
          href="https://discord.gg/Y9RvKDCrWH"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 underline hover:text-pink-700"
        >
          Je préfère commencer par regarder la formation gratuite
        </a>
      </div>
    </div>
  );
};

export default Step1OpenAccount;
