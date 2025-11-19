import React from 'react';
import { AlertCircle, FileText, Users, ShieldCheck } from 'lucide-react';

export const Features: React.FC = () => {
  return (
    <div className="bg-gray-50 py-10 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-poppins font-bold text-2xl lg:text-4xl text-gray-900 mb-14">
            Pourquoi rejoindre notre Discord maintenant ?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Bloc 1 — Accès limité */}
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Accès limité chaque jour</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                On limite volontairement les inscriptions pour garantir un bon accompagnement à chaque membre.
              </p>
            </div>

            {/* Bloc 2 — PDF exclusif offert */}
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-5">
                <FileText className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">PDF exclusif offert</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                En ce moment, on t'offre un PDF exclusif : “Comment faire grossir un petit compte” pour bien démarrer dans le trading, même avec peu de capital.
              </p>
            </div>

            {/* Bloc 3 — Alertes en temps réel */}
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Alertes en temps réel</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Reçois des signaux concrets pour passer à l'action au bon moment avec les autres membres.
              </p>
            </div>

            {/* Bloc 4 — Communauté active */}
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Communauté active</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Partage, entraide et motivation quotidienne avec des traders qui avancent comme toi.
              </p>
            </div>
          </div>

          {/* CTA mobile en bas */}
          <div className="mt-12 md:hidden">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-poppins font-semibold py-4 px-6 rounded-xl shadow-md"
            >
              🚀 Je réserve ma place dans le Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
