import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getNewNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getReadNotificationIds,
  saveNotifications,
  getStoredNotifications,
  type Notification,
} from '../services/notificationsService';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      // Charger les notifications sauvegardées
      const stored = getStoredNotifications();
      const readIds = getReadNotificationIds();

      // Récupérer les nouvelles notifications
      const newNotifications = await getNewNotifications();

      // Fusionner avec les notifications existantes
      const allNotifications = [...newNotifications, ...stored]
        .filter((n, index, self) => index === self.findIndex((m) => m.id === n.id))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50); // Limiter à 50 notifications

      // Marquer comme lues celles qui le sont déjà
      const notificationsWithReadStatus = allNotifications.map((n) => ({
        ...n,
        read: readIds.includes(n.id),
      }));

      setNotifications(notificationsWithReadStatus);
      saveNotifications(notificationsWithReadStatus);
    } catch (error) {
      console.error('[NotificationsContext] Erreur lors du chargement des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Charger les notifications au montage
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Polling toutes les 30 secondes pour les nouvelles notifications
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refresh: loadNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans NotificationsProvider');
  }
  return context;
}

