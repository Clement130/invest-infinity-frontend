/**
 * HelpPage – Centre d'aide et tutoriels pour les administrateurs
 * 
 * Contient :
 * - Tutoriels pas à pas
 * - FAQ admin
 * - Checklist onboarding
 * - Liens vers documentation
 */

import { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Video,
  Users,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Search,
  Lightbulb,
  Target,
} from 'lucide-react';

// Types pour les tutoriels
interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: typeof HelpCircle;
  steps: string[];
  tips?: string[];
}

// Tutoriels disponibles
const TUTORIALS: Tutorial[] = [
  {
    id: 'create-formation',
    title: 'Créer une formation',
    description: 'Apprenez à créer et organiser vos formations de trading.',
    icon: BookOpen,
    steps: [
      'Accédez à la section "Formations" dans le menu latéral',
      'Cliquez sur le bouton "Créer" en haut à droite',
      'Remplissez le titre, la description et le niveau requis',
      'Définissez la licence requise (Starter, Pro ou Elite)',
      'Cliquez sur "Enregistrer" pour créer la formation',
      'Ajoutez ensuite des leçons à votre formation',
    ],
    tips: [
      'Utilisez des titres clairs et descriptifs',
      'Organisez vos leçons dans un ordre logique de progression',
    ],
  },
  {
    id: 'add-lesson',
    title: 'Ajouter une leçon',
    description: 'Comment ajouter et configurer une leçon dans un module.',
    icon: BookOpen,
    steps: [
      'Ouvrez la formation concernée',
      'Cliquez sur "Ajouter une leçon"',
      'Donnez un titre et une description à la leçon',
      'Associez une vidéo Bunny Stream si nécessaire',
      'Définissez la position de la leçon dans le module',
      'Cochez "Aperçu gratuit" si la leçon doit être accessible à tous',
    ],
  },
  {
    id: 'upload-video',
    title: 'Uploader une vidéo Bunny',
    description: 'Guide pour uploader et gérer vos vidéos de formation.',
    icon: Video,
    steps: [
      'Accédez à la section "Vidéos" dans le menu',
      'Cliquez sur "Uploader une vidéo"',
      'Sélectionnez votre fichier vidéo (MP4 recommandé)',
      'Attendez la fin de l\'upload et du traitement',
      'Une fois prête, associez la vidéo à une leçon',
    ],
    tips: [
      'Format recommandé : MP4 H.264, 1080p',
      'Les vidéos sont automatiquement sécurisées avec des URLs signées',
      'Le traitement peut prendre quelques minutes selon la taille',
    ],
  },
  {
    id: 'manage-users',
    title: 'Gérer les utilisateurs',
    description: 'Administrer les comptes et abonnements des membres.',
    icon: Users,
    steps: [
      'Accédez à la section "Utilisateurs"',
      'Utilisez la barre de recherche pour trouver un membre',
      'Cliquez sur un utilisateur pour voir ses détails',
      'Vous pouvez modifier son plan, réinitialiser sa progression, ou suspendre son compte',
    ],
    tips: [
      'La "Vue Client" permet de voir la plateforme comme un membre',
      'Les modifications de plan prennent effet immédiatement',
    ],
  },
  {
    id: 'check-payments',
    title: 'Vérifier les paiements',
    description: 'Consulter l\'historique des paiements et abonnements.',
    icon: CreditCard,
    steps: [
      'Accédez à la section "Paiements"',
      'Filtrez par statut (actif, expiré, échoué)',
      'Cliquez sur un paiement pour voir les détails',
      'Utilisez le lien Stripe pour accéder au dashboard Stripe',
    ],
  },
  {
    id: 'test-as-client',
    title: 'Tester côté client',
    description: 'Prévisualiser la plateforme comme un membre.',
    icon: Target,
    steps: [
      'Cliquez sur "Vue Client" dans le menu',
      'Sélectionnez le type de licence à simuler',
      'Naviguez dans la plateforme comme le ferait un membre',
      'Vérifiez que les accès sont corrects selon le plan',
    ],
    tips: [
      'Testez régulièrement après chaque modification de contenu',
      'Vérifiez sur mobile et desktop',
    ],
  },
];

// Checklist onboarding
const ONBOARDING_CHECKLIST = [
  { id: 'first-formation', label: 'Créer votre première formation', path: '/admin/formations' },
  { id: 'first-lesson', label: 'Ajouter une leçon', path: '/admin/formations' },
  { id: 'first-video', label: 'Uploader une vidéo', path: '/admin/videos' },
  { id: 'test-client', label: 'Tester la vue client', path: '/admin/preview' },
  { id: 'check-payments', label: 'Consulter les paiements', path: '/admin/paiements' },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null);

  // Filtrer les tutoriels par recherche
  const filteredTutorials = TUTORIALS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-purple-400" />
            Centre d'aide Admin
          </h1>
          <p className="text-gray-400 mt-1">
            Tutoriels, guides et ressources pour gérer la plateforme
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un tutoriel..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="
            w-full pl-10 pr-4 py-3 rounded-xl
            bg-white/5 border border-white/10
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
            transition-all
          "
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale : Tutoriels */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Tutoriels
          </h2>

          {filteredTutorials.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun tutoriel trouvé pour "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTutorials.map((tutorial) => {
                const Icon = tutorial.icon;
                const isExpanded = expandedTutorial === tutorial.id;

                return (
                  <div
                    key={tutorial.id}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                  >
                    {/* Header du tutoriel */}
                    <button
                      onClick={() => setExpandedTutorial(isExpanded ? null : tutorial.id)}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white">{tutorial.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{tutorial.description}</p>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {/* Contenu expandé */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                        {/* Étapes */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Étapes :</h4>
                          <ol className="space-y-2">
                            {tutorial.steps.map((step, index) => (
                              <li key={index} className="flex items-start gap-3 text-sm">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </span>
                                <span className="text-gray-300 pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Tips */}
                        {tutorial.tips && tutorial.tips.length > 0 && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                              <Lightbulb className="w-4 h-4" />
                              Conseils
                            </div>
                            <ul className="space-y-1">
                              {tutorial.tips.map((tip, index) => (
                                <li key={index} className="text-sm text-amber-200/80 flex items-start gap-2">
                                  <span className="text-amber-400">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Checklist onboarding */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Checklist démarrage
            </h2>
            <div className="space-y-2">
              {ONBOARDING_CHECKLIST.map((item) => (
                <a
                  key={item.id}
                  href={item.path}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-gray-600 group-hover:border-purple-400 transition-colors" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* Liens utiles */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Liens utiles</h2>
            <div className="space-y-2">
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
              >
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Dashboard Stripe</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
              <a
                href="https://dash.bunny.net"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
              >
                <Video className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Bunny Stream</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </div>
          </div>

          {/* Contact support */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Besoin d'aide ?</h2>
            <p className="text-sm text-gray-300 mb-4">
              Une question technique ou un problème ? Contactez le support.
            </p>
            <a
              href="mailto:support@investinfinity.fr"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              Contacter le support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

