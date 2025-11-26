import React, { useState } from 'react';
import { X, Mail, User, Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomMuiTelInput } from './CustomMuiTelInput';
import { matchIsValidTel } from 'mui-tel-input';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { leadApi } from '../services/leadApi';
import { useToast } from '../hooks/useToast';

// Génère un mot de passe sécurisé temporaire
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'register';
  redirectTo?: 'client' | 'admin';
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

export default function AuthModal({ isOpen, onClose, type, redirectTo = 'client' }: AuthModalProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useAuth();
  const [telTouched, setTelTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    email: '',
    phone: '',
    budget: '',
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!loginData.email || !loginData.password) {
      setLoginError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(loginData.email, loginData.password);
      
      // Attendre un peu que le profil se charge
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoginError('Erreur lors de la connexion');
        return;
      }

      // Vérifier si l'utilisateur est admin ou développeur
      // Récupérer le profil pour vérifier le rôle
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
      }

      const isAdminOrDeveloper = profile?.role === 'admin' || profile?.role === 'developer';

      onClose();
      
      // Rediriger selon le contexte
      if (redirectTo === 'admin') {
        if (isAdminOrDeveloper) {
          navigate('/admin');
        } else {
          // Afficher un message d'erreur et rediriger vers la page d'accueil
          toast.error('Accès réservé aux administrateurs');
          navigate('/');
        }
      } else {
        // Redirection vers /app pour les clients
        toast.success('Connexion réussie !', { duration: 2000 });
        navigate('/app');
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      setLoginError(error?.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 1. Enregistrer le lead dans le CRM
      await leadApi.registerLead({
        boardId: 9406097805,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.phone,
        statut: 'Lead',
        capital: parseInt(formData.budget, 10),
        newsLetter: true,
      });

      // 2. Créer un compte Supabase avec mot de passe temporaire
      const tempPassword = generateTemporaryPassword();
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            prenom: formData.prenom,
            phone: formData.phone,
            capital: parseInt(formData.budget, 10),
          },
        },
      });

      if (signUpError) {
        // Si l'utilisateur existe déjà, on continue quand même vers la confirmation
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
          console.log('[AuthModal] Utilisateur déjà existant, redirection vers confirmation');
          localStorage.setItem('userEmail', formData.email);
          localStorage.setItem('userPrenom', formData.prenom);
          toast.info('Tu as déjà un compte ! Connecte-toi pour acheter.', { duration: 4000 });
          onClose();
          navigate('/confirmation');
          return;
        }
        throw signUpError;
      }

      // 3. Stocker les infos pour la page de confirmation
      // ⚠️ Utiliser sessionStorage pour les données sensibles (nettoyé à la fermeture du navigateur)
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userPrenom', formData.prenom);
      sessionStorage.setItem('tempPassword', tempPassword); // Temporaire, nettoyé à la fermeture

      // 4. Connecter automatiquement l'utilisateur si le compte est créé
      if (signUpData.user && signUpData.session) {
        // L'utilisateur est déjà connecté via signUp
        console.log('[AuthModal] Compte créé et utilisateur connecté automatiquement');
        toast.success('Compte créé avec succès ! 🎉', { duration: 2000 });
      } else if (signUpData.user && !signUpData.session) {
        // Email de confirmation requis - on essaie de se connecter directement
        // (si le projet Supabase n'a pas la confirmation email obligatoire)
        try {
          await signIn(formData.email, tempPassword);
          console.log('[AuthModal] Connexion automatique réussie');
          toast.success('Compte créé avec succès ! 🎉', { duration: 2000 });
        } catch (loginError) {
          // Si la connexion échoue (email non confirmé), on continue quand même
          console.log('[AuthModal] Connexion auto impossible, confirmation email requise');
          toast.info('Compte créé ! Vérifie tes emails pour te connecter.', { duration: 4000 });
        }
      }

      onClose();
      navigate('/confirmation');
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription :', error);
      setErrors((prev) => ({
        ...prev,
        budget: error?.message || 'Impossible de finaliser votre inscription pour le moment. Merci de réessayer plus tard.',
      }));
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
            {type === 'login' ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {redirectTo === 'admin' ? 'Connexion Admin' : 'Connexion'}
                </h2>
                <p className="text-gray-400 mb-6">
                  {redirectTo === 'admin' 
                    ? 'Accès réservé aux administrateurs' 
                    : 'Connecte-toi à ton espace client'}
                </p>

                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        disabled={isLoading}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        disabled={isLoading}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Votre mot de passe"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-100 text-sm px-3 py-2">
                      {loginError}
                    </div>
                  )}

                  {/* Bouton */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg py-3 px-4 font-medium hover:from-pink-500 hover:to-pink-800 transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      'Se connecter'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Accès Discord à la formation</h2>
                <p className="text-gray-400 mb-6">
                  Utilise tes coordonnées pour recevoir tes accès 🔐
                </p>

                <form onSubmit={handleRegister} className="space-y-6">
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
