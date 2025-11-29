/**
 * ExpertContact - Module discret de contact pour consulting IA & automatisation
 * 
 * Composant minimaliste, non intrusif, pour permettre aux utilisateurs
 * de contacter Clément pour des services de consulting.
 * 
 * Variantes :
 * - "compact" : Pour la sidebar (une ligne avec icône)
 * - "expanded" : Pour les pages (section avec description)
 */

import { Sparkles } from 'lucide-react';
import { memo } from 'react';
import clsx from 'clsx';

const CONTACT_EMAIL = 'clement.ia.consulting@gmail.com';
const MAILTO_LINK = `mailto:${CONTACT_EMAIL}`;

interface ExpertContactProps {
  variant?: 'compact' | 'expanded';
  className?: string;
}

function ExpertContact({ variant = 'compact', className }: ExpertContactProps) {
  if (variant === 'compact') {
    return (
      <a
        href={MAILTO_LINK}
        className={clsx(
          'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300',
          'opacity-70 hover:opacity-100',
          'hover:bg-purple-500/10',
          className
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-purple-500/20 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/20">
          <Sparkles className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 group-hover:text-purple-300 transition-colors truncate">
            Besoin d'un expert IA ?
          </p>
          <p className="text-[10px] text-gray-500 group-hover:text-purple-400/70 transition-colors truncate">
            {CONTACT_EMAIL}
          </p>
        </div>
      </a>
    );
  }

  // Variant expanded - pour les pages
  return (
    <div
      className={clsx(
        'rounded-xl bg-white/[0.02] border border-white/5 p-5 transition-all duration-300',
        'hover:border-purple-500/20 hover:bg-purple-500/[0.03]',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="text-sm font-semibold text-white/90">
            Support avancé
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Si tu cherches à mettre en place de l'IA ou des automatisations, tu peux me contacter.
          </p>
          <a
            href={MAILTO_LINK}
            className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors group"
          >
            <span>{CONTACT_EMAIL}</span>
            <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default memo(ExpertContact);

