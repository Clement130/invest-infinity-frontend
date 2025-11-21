/**
 * Service pour gérer les paramètres de la plateforme
 */

import { supabase } from '../lib/supabaseClient';

export interface AppearanceSettings {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeText: string;
  footerText: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailTemplates {
  welcome: EmailTemplate;
  purchase: EmailTemplate;
  accessGranted: EmailTemplate;
}

export interface IntegrationSettings {
  stripe: {
    publicKey: string;
    secretKey: string;
  };
  bunnyStream: {
    libraryId: string;
    apiKey: string;
  };
  webhooks: {
    stripeUrl: string;
  };
}

export interface PlatformSettings {
  appearance: AppearanceSettings;
  email_templates: EmailTemplates;
  integrations: IntegrationSettings;
}

/**
 * Récupère tous les paramètres de la plateforme
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('key, value')
    .order('category');

  if (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    throw error;
  }

  // Transformer les données en objet
  const settings: Partial<PlatformSettings> = {};
  data?.forEach((item) => {
    if (item.key === 'appearance') {
      settings.appearance = item.value as AppearanceSettings;
    } else if (item.key === 'email_templates') {
      settings.email_templates = item.value as EmailTemplates;
    } else if (item.key === 'integrations') {
      settings.integrations = item.value as IntegrationSettings;
    }
  });

  // Valeurs par défaut si manquantes
  return {
    appearance: settings.appearance || {
      logoUrl: '',
      primaryColor: '#9333ea',
      secondaryColor: '#ec4899',
      welcomeText: 'Bienvenue sur InvestInfinity',
      footerText: '© 2024 InvestInfinity. Tous droits réservés.',
    },
    email_templates: settings.email_templates || {
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
    },
    integrations: settings.integrations || {
      stripe: { publicKey: '', secretKey: '' },
      bunnyStream: { libraryId: '', apiKey: '' },
      webhooks: { stripeUrl: '' },
    },
  };
}

/**
 * Met à jour les paramètres d'apparence
 */
export async function updateAppearanceSettings(
  settings: AppearanceSettings
): Promise<void> {
  const { error } = await supabase
    .from('platform_settings')
    .update({
      value: settings,
      updated_by: (await supabase.auth.getUser()).data.user?.id || null,
    })
    .eq('key', 'appearance');

  if (error) {
    console.error('Erreur lors de la mise à jour des paramètres d\'apparence:', error);
    throw error;
  }
}

/**
 * Met à jour les templates d'emails
 */
export async function updateEmailTemplates(
  templates: EmailTemplates
): Promise<void> {
  const { error } = await supabase
    .from('platform_settings')
    .update({
      value: templates,
      updated_by: (await supabase.auth.getUser()).data.user?.id || null,
    })
    .eq('key', 'email_templates');

  if (error) {
    console.error('Erreur lors de la mise à jour des templates d\'emails:', error);
    throw error;
  }
}

/**
 * Met à jour les paramètres d'intégrations
 */
export async function updateIntegrationSettings(
  settings: IntegrationSettings
): Promise<void> {
  const { error } = await supabase
    .from('platform_settings')
    .update({
      value: settings,
      updated_by: (await supabase.auth.getUser()).data.user?.id || null,
    })
    .eq('key', 'integrations');

  if (error) {
    console.error('Erreur lors de la mise à jour des paramètres d\'intégrations:', error);
    throw error;
  }
}

/**
 * Récupère un paramètre spécifique
 */
export async function getSetting<T = any>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error(`Erreur lors de la récupération du paramètre ${key}:`, error);
    throw error;
  }

  return data?.value as T | null;
}

