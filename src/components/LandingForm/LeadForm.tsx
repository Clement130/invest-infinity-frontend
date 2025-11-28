import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Sparkles } from 'lucide-react';
import { CustomMuiTelInput } from '../CustomMuiTelInput';
import { matchIsValidTel } from 'mui-tel-input';
import TradingAccountCard from './TradingAccountCard';
import { leadApi } from '../../services/leadApi';

interface FormData {
  prenom: string;
  email: string;
  phone: string;
}

interface FormErrors {
  prenom?: string;
  email?: string;
  phone?: string;
}

const LeadForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    email: '',
    phone: '',
  });
  const [telTouched, setTelTouched] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const steps = [
    'Clique sur le bouton pour ouvrir un compte de trading',
    'Remplis tes informations sur le site du partenaire',
    'Valide ton email et connecte-toi à RaiseFX',
    'Profite de tes modules et alertes en temps réel',
  ];

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


  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (!allowedPrefixes.some(p => formData.phone.startsWith(p))) {
      newErrors.phone = 'Désolé, votre pays n’est pas encore pris en charge par InvestInfinity.';
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      const isPhoneValid = matchIsValidTel(formData.phone) && phoneDigits.length >= 11;
      if (!isPhoneValid) {
        newErrors.phone = 'Format de numéro invalide';
      }
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await leadApi.registerLead({
        boardId: 7669473566,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.phone,
        statut: 'Lead',
        newsLetter: true,
        capital: 0,
      });

      localStorage.setItem('userEmail', formData.email);
      setIsRegistered(true);
    } catch (err: any) {
      console.error(err);
      setErrors({
        email:
          err?.message ??
          "Erreur lors de l'enregistrement, merci de réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistered) {
    return <TradingAccountCard steps={steps} />;
  }

  return (
    <div id="lead-form" className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
      <div className="text-center mb-6">
        <h3 className="font-poppins font-bold text-xl lg:text-2xl text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Réserve ta place maintenant
        </h3>
        <p className="text-gray-600 text-sm lg:text-base">
          Un membre de notre équipe te contactera afin de te guider au mieux dans tes premiers pas en trading.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-2" />
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.prenom}
            onChange={e => handleInputChange('prenom', e.target.value)}
            className={`w-full px-4 py-3 lg:py-4 border-2 rounded-xl transition-all duration-200 focus:outline-none text-base text-gray-900 ${
              errors.prenom
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-200 focus:border-pink-500'
            }`}
            placeholder="Ton prénom"
          />
          {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline w-4 h-4 mr-2" />
            Adresse email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            className={`w-full px-4 py-3 lg:py-4 border-2 rounded-xl transition-all duration-200 focus:outline-none text-base text-gray-900 ${
              errors.email
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-200 focus:border-pink-500'
            }`}
            placeholder="ton@email.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline w-4 h-4 mr-2" />
            Numéro de téléphone <span className="text-red-500">*</span>
          </label>
          <CustomMuiTelInput
            colorMode="light"
            defaultCountry="FR"
            value={formData.phone}
            onChange={value => {
              setTelTouched(true);
              handleInputChange('phone', value);
            }}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: errors.phone ? '#FCA5A5' : '#e5e7eb',
                borderWidth: '2px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: errors.phone ? '#FCA5A5' : '#e5e7eb',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: errors.phone ? '#FCA5A5' : '#EF4444',
              },
            }}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>


        {/* CTA */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-poppins font-bold py-4 lg:py-5 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg text-base lg:text-lg"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Envoi en cours...
            </div>
          ) : (
            <span>Débloquer mon accès privé au Discord</span>
          )}
        </button>
        <p className="text-center text-xs text-gray-500">
           Tu créeras ton compte de trading à l’étape suivante, avant de pouvoir rejoindre le Discord.
        </p>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-100">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <span>           
                📞 Merci de remplir tes vraies infos pour qu’on puisse te contacter et t’ajouter au Discord.
              </span>
            </div>            
            <div className="flex items-center justify-center">
              <span className="text-blue-600 mr-2">🔒</span>
              <span>Données protégées, aucun spam</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LeadForm; 
