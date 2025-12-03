/**
 * Service de recherche globale pour la Command Palette
 * Permet de rechercher dans toutes les sections de l'admin
 */

import { listProfiles } from './profilesService';
import { listLeads } from './leadsService';
import { getModules } from './trainingService';
import { getPaymentsForAdmin, getLicenseLabel } from './purchasesService';

export type CommandPaletteItem = {
  id: string;
  type: 'navigation' | 'action' | 'search-result';
  label: string;
  description?: string;
  icon?: string;
  path?: string;
  action?: () => void;
  keywords: string[];
  category: string;
};

export type SearchResult = {
  category: string;
  items: CommandPaletteItem[];
};

const navigationItems: CommandPaletteItem[] = [
  {
    id: 'nav-dashboard',
    type: 'navigation',
    label: 'Dashboard',
    description: 'Vue d\'ensemble de la plateforme',
    path: '/admin',
    keywords: ['dashboard', 'accueil', 'home', 'overview'],
    category: 'Navigation',
  },
  {
    id: 'nav-users',
    type: 'navigation',
    label: 'Utilisateurs',
    description: 'Gérer les utilisateurs',
    path: '/admin/users',
    keywords: ['users', 'utilisateurs', 'clients', 'admins'],
    category: 'Navigation',
  },
  {
    id: 'nav-leads',
    type: 'navigation',
    label: 'Leads',
    description: 'Gérer les leads',
    path: '/admin/leads',
    keywords: ['leads', 'prospects', 'contacts'],
    category: 'Navigation',
  },
  {
    id: 'nav-formations',
    type: 'navigation',
    label: 'Formations',
    description: 'Gérer les formations et modules',
    path: '/admin/formations',
    keywords: ['formations', 'modules', 'courses', 'training'],
    category: 'Navigation',
  },
  {
    id: 'nav-paiements',
    type: 'navigation',
    label: 'Paiements',
    description: 'Voir les paiements et transactions',
    path: '/admin/paiements',
    keywords: ['paiements', 'payments', 'transactions', 'revenus'],
    category: 'Navigation',
  },
  {
    id: 'nav-analytiques',
    type: 'navigation',
    label: 'Analytiques',
    description: 'Statistiques et métriques',
    path: '/admin/analytiques',
    keywords: ['analytiques', 'analytics', 'stats', 'statistiques'],
    category: 'Navigation',
  },
  {
    id: 'nav-contenu',
    type: 'navigation',
    label: 'Contenu',
    description: 'Gérer le contenu',
    path: '/admin/contenu',
    keywords: ['contenu', 'content'],
    category: 'Navigation',
  },
  {
    id: 'nav-videos',
    type: 'navigation',
    label: 'Vidéos',
    description: 'Gérer les vidéos',
    path: '/admin/videos',
    keywords: ['videos', 'vidéos', 'media'],
    category: 'Navigation',
  },
  {
    id: 'nav-challenges',
    type: 'navigation',
    label: 'Défis',
    description: 'Gérer les défis',
    path: '/admin/challenges',
    keywords: ['challenges', 'défis', 'challenges'],
    category: 'Navigation',
  },
  {
    id: 'nav-preview',
    type: 'navigation',
    label: 'Vue Client',
    description: 'Prévisualiser la vue client',
    path: '/admin/preview',
    keywords: ['preview', 'vue client', 'client view'],
    category: 'Navigation',
  },
  {
    id: 'nav-settings',
    type: 'navigation',
    label: 'Paramètres',
    description: 'Paramètres de l\'administration',
    path: '/admin/settings',
    keywords: ['settings', 'paramètres', 'config'],
    category: 'Navigation',
  },
];

export async function searchCommandPalette(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    // Si pas de query, retourner les items de navigation
    return [
      {
        category: 'Navigation',
        items: navigationItems,
      },
    ];
  }

  // Recherche dans la navigation
  const navMatches = navigationItems.filter((item) =>
    item.keywords.some((keyword) => keyword.includes(lowerQuery)) ||
    item.label.toLowerCase().includes(lowerQuery) ||
    item.description?.toLowerCase().includes(lowerQuery)
  );

  if (navMatches.length > 0) {
    results.push({
      category: 'Navigation',
      items: navMatches,
    });
  }

  // Recherche dans les données (utilisateurs, leads, modules, etc.)
  try {
    // Recherche utilisateurs
    const profiles = await listProfiles();
    const userMatches = profiles
      .filter(
        (p) =>
          p.email?.toLowerCase().includes(lowerQuery) ||
          p.full_name?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .map(
        (p): CommandPaletteItem => ({
          id: `user-${p.id}`,
          type: 'search-result',
          label: p.full_name || p.email || 'Utilisateur',
          description: p.email,
          path: `/admin/users?search=${encodeURIComponent(p.email || '')}`,
          keywords: [p.email || '', p.full_name || ''],
          category: 'Utilisateurs',
        })
      );

    if (userMatches.length > 0) {
      results.push({
        category: 'Utilisateurs',
        items: userMatches,
      });
    }

    // Recherche leads
    const leads = await listLeads();
    const leadMatches = leads
      .filter(
        (l) =>
          l.email?.toLowerCase().includes(lowerQuery) ||
          l.prenom?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .map(
        (l): CommandPaletteItem => ({
          id: `lead-${l.id}`,
          type: 'search-result',
          label: l.prenom ? `${l.prenom} (${l.email})` : l.email,
          description: `Lead - ${l.statut}`,
          path: `/admin/leads?search=${encodeURIComponent(l.email)}`,
          keywords: [l.email, l.prenom || ''],
          category: 'Leads',
        })
      );

    if (leadMatches.length > 0) {
      results.push({
        category: 'Leads',
        items: leadMatches,
      });
    }

    // Recherche modules
    const modules = await getModules({ includeInactive: true });
    const moduleMatches = modules
      .filter(
        (m) =>
          m.title?.toLowerCase().includes(lowerQuery) ||
          m.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .map(
        (m): CommandPaletteItem => ({
          id: `module-${m.id}`,
          type: 'search-result',
          label: m.title,
          description: m.description || 'Module de formation',
          path: `/admin/formations?search=${encodeURIComponent(m.title)}`,
          keywords: [m.title, m.description || ''],
          category: 'Formations',
        })
      );

    if (moduleMatches.length > 0) {
      results.push({
        category: 'Formations',
        items: moduleMatches,
      });
    }
  } catch (error) {
    console.error('[commandPaletteService] Erreur lors de la recherche:', error);
  }

  return results;
}

export function getRecentSearches(): string[] {
  const stored = localStorage.getItem('admin-command-palette-recent');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  const recent = getRecentSearches();
  const updated = [query, ...recent.filter((q) => q !== query)].slice(0, 5);
  localStorage.setItem('admin-command-palette-recent', JSON.stringify(updated));
}

