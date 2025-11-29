/**
 * AdminContent – Conteneur principal du contenu admin
 * 
 * - Zone de contenu scrollable
 * - Padding responsive (mobile-first)
 * - Max-width contrôlé pour lisibilité desktop
 */

import { memo, type ReactNode } from 'react';

interface AdminContentProps {
  children: ReactNode;
  /** Mode pleine largeur (sans max-width) pour les tableaux larges */
  fullWidth?: boolean;
  /** Padding réduit pour les pages denses */
  compact?: boolean;
}

function AdminContent({ children, fullWidth = false, compact = false }: AdminContentProps) {
  return (
    <main
      className={`
        flex-1 overflow-auto bg-black
        ${compact ? 'p-3 sm:p-4 lg:p-5' : 'p-4 sm:p-5 lg:p-6'}
      `}
    >
      <div
        className={`
          mx-auto
          ${fullWidth ? 'max-w-full' : 'max-w-7xl'}
        `}
      >
        {children}
      </div>
    </main>
  );
}

export default memo(AdminContent);

