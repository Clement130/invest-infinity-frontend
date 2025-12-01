import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import GlassCard from '../components/ui/GlassCard';
import {
  User,
  Bell,
  Lock,
  Trash2,
  Save,
  Camera,
  Mail,
  Shield,
  Smartphone,
  Globe,
  Moon,
  Volume2,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  LogOut,
  Sparkles,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={clsx(
        'relative w-12 h-6 rounded-full transition-all duration-200',
        enabled ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-slate-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useSession();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: user?.email || '',
  });

  // Mettre à jour le formulaire quand le profil change
  useEffect(() => {
    if (profile?.full_name) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || '',
      }));
    }
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
      }));
    }
  }, [profile?.full_name, user?.email]);

  // Gérer l'upload de l'avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG, GIF ou WebP.');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image est trop volumineuse (max 2 Mo)');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Supprimer l'ancien avatar s'il existe
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload du nouveau fichier
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Erreur upload:', uploadError);
        toast.error('Erreur lors de l\'upload de l\'image');
        return;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Mettre à jour le profil avec la nouvelle URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erreur mise à jour profil:', updateError);
        toast.error('Erreur lors de la mise à jour du profil');
        return;
      }

      await refreshProfile();
      toast.success('Photo de profil mise à jour !');
    } catch (err) {
      console.error('Erreur inattendue:', err);
      toast.error('Une erreur est survenue');
    } finally {
      setIsUploadingAvatar(false);
      // Reset l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    newContent: true,
    challenges: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showProgress: true,
    showBadges: true,
  });

  const [preferences, setPreferences] = useState({
    darkMode: true,
    soundEffects: true,
    autoplay: false,
  });

  const handleSave = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour modifier votre profil');
      return;
    }

    // Vérifier si le nom a changé
    if (formData.fullName === profile?.full_name) {
      toast('Aucune modification détectée', { icon: 'ℹ️' });
      return;
    }

    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.fullName.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        toast.error('Erreur lors de la sauvegarde');
        return;
      }

      // Rafraîchir le profil dans le contexte
      await refreshProfile();
      toast.success('Profil mis à jour avec succès !');
    } catch (err) {
      console.error('Erreur inattendue:', err);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Utilisateur';

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Paramètres</h1>
            <p className="text-gray-400">Gérez votre compte et vos préférences</p>
          </div>
        </div>
      </motion.header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Profile Section */}
        <motion.section variants={itemVariants}>
          <GlassCard hover={false} glow="none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Profil</h2>
                <p className="text-sm text-gray-400">Vos informations personnelles</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  {/* Input file caché */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  
                  {/* Avatar cliquable */}
                  <label 
                    htmlFor="avatar-upload"
                    className={clsx(
                      "relative block w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20 overflow-hidden",
                      isUploadingAvatar ? "cursor-wait" : "cursor-pointer"
                    )}
                  >
                    {/* Image ou initiale */}
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    
                    {/* Overlay - toujours visible sur mobile, hover sur desktop */}
                    <span 
                      className={clsx(
                        "absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center transition-opacity",
                        isUploadingAvatar 
                          ? "opacity-100" 
                          : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      )}
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-white" />
                          <span className="text-[10px] text-white mt-1">Modifier</span>
                        </>
                      )}
                    </span>
                  </label>
                </div>
                <div>
                  <p className="text-white font-semibold">{profile?.full_name || 'Utilisateur'}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className={clsx(
                      "mt-2 text-sm text-pink-400 hover:text-pink-300 transition",
                      isUploadingAvatar ? "cursor-wait opacity-50" : "cursor-pointer"
                    )}
                  >
                    {isUploadingAvatar ? 'Chargement...' : 'Changer la photo'}
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 focus:outline-none text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Contactez le support pour changer votre email
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-shadow disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </>
                )}
              </motion.button>
            </div>
          </GlassCard>
        </motion.section>

        {/* Notifications Section */}
        <motion.section variants={itemVariants}>
          <GlassCard hover={false} glow="none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Notifications</h2>
                <p className="text-sm text-gray-400">Gérez vos préférences de notification</p>
              </div>
            </div>

            <div className="space-y-4">
              <SettingRow
                icon={Mail}
                title="Notifications par email"
                description="Recevez des emails pour les nouveaux contenus"
              >
                <ToggleSwitch
                  enabled={notifications.email}
                  onChange={(v) => setNotifications({ ...notifications, email: v })}
                />
              </SettingRow>

              <SettingRow
                icon={Smartphone}
                title="Notifications push"
                description="Recevez des notifications dans le navigateur"
              >
                <ToggleSwitch
                  enabled={notifications.push}
                  onChange={(v) => setNotifications({ ...notifications, push: v })}
                />
              </SettingRow>

              <SettingRow
                icon={Globe}
                title="Résumé hebdomadaire"
                description="Recevez un résumé de votre progression chaque semaine"
              >
                <ToggleSwitch
                  enabled={notifications.weekly}
                  onChange={(v) => setNotifications({ ...notifications, weekly: v })}
                />
              </SettingRow>

              <SettingRow
                icon={Bell}
                title="Nouveau contenu"
                description="Soyez notifié lorsque de nouvelles leçons sont disponibles"
              >
                <ToggleSwitch
                  enabled={notifications.newContent}
                  onChange={(v) => setNotifications({ ...notifications, newContent: v })}
                />
              </SettingRow>

              <SettingRow
                icon={Shield}
                title="Défis et événements"
                description="Notifications pour les défis et événements à venir"
              >
                <ToggleSwitch
                  enabled={notifications.challenges}
                  onChange={(v) => setNotifications({ ...notifications, challenges: v })}
                />
              </SettingRow>
            </div>
          </GlassCard>
        </motion.section>

        {/* Privacy Section */}
        <motion.section variants={itemVariants}>
          <GlassCard hover={false} glow="none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Confidentialité</h2>
                <p className="text-sm text-gray-400">Contrôlez la visibilité de vos données</p>
              </div>
            </div>

            <div className="space-y-4">
              <SettingRow
                icon={Eye}
                title="Profil visible"
                description="Permettre aux autres membres de voir votre profil"
              >
                <ToggleSwitch
                  enabled={privacy.profileVisible}
                  onChange={(v) => setPrivacy({ ...privacy, profileVisible: v })}
                />
              </SettingRow>

              <SettingRow
                icon={Check}
                title="Afficher la progression"
                description="Afficher votre progression dans les classements"
              >
                <ToggleSwitch
                  enabled={privacy.showProgress}
                  onChange={(v) => setPrivacy({ ...privacy, showProgress: v })}
                />
              </SettingRow>

              <SettingRow
                icon={Shield}
                title="Afficher les badges"
                description="Montrer vos badges sur votre profil public"
              >
                <ToggleSwitch
                  enabled={privacy.showBadges}
                  onChange={(v) => setPrivacy({ ...privacy, showBadges: v })}
                />
              </SettingRow>
            </div>
          </GlassCard>
        </motion.section>

        {/* Preferences Section */}
        <motion.section variants={itemVariants}>
          <GlassCard hover={false} glow="none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <Moon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Préférences</h2>
                <p className="text-sm text-gray-400">Personnalisez votre expérience</p>
              </div>
            </div>

            <div className="space-y-4">
              <SettingRow
                icon={Moon}
                title="Mode sombre"
                description="Toujours utiliser le thème sombre"
              >
                <ToggleSwitch
                  enabled={preferences.darkMode}
                  onChange={(v) => setPreferences({ ...preferences, darkMode: v })}
                  disabled
                />
              </SettingRow>

              <SettingRow
                icon={Volume2}
                title="Effets sonores"
                description="Jouer des sons pour les notifications et accomplissements"
              >
                <ToggleSwitch
                  enabled={preferences.soundEffects}
                  onChange={(v) => setPreferences({ ...preferences, soundEffects: v })}
                />
              </SettingRow>

              <SettingRow
                icon={Globe}
                title="Lecture automatique"
                description="Passer automatiquement à la leçon suivante"
              >
                <ToggleSwitch
                  enabled={preferences.autoplay}
                  onChange={(v) => setPreferences({ ...preferences, autoplay: v })}
                />
              </SettingRow>
            </div>
          </GlassCard>
        </motion.section>

        {/* Session Section */}
        <motion.section variants={itemVariants}>
          <GlassCard hover={false} glow="none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Session</h2>
                <p className="text-sm text-gray-400">Gérez votre connexion</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <LogOut className="w-5 h-5" />
              Se déconnecter
            </button>
          </GlassCard>
        </motion.section>

        {/* Support avancé - Consulting IA */}
        <motion.section variants={itemVariants}>
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 transition-all duration-300 hover:border-purple-500/20 hover:bg-purple-500/[0.03]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-base font-semibold text-white/90">
                  Support avancé
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Si tu cherches à mettre en place de l'IA ou des automatisations, tu peux me contacter.
                </p>
                <a
                  href="mailto:clement.ia.consulting@gmail.com"
                  className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors group"
                >
                  <span>clement.ia.consulting@gmail.com</span>
                  <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Danger Zone */}
        <motion.section variants={itemVariants}>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-400">Zone de danger</h2>
                <p className="text-sm text-red-400/70">Actions irréversibles</p>
              </div>
            </div>

            <p className="text-sm text-gray-400">
              La suppression de votre compte est irréversible. Toutes vos données, votre progression
              et vos badges seront définitivement supprimés.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer mon compte
            </motion.button>
          </div>
        </motion.section>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-slate-900 rounded-2xl border border-red-500/30 p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Supprimer le compte ?</h3>
                <p className="text-sm text-gray-400">Cette action est irréversible</p>
              </div>
            </div>

            <p className="text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos données seront
              définitivement perdues et ne pourront pas être récupérées.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
              <button className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all">
                Supprimer définitivement
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

interface SettingRowProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ icon: Icon, title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
