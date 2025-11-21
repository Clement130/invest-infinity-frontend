import React from 'react';
import { X, Shield, FileText, Lock, Eye, UserCheck } from 'lucide-react';

interface RGPDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RGPDModal({ isOpen, onClose }: RGPDModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1f] border border-pink-500/20 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-pink-500/20">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-pink-500" />
            <h2 className="text-2xl font-bold text-white">Mentions Légales & RGPD</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Section 1: Responsable du traitement */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-pink-500" />
              <h3 className="text-xl font-semibold text-white">Responsable du traitement</h3>
            </div>
            <div className="text-gray-300 space-y-2 pl-7">
              <p>
                <strong className="text-white">Raison sociale :</strong> [Nom de votre entreprise]
              </p>
              <p>
                <strong className="text-white">Adresse :</strong> [Adresse complète]
              </p>
              <p>
                <strong className="text-white">Email :</strong> [Email de contact]
              </p>
              <p>
                <strong className="text-white">Téléphone :</strong> [Numéro de téléphone]
              </p>
            </div>
          </section>

          {/* Section 2: Données collectées */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-pink-500" />
              <h3 className="text-xl font-semibold text-white">Données collectées</h3>
            </div>
            <div className="text-gray-300 pl-7 space-y-3">
              <p>
                Nous collectons les données suivantes dans le cadre de nos services :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Données d'identification (nom, prénom, email)</li>
                <li>Données de connexion (adresse IP, logs de connexion)</li>
                <li>Données de navigation (cookies, préférences)</li>
                <li>Données de paiement (traitées de manière sécurisée via nos prestataires)</li>
                <li>Données de formation (progression, résultats)</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Finalités */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-pink-500" />
              <h3 className="text-xl font-semibold text-white">Finalités du traitement</h3>
            </div>
            <div className="text-gray-300 pl-7 space-y-2">
              <p>Les données collectées sont utilisées pour :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>La fourniture de nos services de formation en trading</li>
                <li>La gestion de votre compte utilisateur</li>
                <li>L'amélioration de nos services et de l'expérience utilisateur</li>
                <li>La communication avec vous concernant nos services</li>
                <li>Le respect de nos obligations légales et réglementaires</li>
                <li>La prévention de la fraude et la sécurité de nos systèmes</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Base légale */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-pink-500" />
              <h3 className="text-xl font-semibold text-white">Base légale</h3>
            </div>
            <div className="text-gray-300 pl-7 space-y-2">
              <p>Le traitement de vos données personnelles est basé sur :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Votre consentement</strong> pour les cookies non essentiels et les communications marketing</li>
                <li><strong className="text-white">L'exécution d'un contrat</strong> pour la fourniture de nos services</li>
                <li><strong className="text-white">Notre intérêt légitime</strong> pour l'amélioration de nos services et la sécurité</li>
                <li><strong className="text-white">Le respect d'obligations légales</strong> pour la comptabilité et la facturation</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Conservation */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-4">Durée de conservation</h3>
            <div className="text-gray-300 pl-7 space-y-2">
              <p>
                Vos données personnelles sont conservées pour la durée nécessaire aux finalités pour lesquelles elles ont été collectées :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Données de compte : durée de la relation contractuelle + 3 ans</li>
                <li>Données de connexion : 12 mois</li>
                <li>Données de paiement : 10 ans (obligation légale)</li>
                <li>Cookies : selon les préférences que vous avez définies</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Vos droits */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-4">Vos droits</h3>
            <div className="text-gray-300 pl-7 space-y-3">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Droit d'accès :</strong> Vous pouvez obtenir une copie de vos données personnelles</li>
                <li><strong className="text-white">Droit de rectification :</strong> Vous pouvez corriger vos données inexactes</li>
                <li><strong className="text-white">Droit à l'effacement :</strong> Vous pouvez demander la suppression de vos données</li>
                <li><strong className="text-white">Droit à la limitation :</strong> Vous pouvez demander la limitation du traitement</li>
                <li><strong className="text-white">Droit à la portabilité :</strong> Vous pouvez récupérer vos données dans un format structuré</li>
                <li><strong className="text-white">Droit d'opposition :</strong> Vous pouvez vous opposer au traitement de vos données</li>
                <li><strong className="text-white">Droit de retirer votre consentement :</strong> À tout moment pour les traitements basés sur le consentement</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à l'adresse :{' '}
                <a href="mailto:[email]" className="text-pink-500 hover:text-pink-400 underline">
                  [email]
                </a>
              </p>
            </div>
          </section>

          {/* Section 7: Cookies */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-4">Cookies</h3>
            <div className="text-gray-300 pl-7 space-y-3">
              <p>Notre site utilise différents types de cookies :</p>
              <div className="space-y-4 ml-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Cookies nécessaires</h4>
                  <p className="text-sm">
                    Ces cookies sont essentiels au fonctionnement du site. Ils ne peuvent pas être désactivés.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Cookies analytiques</h4>
                  <p className="text-sm">
                    Ces cookies nous permettent d'analyser l'utilisation du site pour améliorer nos services.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Cookies marketing</h4>
                  <p className="text-sm">
                    Ces cookies sont utilisés pour vous proposer des publicités personnalisées et mesurer leur efficacité.
                  </p>
                </div>
              </div>
              <p className="mt-4">
                Vous pouvez gérer vos préférences de cookies à tout moment via la bannière de cookies ou dans les paramètres de votre navigateur.
              </p>
            </div>
          </section>

          {/* Section 8: Sécurité */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-4">Sécurité des données</h3>
            <div className="text-gray-300 pl-7 space-y-2">
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>L'accès non autorisé</li>
                <li>La perte ou la destruction accidentelle</li>
                <li>L'utilisation non autorisée</li>
                <li>La modification ou la divulgation</li>
              </ul>
            </div>
          </section>

          {/* Section 9: Transferts */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-4">Transferts de données</h3>
            <div className="text-gray-300 pl-7 space-y-2">
              <p>
                Vos données peuvent être transférées et traitées dans des pays en dehors de l'UE. 
                Dans ce cas, nous nous assurons que des garanties appropriées sont en place pour protéger vos données.
              </p>
            </div>
          </section>

          {/* Section 10: Réclamations */}
          <section>
            <h3 className="text-xl font-semibold text-white mb-4">Réclamations</h3>
            <div className="text-gray-300 pl-7 space-y-2">
              <p>
                Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, 
                vous avez le droit d'introduire une réclamation auprès de l'autorité de contrôle compétente :
              </p>
              <p className="ml-4">
                <strong className="text-white">CNIL</strong> (Commission Nationale de l'Informatique et des Libertés)<br />
                3 Place de Fontenoy - TSA 80715<br />
                75334 PARIS CEDEX 07<br />
                Téléphone : 01 53 73 22 22<br />
                Site web :{' '}
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400 underline">
                  www.cnil.fr
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-pink-500/20 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

