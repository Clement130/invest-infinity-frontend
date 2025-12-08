import React, { useState, useLayoutEffect, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  User,
  Mail,
  Phone,
  FileText,
  Bot,
  Zap
} from 'lucide-react';

// ============================================
// Icônes SVG personnalisées pour les réseaux sociaux
// ============================================
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// ============================================
// Types
// ============================================
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

// ============================================
// Constantes
// ============================================
const SUBJECTS = [
  { value: '', label: 'Sélectionne un sujet' },
  { value: 'offres', label: 'Question sur les offres' },
  { value: 'bootcamp', label: 'Bootcamp / Immersion Élite' },
  { value: 'support', label: 'Support technique' },
  { value: 'partenariat', label: 'Partenariat' },
  { value: 'autre', label: 'Autre' },
];

// URL de l'API de contact (Edge Function Supabase)
// TODO: Remplacez par votre URL de fonction Edge Supabase
const CONTACT_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact`;

// Liens sociaux
const SOCIAL_LINKS = [
  { 
    name: 'Discord', 
    href: 'https://discord.gg/Y9RvKDCrWH',
    icon: DiscordIcon,
    color: 'hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/50'
  },
  { 
    name: 'Instagram', 
    href: 'https://www.instagram.com/investinfinity_fr/',
    icon: InstagramIcon,
    color: 'hover:bg-pink-500/20 hover:text-pink-400 hover:border-pink-500/50'
  },
  { 
    name: 'Telegram', 
    href: 'https://t.me/investinfinity', // TODO: Remplacer par votre lien Telegram
    icon: TelegramIcon,
    color: 'hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/50'
  },
];

// ============================================
// Composant Principal
// ============================================
export default function ContactPage() {
  // Scroll en haut au chargement
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const scrollToTop = () => window.scrollTo(0, 0);
    scrollToTop();
    const timeout = setTimeout(scrollToTop, 50);
    return () => clearTimeout(timeout);
  }, []);

  // State du formulaire
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validation du nom
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation du message
    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion du changement des champs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          subject: formData.subject || undefined,
          message: formData.message.trim(),
          source: 'contact_page',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de l\'envoi du message');
      }

      setStatus('success');
      // Réinitialiser le formulaire après succès
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });

    } catch (error) {
      console.error('Erreur contact:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Une erreur est survenue, réessaie dans quelques minutes.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      {/* Header avec dégradés */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Dégradés d'arrière-plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full filter blur-[150px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 mb-8">
              <MessageSquare className="w-5 h-5 text-pink-400" />
              <span className="text-pink-200 font-medium text-sm sm:text-base">Contact</span>
            </div>

            {/* Titre avec gradient */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-500 to-violet-500">
                Parler avec l'équipe Invest Infinity
              </span>
            </h1>

            {/* Sous-titre */}
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Tu as une question sur les offres, le Bootcamp ou ta situation en trading ? 
              On est là pour t'aider.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contenu principal - 2 colonnes */}
      <section className="relative pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            
            {/* Colonne gauche - Présentation coach (2/5) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="rounded-3xl bg-[#050816]/80 border border-white/5 p-6 lg:p-8 backdrop-blur-sm h-full">
                {/* Image coach */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-pink-500/30 shadow-lg shadow-pink-500/20">
                      {/* TODO: Remplacer par l'image du coach */}
                      <div className="w-full h-full bg-gradient-to-br from-pink-500/30 via-violet-500/30 to-purple-500/30 flex items-center justify-center">
                        <User className="w-16 h-16 text-pink-400/50" />
                      </div>
                    </div>
                    {/* Badge online */}
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-[#050816]" />
                  </div>
                </div>

                {/* Titre */}
                <h2 className="text-xl lg:text-2xl font-bold text-center mb-4 text-white">
                  Parler avec un coach Invest Infinity
                </h2>

                {/* Description */}
                <p className="text-gray-400 text-center text-sm lg:text-base mb-6 leading-relaxed">
                  On lit vraiment tous les messages. Dis-nous où tu en es et on t'oriente vers 
                  la meilleure solution pour toi (sans blabla ni bullshit).
                </p>

                {/* Réseaux sociaux */}
                <div className="flex justify-center gap-3 mb-8">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`
                        w-12 h-12 rounded-full 
                        bg-slate-800/50 border border-white/10
                        flex items-center justify-center
                        text-gray-400
                        transition-all duration-300
                        hover:scale-110
                        ${social.color}
                      `}
                      title={social.name}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>

                {/* Encart Chatbot */}
                <div className="border-t border-white/10 pt-6">
                  <div className="bg-gradient-to-br from-violet-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl p-5 border border-violet-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-violet-400" />
                      </div>
                      <h3 className="font-semibold text-white">Une question ? Demande à notre assistant !</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Notre chatbot est disponible 24h/24 pour répondre à toutes tes questions sur nos formations, le trading, et plus encore.
                    </p>
                    
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 
                        bg-gradient-to-r from-violet-500 to-pink-500 
                        text-white font-bold rounded-xl 
                        hover:scale-[1.02] transition-transform shadow-lg shadow-violet-500/20"
                    >
                      <Zap className="w-5 h-5" />
                      Discuter avec l'assistant
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Colonne droite - Formulaire (3/5) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-3"
            >
              <div className="rounded-3xl bg-[#050816]/80 border border-white/5 p-6 lg:p-8 backdrop-blur-sm">
                <h2 className="text-xl lg:text-2xl font-bold mb-6 text-white flex items-center gap-3">
                  <Send className="w-6 h-6 text-pink-400" />
                  Envoie-nous un message
                </h2>

                {/* Message de succès */}
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-start gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-400 font-semibold">Message envoyé avec succès !</p>
                      <p className="text-green-400/80 text-sm mt-1">
                        Merci, ton message a bien été envoyé. On revient vers toi rapidement 🔥
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Message d'erreur */}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                  >
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-semibold">Erreur d'envoi</p>
                      <p className="text-red-400/80 text-sm mt-1">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Ligne 1: Nom + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Nom */}
                    <div>
                      <label htmlFor="name" className="block text-sm text-slate-300 mb-2 font-medium">
                        Nom <span className="text-pink-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Ton nom"
                          className={`
                            w-full pl-12 pr-4 py-3.5 
                            bg-slate-800/50 border rounded-xl
                            text-white placeholder-gray-500
                            focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50
                            transition-all duration-300
                            ${errors.name ? 'border-red-500/50' : 'border-white/10'}
                          `}
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm text-slate-300 mb-2 font-medium">
                        Email <span className="text-pink-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="ton@email.com"
                          className={`
                            w-full pl-12 pr-4 py-3.5 
                            bg-slate-800/50 border rounded-xl
                            text-white placeholder-gray-500
                            focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50
                            transition-all duration-300
                            ${errors.email ? 'border-red-500/50' : 'border-white/10'}
                          `}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Ligne 2: Téléphone + Sujet */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Téléphone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm text-slate-300 mb-2 font-medium">
                        Téléphone <span className="text-gray-500">(optionnel)</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+33 6 12 34 56 78"
                          className="
                            w-full pl-12 pr-4 py-3.5 
                            bg-slate-800/50 border border-white/10 rounded-xl
                            text-white placeholder-gray-500
                            focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50
                            transition-all duration-300
                          "
                        />
                      </div>
                    </div>

                    {/* Sujet */}
                    <div>
                      <label htmlFor="subject" className="block text-sm text-slate-300 mb-2 font-medium">
                        Sujet <span className="text-gray-500">(optionnel)</span>
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="
                            w-full pl-12 pr-4 py-3.5 
                            bg-slate-800/50 border border-white/10 rounded-xl
                            text-white
                            focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50
                            transition-all duration-300
                            appearance-none cursor-pointer
                          "
                        >
                          {SUBJECTS.map((subject) => (
                            <option 
                              key={subject.value} 
                              value={subject.value}
                              className="bg-slate-800"
                            >
                              {subject.label}
                            </option>
                          ))}
                        </select>
                        {/* Chevron custom */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm text-slate-300 mb-2 font-medium">
                      Message <span className="text-pink-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Décris ta situation, tes objectifs ou ta question..."
                      className={`
                        w-full px-4 py-3.5 
                        bg-slate-800/50 border rounded-xl
                        text-white placeholder-gray-500
                        focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50
                        transition-all duration-300
                        resize-none
                        ${errors.message ? 'border-red-500/50' : 'border-white/10'}
                      `}
                    />
                    {errors.message && (
                      <p className="mt-1.5 text-sm text-red-400">{errors.message}</p>
                    )}
                  </div>

                  {/* Bouton d'envoi */}
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="
                      w-full py-4 px-6 
                      bg-gradient-to-r from-pink-500 to-violet-500 
                      text-white font-semibold text-lg
                      rounded-full
                      transition-all duration-300
                      hover:from-pink-600 hover:to-violet-600
                      hover:shadow-lg hover:shadow-pink-500/30
                      hover:scale-[1.02]
                      active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                      flex items-center justify-center gap-3
                    "
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Envoyer mon message</span>
                      </>
                    )}
                  </button>

                  {/* Note de confidentialité */}
                  <p className="text-center text-gray-500 text-xs">
                    En soumettant ce formulaire, tu acceptes que nous traitions tes données pour te recontacter.
                  </p>
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}

