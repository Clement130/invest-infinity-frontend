import React, { useState } from 'react';
import { X, Mail, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomMuiTelInput } from './CustomMuiTelInput';
import { matchIsValidTel } from 'mui-tel-input';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'register';
}

interface FormData {
  prenom: string;
  email: string;
  phone: string;
  budget: string;
}

interface FormErrors {
  phone?: string;
  budget?: string;
}

export default function AuthModal({ isOpen, onClose, type }: AuthModalProps) {
  const navigate = useNavigate();
  const [telTouched, setTelTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    email: '',
    phone: '',
    budget: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'budget') {
      // n’accepter que les chiffres
      newValue = value.replace(/[^0-9]/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // === Validation du téléphone ===
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else {
      const allowedPrefixes = [
        '+33',  // France
        '+32',  // Belgique
        '+352', // Luxembourg
        '+41',  // Suisse
        '+590', // Guadeloupe
        '+596', // Martinique
        '+594', // Guyane française
        '+262', // La Réunion
      ];
      if (!allowedPrefixes.some(p => formData.phone.startsWith(p))) {
        newErrors.phone = 'Désolé, votre pays n’est pas encore pris en charge par investinfinity.';
      } else {
        const phoneDigits = formData.phone.replace(/\D/g, '');
        const isPhoneValid = matchIsValidTel(formData.phone) && phoneDigits.length >= 11;
        if (!isPhoneValid) {
          newErrors.phone = 'Format de numéro invalide';
        }
      }
    }

    // === Validation du budget ===
    if (!formData.budget) {
      newErrors.budget = 'Le capital prévu est requis';
    } else {
      const budgetNumber = parseInt(formData.budget, 10);
      if (isNaN(budgetNumber)) {
        newErrors.budget = 'Format de montant invalide';
      } else if (budgetNumber < 200) {
        newErrors.budget = 'Le dépôt minimum est de 200€ (nous conseillons 500€ ou plus).';
      } else if (budgetNumber > 100000) {
        newErrors.budget = 'Merci d’indiquer un montant réaliste pour démarrer.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const requestBody = {
        boardId: 9406097805,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.phone,
        statut: 'Lead',
        capital: formData.budget,
        newsLetter: true,
      };

      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        localStorage.setItem('userEmail', formData.email);
        onClose();
        navigate('/trading-account');
      } else {
        console.error('Erreur API:', await response.text());
      }
    } catch (error) {
      console.error('Erreur lors de la requête :', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh]">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg blur opacity-75" />
        <div className="relative bg-black rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Accès Discord à la formation</h2>
            <p className="text-gray-400 mb-6">
              Utilise tes coordonnées pour recevoir tes accès 🔐
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prénom</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Numéro de téléphone
                  </label>
                  <CustomMuiTelInput
                    value={formData.phone}
                    onChange={(value) => {
                      setTelTouched(true);
                      setFormData(prev => ({ ...prev, phone: value }));
                      if (errors.phone) {
                        setErrors(prev => ({ ...prev, phone: undefined }));
                      }
                    }}
                    onBlur={() => setTelTouched(true)}
                    defaultCountry="FR"
                    disabled={isLoading}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: errors.phone ? '#FCA5A5' : '#2d2d2d',
                        borderWidth: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: errors.phone ? '#FCA5A5' : '#2d2d2d',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: errors.phone ? '#FCA5A5' : '#EF4444',
                      },
                    }}
                  />
                  {telTouched && errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Capital actuel prévu pour le trading <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    placeholder="Montant en €"
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {errors.budget && (
                    <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
                  )}
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg py-3 px-4 font-medium hover:from-pink-500 hover:to-pink-800 transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
