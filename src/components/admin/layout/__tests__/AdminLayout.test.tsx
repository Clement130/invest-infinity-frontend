/**
 * Tests pour les composants de layout Admin
 * 
 * Ces tests vérifient :
 * - Le rendu correct des composants
 * - La présence des liens de navigation
 * - Le comportement responsive (mobile/desktop)
 * - L'accessibilité de base
 * 
 * Note: Les tests de AdminTopbar sont limités car il dépend de
 * NotificationsProvider et d'autres contextes complexes.
 * Les tests d'intégration E2E couvrent ces cas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminSidebar from '../AdminSidebar';
import AdminContent from '../AdminContent';

// Mock de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wrapper pour les tests avec Router
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le titre "Admin Panel"', () => {
    render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={vi.fn()} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('devrait afficher tous les groupes de navigation', () => {
    render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={vi.fn()} />
      </TestWrapper>
    );
    
    // Vérifier les titres de groupes (utiliser getAllByText car certains noms sont dupliqués)
    expect(screen.getByText('Général')).toBeInTheDocument();
    expect(screen.getAllByText('Utilisateurs').length).toBeGreaterThan(0); // Titre de groupe + lien
    expect(screen.getAllByText('Contenu').length).toBeGreaterThan(0); // Titre de groupe + lien
    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Système')).toBeInTheDocument();
  });

  it('devrait afficher les liens de navigation principaux', () => {
    render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={vi.fn()} />
      </TestWrapper>
    );
    
    // Vérifier les liens essentiels
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // Note: "Utilisateurs" apparaît dans le groupe ET comme lien
    expect(screen.getAllByText('Utilisateurs').length).toBeGreaterThan(0);
    expect(screen.getByText('Formations')).toBeInTheDocument();
    expect(screen.getByText('Vidéos')).toBeInTheDocument();
    expect(screen.getByText('Paiements')).toBeInTheDocument();
    expect(screen.getByText('Aide & Tutoriels')).toBeInTheDocument();
  });

  it('devrait marquer la section active avec aria-current', () => {
    render(
      <TestWrapper>
        <AdminSidebar activeSection="formations" isOpen={true} onClose={vi.fn()} />
      </TestWrapper>
    );
    
    const formationsButton = screen.getByText('Formations').closest('button');
    expect(formationsButton).toHaveAttribute('aria-current', 'page');
    
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).not.toHaveAttribute('aria-current');
  });

  it('devrait naviguer au clic sur un item', () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={onClose} />
      </TestWrapper>
    );
    
    fireEvent.click(screen.getByText('Formations'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin/formations');
    expect(onClose).toHaveBeenCalled(); // Ferme le drawer après navigation
  });

  it('devrait appeler onClose au clic sur le bouton fermer', () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={onClose} />
      </TestWrapper>
    );
    
    const closeButton = screen.getByLabelText('Fermer le menu');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('devrait appeler onClose au clic sur l\'overlay', () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={onClose} />
      </TestWrapper>
    );
    
    // L'overlay a aria-hidden="true"
    const overlay = document.querySelector('[aria-hidden="true"]');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('devrait afficher l\'indicateur de mode (dev/prod)', () => {
    render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={vi.fn()} />
      </TestWrapper>
    );
    
    // En mode test, c'est généralement "Développement"
    expect(screen.getByText(/Mode/)).toBeInTheDocument();
  });
});

describe('AdminContent', () => {
  it('devrait rendre les enfants correctement', () => {
    render(
      <AdminContent>
        <div data-testid="test-content">Contenu de test</div>
      </AdminContent>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Contenu de test')).toBeInTheDocument();
  });

  it('devrait avoir les classes de layout appropriées', () => {
    const { container } = render(
      <AdminContent>
        <div>Test</div>
      </AdminContent>
    );
    
    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('flex-1');
    expect(mainElement).toHaveClass('overflow-auto'); // Note: overflow-auto, pas overflow-y-auto
  });
});

// ============================================================================
// Tests d'intégration responsive
// ============================================================================
describe('Responsive behavior', () => {
  it('devrait avoir les classes responsive sur la sidebar', () => {
    const { container } = render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={false} onClose={vi.fn()} />
      </TestWrapper>
    );
    
    const sidebar = container.querySelector('aside');
    // Vérifier les classes responsive
    expect(sidebar?.className).toContain('lg:translate-x-0');
    expect(sidebar?.className).toContain('-translate-x-full');
  });

  it('devrait montrer la sidebar quand isOpen est true', () => {
    const { container } = render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={vi.fn()} />
      </TestWrapper>
    );
    
    const sidebar = container.querySelector('aside');
    expect(sidebar?.className).toContain('translate-x-0');
  });

  it('devrait avoir une taille de zone tactile minimale sur les boutons', () => {
    render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={vi.fn()} />
      </TestWrapper>
    );
    
    // Vérifier que les boutons de navigation ont la classe min-h-[44px]
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton?.className).toContain('min-h-[44px]');
  });
});

// ============================================================================
// Tests des routes admin
// ============================================================================
describe('Navigation routes', () => {
  it('devrait naviguer vers toutes les routes admin principales', () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <AdminSidebar activeSection="dashboard" isOpen={true} onClose={onClose} />
      </TestWrapper>
    );

    // Liste des routes à vérifier
    const routes = [
      { label: 'Dashboard', path: '/admin' },
      { label: 'Leads', path: '/admin/leads' },
      { label: 'Formations', path: '/admin/formations' },
      { label: 'Vidéos', path: '/admin/videos' },
      { label: 'Paiements', path: '/admin/paiements' },
      { label: 'Analytiques', path: '/admin/analytiques' },
      { label: 'Vue Client', path: '/admin/preview' },
      { label: 'Paramètres', path: '/admin/settings' },
      { label: 'Aide & Tutoriels', path: '/admin/help' },
    ];

    for (const route of routes) {
      vi.clearAllMocks();
      fireEvent.click(screen.getByText(route.label));
      expect(mockNavigate).toHaveBeenCalledWith(route.path);
    }
  });
});
