/**
 * Modal de Demande de Retrait
 * 
 * Permet à l'utilisateur de :
 * - Saisir le montant à retirer
 * - Entrer son IBAN (avec validation)
 * - Confirmer la demande
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  requestWithdrawal,
  getSavedIban,
  validateIbanFormat,
  formatIban,
  MINIMUM_WITHDRAWAL,
} from '../../services/referralService';
import {
  X,
  Euro,
  CreditCard,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
} from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => void;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
  availableBalance,
  onSuccess,
}: WithdrawalModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [amount, setAmount] = useState(availableBalance.toFixed(2));
  const [iban, setIban] = useState('');
  const [ibanHolderName, setIbanHolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ibanError, setIbanError] = useState<string | null>(null);

  // Charger l'IBAN sauvegardé
  useEffect(() => {
    if (user?.id && isOpen) {
      getSavedIban(user.id).then(({ iban: savedIban, holderName }) => {
        if (savedIban) setIban(formatIban(savedIban));
        if (holderName) setIbanHolderName(holderName);
      });
    }
  }, [user?.id, isOpen]);

  // Réinitialiser à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setAmount(availableBalance.toFixed(2));
      setError(null);
      setIbanError(null);
    }
  }, [isOpen, availableBalance]);

  const handleIbanChange = (value: string) => {
    // Formater automatiquement l'IBAN
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setIban(formatted);
    setIbanError(null);
  };

  const validateForm = (): boolean => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount < MINIMUM_WITHDRAWAL) {
      setError(`Montant minimum : ${MINIMUM_WITHDRAWAL}€`);
      return false;
    }

    if (numAmount > availableBalance) {
      setError('Montant supérieur au solde disponible');
      return false;
    }

    const cleanIban = iban.replace(/\s/g, '');
    if (!validateIbanFormat(cleanIban)) {
      setIbanError('Format IBAN invalide');
      return false;
    }

    if (!ibanHolderName || ibanHolderName.trim().length < 2) {
      setError('Veuillez entrer le nom du titulaire du compte');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    setError(null);
    setIbanError(null);

    if (!validateForm()) return;

    if (step === 'form') {
      setStep('confirm');
      return;
    }

    setIsLoading(true);

    const result = await requestWithdrawal(
      user.id,
      parseFloat(amount),
      iban.replace(/\s/g, ''),
      ibanHolderName.trim()
    );

    setIsLoading(false);

    if (result.success) {
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } else {
      setError(result.error || 'Erreur lors de la demande');
      setStep('form');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Euro className="w-5 h-5 text-green-400" />
              Demande de retrait
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'success' ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Demande envoyée !
                </h3>
                <p className="text-gray-400">
                  Votre demande de retrait de {parseFloat(amount).toFixed(2)}€ a été enregistrée.
                  Vous recevrez un email de confirmation.
                </p>
              </motion.div>
            ) : step === 'confirm' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">Vous allez demander un retrait de</p>
                  <p className="text-4xl font-bold text-green-400">
                    {parseFloat(amount).toFixed(2)}€
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">IBAN</span>
                    <span className="text-white font-mono text-sm">{iban}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Titulaire</span>
                    <span className="text-white">{ibanHolderName}</span>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-200">
                    Le virement sera effectué sous 48-72h ouvrées après validation par notre équipe.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirmer
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Montant à retirer
                  </label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError(null);
                      }}
                      min={MINIMUM_WITHDRAWAL}
                      max={availableBalance}
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                      placeholder={`Min. ${MINIMUM_WITHDRAWAL}€`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Disponible : {availableBalance.toFixed(2)}€
                  </p>
                </div>

                {/* IBAN */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    IBAN
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={iban}
                      onChange={(e) => handleIbanChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-1 ${
                        ibanError
                          ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
                          : 'border-white/10 focus:border-green-500/50 focus:ring-green-500/50'
                      }`}
                      placeholder="FR76 1234 5678 9012 3456 7890 123"
                    />
                  </div>
                  {ibanError && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {ibanError}
                    </p>
                  )}
                </div>

                {/* Nom du titulaire */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom du titulaire
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={ibanHolderName}
                      onChange={(e) => {
                        setIbanHolderName(e.target.value);
                        setError(null);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/25 transition-all"
                >
                  Continuer
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

