import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { getLicenseStatus } from '../services/licenseService';

export default function ScammerWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const license = await getLicenseStatus();
        
        if (!license) {
          setIsLoading(false);
          return;
        }

        // Vérifier si le paiement a été validé (auto_renewal_enabled = true)
        // Si oui, ne jamais afficher le message
        if (license.auto_renewal_enabled) {
          setShowWarning(false);
          setIsLoading(false);
          return;
        }

        // Vérifier si on est après le 26 décembre 2025
        // Le message s'affiche SEULEMENT si :
        // 1. On est après le 26 décembre 2025
        // 2. Le paiement n'a pas été validé (auto_renewal_enabled = false)
        const now = new Date();
        const deadline = new Date('2025-12-26T00:00:00'); // 26 décembre 2025 à 00h00 - DATE FIXE
        
        if (now >= deadline) {
          setShowWarning(true);
        }
      } catch (error: any) {
        // Gérer gracieusement les erreurs d'accès (RLS, CORS, etc.)
        // Ne pas afficher le warning si on ne peut pas vérifier la licence
        console.warn('Impossible de vérifier la licence (accès restreint):', error?.message || error);
        setShowWarning(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLicense();
  }, []);

  if (isLoading || !showWarning) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-2xl animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center gap-4">
          <AlertTriangle className="w-8 h-8 flex-shrink-0 animate-pulse" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center uppercase tracking-wide">
            ⚠️ ATTENTION SCAMMEUR ⚠️
          </h1>
        </div>
      </div>
    </div>
  );
}

