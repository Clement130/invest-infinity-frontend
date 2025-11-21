import { Shield, Calendar, Clock, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { useLicenseValidation } from '../../hooks/useLicenseValidation';

// Fonction simple pour formater les dates
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} à ${hours}:${minutes}`;
}

function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function LicenseStatusWidget() {
  const { licenseStatus, isLoading, validatePayment, isValidating } = useLicenseValidation();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!licenseStatus) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-medium">Impossible de charger le statut de la licence</p>
        </div>
      </div>
    );
  }

  const { is_active, last_payment_date, daysRemaining, nextPaymentDate, adminStatus } = licenseStatus;

  // Déterminer le badge d'alerte
  const getAlertBadge = () => {
    if (daysRemaining > 7) {
      return {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        text: `Paiement dans ${daysRemaining} jours`,
      };
    } else if (daysRemaining > 3) {
      return {
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        text: `⚠️ Paiement dans ${daysRemaining} jours`,
      };
    } else if (daysRemaining > 0) {
      return {
        color: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
        text: `🔴 Paiement urgent dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
      };
    } else {
      return {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        text: '🔴 Paiement en retard',
      };
    }
  };

  const alertBadge = getAlertBadge();
  const borderColor = is_active ? 'border-green-500/30' : 'border-red-500/30';
  const bgColor = is_active ? 'bg-green-500/10' : 'bg-red-500/10';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-6 space-y-6`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Protection Développeur</h2>
            <p className="text-sm text-gray-400">Gestion des paiements mensuels</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {is_active ? '✅ ACTIF' : '🔴 INACTIF'}
        </div>
      </div>

      {/* Badge d'alerte */}
      {is_active && daysRemaining <= 28 && (
        <div className={`px-4 py-2 rounded-lg border ${alertBadge.color} text-sm font-medium text-center`}>
          {alertBadge.text}
        </div>
      )}

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dernier paiement */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-black/40 border border-white/10">
          <Calendar className="w-5 h-5 text-purple-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">Dernier paiement</p>
            <p className="text-white font-medium">
              {formatDate(last_payment_date)}
            </p>
          </div>
        </div>

        {/* Prochain paiement */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-black/40 border border-white/10">
          <Clock className="w-5 h-5 text-purple-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">Prochain paiement attendu</p>
            <p className="text-white font-medium">
              {formatDateShort(nextPaymentDate)}
            </p>
          </div>
        </div>

        {/* Jours restants */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-black/40 border border-white/10">
          <Clock className="w-5 h-5 text-purple-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">Jours restants</p>
            <p className="text-white font-medium text-2xl">{daysRemaining}</p>
            {/* Barre de progression */}
            <div className="mt-2 w-full bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  daysRemaining > 7 ? 'bg-green-500' : daysRemaining > 3 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Statut admin client */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-black/40 border border-white/10">
          {adminStatus === 'active' ? (
            <UserCheck className="w-5 h-5 text-green-400 mt-0.5" />
          ) : (
            <UserX className="w-5 h-5 text-red-400 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">Statut admin client</p>
            <p className={`font-medium ${adminStatus === 'active' ? 'text-green-400' : 'text-red-400'}`}>
              {adminStatus === 'active' ? '✅ Actif' : '🔴 Révoqué'}
            </p>
          </div>
        </div>
      </div>

      {/* Bouton de validation */}
      <div className="pt-4 border-t border-white/10">
        <button
          onClick={validatePayment}
          disabled={isValidating}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isValidating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Validation en cours...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              ✅ Valider le Paiement
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Cliquez pour valider le paiement reçu et réactiver la licence pour 30 jours
        </p>
      </div>
    </div>
  );
}

