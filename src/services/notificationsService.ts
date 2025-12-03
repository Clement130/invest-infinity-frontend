/**
 * Service de gestion des notifications admin
 * Récupère les notifications en temps réel (nouveaux leads, paiements, etc.)
 */

import { listLeads } from './leadsService';
import { getPaymentsForAdmin, getLicenseLabel } from './purchasesService';

export type NotificationType = 'lead' | 'purchase' | 'error' | 'info';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};

let lastLeadCheck: Date | null = null;
let lastPurchaseCheck: Date | null = null;
let knownLeadIds = new Set<string>();
let knownPurchaseIds = new Set<string>();

/**
 * Récupère les nouvelles notifications depuis la dernière vérification
 */
export async function getNewNotifications(): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const now = new Date();

  try {
    // Vérifier les nouveaux leads (dernières 24h)
    const leads = await listLeads();
    const recentLeads = leads.filter((lead) => {
      if (!lead.created_at) return false;
      const leadDate = new Date(lead.created_at);
      const isRecent = now.getTime() - leadDate.getTime() < 24 * 60 * 60 * 1000; // 24h
      const isNew = !knownLeadIds.has(lead.id);
      if (isNew && isRecent) {
        knownLeadIds.add(lead.id);
        return true;
      }
      return false;
    });

    recentLeads.forEach((lead) => {
      notifications.push({
        id: `lead-${lead.id}`,
        type: 'lead',
        title: 'Nouveau lead',
        message: `${lead.prenom || lead.email} a rejoint la plateforme`,
        timestamp: new Date(lead.created_at),
        read: false,
        actionUrl: `/admin/leads?search=${encodeURIComponent(lead.email)}`,
        metadata: { leadId: lead.id, email: lead.email },
      });
    });

    // Vérifier les nouveaux paiements (dernières 24h)
    const payments = await getPaymentsForAdmin();
    const recentPayments = payments.filter((payment) => {
      if (!payment.created_at) return false;
      const paymentDate = new Date(payment.created_at);
      const isRecent = now.getTime() - paymentDate.getTime() < 24 * 60 * 60 * 1000; // 24h
      const isNew = !knownPurchaseIds.has(payment.id);
      if (isNew && isRecent && (payment.status === 'completed' || payment.status === 'pending_password')) {
        knownPurchaseIds.add(payment.id);
        return true;
      }
      return false;
    });

    recentPayments.forEach((payment) => {
      const amount = (payment.amount || 0) / 100;
      const licenseLabel = getLicenseLabel(payment.license_type);
      notifications.push({
        id: `payment-${payment.id}`,
        type: 'purchase',
        title: 'Nouveau paiement',
        message: `${licenseLabel} - €${amount.toFixed(2)}`,
        timestamp: new Date(payment.created_at),
        read: false,
        actionUrl: '/admin/paiements',
        metadata: { paymentId: payment.id, amount: payment.amount, license: payment.license_type },
      });
    });

    // Initialiser les sets si c'est la première fois
    if (lastLeadCheck === null) {
      leads.forEach((lead) => knownLeadIds.add(lead.id));
    }
    if (lastPurchaseCheck === null) {
      payments.forEach((p) => knownPurchaseIds.add(p.id));
    }

    lastLeadCheck = now;
    lastPurchaseCheck = now;
  } catch (error) {
    console.error('[notificationsService] Erreur lors de la récupération des notifications:', error);
  }

  return notifications;
}

/**
 * Réinitialise le cache des notifications (pour tests)
 */
export function resetNotificationCache(): void {
  lastLeadCheck = null;
  lastPurchaseCheck = null;
  knownLeadIds.clear();
  knownPurchaseIds.clear();
}

/**
 * Marque une notification comme lue
 */
export function markNotificationAsRead(notificationId: string): void {
  const stored = localStorage.getItem('admin-notifications-read');
  const readIds = stored ? JSON.parse(stored) : [];
  if (!readIds.includes(notificationId)) {
    readIds.push(notificationId);
    localStorage.setItem('admin-notifications-read', JSON.stringify(readIds));
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export function markAllNotificationsAsRead(): void {
  const stored = localStorage.getItem('admin-notifications');
  if (stored) {
    const notifications: Notification[] = JSON.parse(stored);
    const readIds = notifications.map((n) => n.id);
    localStorage.setItem('admin-notifications-read', JSON.stringify(readIds));
  }
}

/**
 * Récupère les IDs des notifications lues
 */
export function getReadNotificationIds(): string[] {
  const stored = localStorage.getItem('admin-notifications-read');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Sauvegarde les notifications dans le localStorage
 */
export function saveNotifications(notifications: Notification[]): void {
  localStorage.setItem('admin-notifications', JSON.stringify(notifications));
}

/**
 * Récupère les notifications sauvegardées
 */
export function getStoredNotifications(): Notification[] {
  const stored = localStorage.getItem('admin-notifications');
  if (!stored) return [];
  try {
    const notifications = JSON.parse(stored);
    return notifications.map((n: any) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  } catch {
    return [];
  }
}

