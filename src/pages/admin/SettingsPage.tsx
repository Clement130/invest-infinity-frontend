import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Palette, Mail, Globe, Image, X, MessageSquare, Play } from 'lucide-react';
import {
  getPlatformSettings,
  updateAppearanceSettings,
  updateEmailTemplates,
  updateIntegrationSettings,
  getChatbotApiKey,
  updateChatbotApiKey,
  type AppearanceSettings,
  type EmailTemplates,
  type IntegrationSettings,
} from '../../services/settingsService';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import LicenseStatusWidget from '../../components/admin/LicenseStatusWidget';
import { useDeveloperRole } from '../../hooks/useDeveloperRole';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'emails' | 'integrations' | 'chatbot'>('appearance');
  const { isDeveloper } = useDeveloperRole();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
        <p className="text-gray-400">Configurez votre plateforme</p>
      </div>

      {/* Widget Protection Développeur - Visible uniquement pour le développeur */}
      {isDeveloper && (
        <div>
          <LicenseStatusWidget />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto pb-1">
        {[
          { id: 'appearance', label: 'Apparence', icon: Palette },
          { id: 'emails', label: 'Emails', icon: Mail },
          { id: 'integrations', label: 'Intégrations', icon: Globe },
          { id: 'chatbot', label: 'Chatbot / IA', icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === id
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'appearance' && <AppearanceSettings />}
        {activeTab === 'emails' && <EmailSettings />}
        {activeTab === 'integrations' && <IntegrationSettings />}
        {activeTab === 'chatbot' && <ChatbotSettings />}
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const queryClient = useQueryClient();

  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => getPlatformSettings(),
  });

  const [settings, setSettings] = useState<AppearanceSettings>({
    logoUrl: '',
    primaryColor: '#9333ea',
    secondaryColor: '#ec4899',
    welcomeText: 'Bienvenue sur InvestInfinity',
    footerText: '© 2024 InvestInfinity. Tous droits réservés.',
  });

  // Charger les paramètres depuis Supabase
  useEffect(() => {
    if (allSettings?.appearance) {
      setSettings(allSettings.appearance);
    }
  }, [allSettings]);

  const saveMutation = useMutation({
    mutationFn: (data: AppearanceSettings) => updateAppearanceSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Paramètres d\'apparence sauvegardés');
    },
    onError: (error: Error) => {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-white">Personnalisation de l'interface</h2>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Logo de la plateforme
          </label>
          <div className="flex items-center gap-4">
            {settings.logoUrl && (
              <div className="relative">
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="w-24 h-24 object-contain rounded-lg border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, logoUrl: '' })}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex-1">
              <input
                type="url"
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="URL du logo"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Entrez l'URL de votre logo ou uploadez une image
              </p>
            </div>
          </div>
        </div>

        {/* Couleurs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Couleur principale
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="w-16 h-10 rounded-lg border border-white/10 cursor-pointer"
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Couleur secondaire
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="w-16 h-10 rounded-lg border border-white/10 cursor-pointer"
              />
              <input
                type="text"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Textes */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Texte d'accueil
          </label>
          <input
            type="text"
            value={settings.welcomeText}
            onChange={(e) => setSettings({ ...settings, welcomeText: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Texte du footer
          </label>
          <input
            type="text"
            value={settings.footerText}
            onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </form>
  );
}

function EmailSettings() {
  const queryClient = useQueryClient();

  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => getPlatformSettings(),
  });

  const [templates, setTemplates] = useState<EmailTemplates>({
    welcome: {
      subject: 'Bienvenue sur InvestInfinity !',
      body: 'Bonjour {{name}},\n\nBienvenue sur InvestInfinity ! Nous sommes ravis de vous compter parmi nous.\n\nCordialement,\nL\'équipe InvestInfinity',
    },
    purchase: {
      subject: 'Confirmation de votre achat',
      body: 'Bonjour {{name}},\n\nMerci pour votre achat de {{module}} !\n\nVous pouvez maintenant accéder à votre formation.\n\nCordialement,\nL\'équipe InvestInfinity',
    },
    accessGranted: {
      subject: 'Accès à une formation',
      body: 'Bonjour {{name}},\n\nVous avez maintenant accès à la formation : {{module}}\n\nCordialement,\nL\'équipe InvestInfinity',
    },
  });

  // Charger les templates depuis Supabase
  useEffect(() => {
    if (allSettings?.email_templates) {
      setTemplates(allSettings.email_templates);
    }
  }, [allSettings]);

  const [activeTemplate, setActiveTemplate] = useState<keyof EmailTemplates>('welcome');

  const saveMutation = useMutation({
    mutationFn: (data: EmailTemplates) => updateEmailTemplates(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Templates d\'emails sauvegardés');
    },
    onError: (error: Error) => {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(templates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-white">Templates d'emails</h2>

        {/* Template selector */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Sélectionner un template
          </label>
          <div className="flex gap-2">
            {Object.keys(templates).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTemplate(key as keyof typeof templates)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  activeTemplate === key
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {key === 'welcome' && 'Bienvenue'}
                {key === 'purchase' && 'Achat'}
                {key === 'accessGranted' && 'Accès accordé'}
              </button>
            ))}
          </div>
        </div>

        {/* Template editor */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Sujet
            </label>
            <input
              type="text"
              value={templates[activeTemplate].subject}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  [activeTemplate]: { ...templates[activeTemplate], subject: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Corps du message
            </label>
            <textarea
              rows={10}
              value={templates[activeTemplate].body}
              onChange={(e) =>
                setTemplates({
                  ...templates,
                  [activeTemplate]: { ...templates[activeTemplate], body: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Variables disponibles : {'{{name}}'}, {'{{module}}'}, {'{{email}}'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </form>
  );
}

function IntegrationSettings() {
  const queryClient = useQueryClient();

  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => getPlatformSettings(),
  });

  const [settings, setSettings] = useState<IntegrationSettings>({
    stripe: { publicKey: '', secretKey: '' },
    bunnyStream: { libraryId: '', apiKey: '' },
    webhooks: { stripeUrl: '' },
  });

  // Charger les paramètres depuis Supabase
  useEffect(() => {
    if (allSettings?.integrations) {
      setSettings(allSettings.integrations);
    }
  }, [allSettings]);

  const saveMutation = useMutation({
    mutationFn: (data: IntegrationSettings) => updateIntegrationSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Paramètres d\'intégrations sauvegardés');
    },
    onError: (error: Error) => {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white">Intégrations tierces</h2>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-white/10 bg-black/40">
          <h3 className="text-white font-medium mb-2">Stripe</h3>
          <p className="text-sm text-gray-400 mb-3">
            Configuration des clés API Stripe pour les paiements
          </p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Clé publique (pk_...)"
              value={settings.stripe.publicKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  stripe: { ...settings.stripe, publicKey: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white text-sm"
            />
            <input
              type="password"
              placeholder="Clé secrète (sk_...)"
              value={settings.stripe.secretKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  stripe: { ...settings.stripe, secretKey: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white text-sm"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-white/10 bg-black/40">
          <h3 className="text-white font-medium mb-2">Bunny Stream</h3>
          <p className="text-sm text-gray-400 mb-3">
            Configuration de l'API Bunny Stream pour les vidéos
          </p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Library ID"
              value={settings.bunnyStream.libraryId}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bunnyStream: { ...settings.bunnyStream, libraryId: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white text-sm"
            />
            <input
              type="password"
              placeholder="API Key"
              value={settings.bunnyStream.apiKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bunnyStream: { ...settings.bunnyStream, apiKey: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white text-sm"
            />
          </div>
        </div>

        <div className="p-4 rounded-lg border border-white/10 bg-black/40">
          <h3 className="text-white font-medium mb-2">Webhooks</h3>
          <p className="text-sm text-gray-400 mb-3">
            URLs des webhooks pour les événements Stripe
          </p>
          <input
            type="url"
            placeholder="https://votre-domaine.com/api/webhooks/stripe"
            value={settings.webhooks.stripeUrl}
            onChange={(e) =>
              setSettings({
                ...settings,
                webhooks: { ...settings.webhooks, stripeUrl: e.target.value },
              })
            }
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white text-sm"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer les configurations'}
        </button>
      </div>
    </form>
  );
}

function ChatbotSettings() {
  const [apiKey, setApiKey] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentKey } = useQuery({
    queryKey: ['chatbot-key'],
    queryFn: getChatbotApiKey,
  });

  useEffect(() => {
    if (currentKey) setApiKey(currentKey);
  }, [currentKey]);

  const saveMutation = useMutation({
    mutationFn: updateChatbotApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-key'] });
      toast.success('Clé API sauvegardée');
    },
    onError: (error: Error) => {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const handleTest = async () => {
    setIsTesting(true);
    setTestResponse('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Ceci est un test de connexion.' }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur inconnue');
      }
      
      const data = await response.json();
      setTestResponse(data.choices?.[0]?.message?.content || 'Réponse reçue, mais contenu vide.');
      toast.success('Test réussi !');
    } catch (e: any) {
      console.error(e);
      toast.error('Erreur test: ' + e.message);
      setTestResponse('Erreur: ' + e.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(apiKey);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          Configuration Chatbot
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Clé API OpenAI
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-400 transition"
              />
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Votre clé est stockée de manière sécurisée et n'est jamais exposée au client public.
            </p>
          </div>
        </div>
      </form>

      {/* Zone de test */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-green-400" />
          Test de connexion
        </h2>
        
        <p className="text-gray-400 text-sm mb-4">
          Cliquez ci-dessous pour vérifier que le chatbot peut bien communiquer avec OpenAI via votre configuration.
        </p>

        <button
          onClick={handleTest}
          disabled={isTesting || !apiKey}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Tester le chatbot
        </button>

        {testResponse && (
          <div className={`mt-4 p-4 rounded-lg border ${testResponse.startsWith('Erreur') ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-green-500/10 border-green-500/30 text-green-200'}`}>
            <p className="font-mono text-sm whitespace-pre-wrap">{testResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}
