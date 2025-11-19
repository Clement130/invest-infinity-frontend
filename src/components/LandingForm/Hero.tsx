import React from 'react';
import { Rocket, Package, Sparkles, Users, Handshake } from 'lucide-react';
import LeadForm  from './LeadForm';

export const Hero: React.FC = () => {
  return (
    <div className="container mx-auto px-4 pt-16 lg:pt-24 pb-8 lg:pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Colonne gauche - Masquée sur mobile */}
          <div className="lg:block order-2 lg:order-1">
            <h1 className="font-poppins font-bold text-3xl lg:text-5xl text-gray-900 mb-4 lg:mb-6 leading-tight">
              🎓 Rejoins mon Discord et booste tes résultats dès aujourd'hui
            </h1>

            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg mb-6 lg:mb-8">
              <p className="text-lg lg:text-xl text-gray-700 font-medium mb-6">
                Ce que tu t'apprêtes à débloquer :
              </p>

              <div className="space-y-4 py-4">

                {/* BONUS temporaire */}
                <div className="flex items-start relative pt-4">
                  {/* Badge temporaire flottant au-dessus de l’icône */}
                  <span className="absolute -top-2 left-0 text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-[2px] rounded-full uppercase whitespace-nowrap shadow-sm">
                    ⏳ Offre Temporaire
                  </span>

                  {/* Icône Sparkles */}
                  <div className="bg-yellow-100 rounded-lg p-2 mr-4 flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                  </div>

                  {/* Texte à droite */}
                  <div className="flex-1">
                    <p className="text-gray-800 font-semibold text-base lg:text-lg mb-1">
                      PDF Exclusif : “Comment faire grossir un petit compte”
                    </p>
                    <p className="text-gray-600 text-base">
                      Offre disponible uniquement en ce moment. Méthodologie complète pour démarrer avec un petit capital.
                    </p>
                  </div>
                </div>


                {/* Formation */}
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-lg p-2 mr-4 flex-shrink-0">
                    <Rocket className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold text-base lg:text-lg">
                      Formation complète sur Discord
                    </p>
                    <p className="text-gray-600 text-base mt-1">
                      Apprends à trader étape par étape, des bases aux techniques avancées.
                    </p>
                  </div>
                </div>

                {/* Alertes */}
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-lg p-2 mr-4 flex-shrink-0">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold text-base lg:text-lg">
                      Alertes & analyses à copier-coller
                    </p>
                    <p className="text-gray-600 text-base mt-1">
                      Reçois chaque jour nos opportunités de marché clés à suivre ou reproduire.
                    </p>
                  </div>
                </div>

                {/* Coaching */}
                <div className="flex items-start">
                  <div className="bg-pink-100 rounded-lg p-2 mr-4 flex-shrink-0">
                    <Handshake className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold text-base lg:text-lg">
                      Coaching et suivi personnalisé
                    </p>
                    <p className="text-gray-600 text-base mt-1">
                      Pose toutes tes questions, suis les bons trades, et progresse avec un accompagnement réel.
                    </p>
                  </div>
                </div>

                {/* Communauté */}
                <div className="flex items-start">
                  <div className="bg-indigo-100 rounded-lg p-2 mr-4 flex-shrink-0">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold text-base lg:text-lg">
                      Communauté privée sur Discord
                    </p>
                    <p className="text-gray-600 text-base mt-1">
                      Rejoins un espace avec d'autres traders motivés comme toi. Partage, entraide, motivation quotidienne et ambiance bienveillante garanties.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Colonne droite - Formulaire visible partout */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-8">
            <LeadForm />
          </div>
        </div>
      </div>
    </div>
  );
};
