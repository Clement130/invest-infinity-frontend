import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  UserPlus,
  CreditCard,
  AlertCircle,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';
import type { Notification } from '../../services/notificationsService';

const typeIcons = {
  lead: UserPlus,
  purchase: CreditCard,
  error: AlertCircle,
  info: Info,
};

const typeColors = {
  lead: 'text-blue-400 bg-blue-500/20',
  purchase: 'text-green-400 bg-green-500/20',
  error: 'text-red-400 bg-red-500/20',
  info: 'text-purple-400 bg-purple-500/20',
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const centerRef = useRef<HTMLDivElement>(null);

  // Fermer quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (centerRef.current && !centerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  if (!isOpen) return null;

  return (
    <div
      ref={centerRef}
      className="absolute right-0 mt-2 w-96 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1.5 rounded hover:bg-white/5 transition"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/5 transition"
            title="Fermer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune notification</p>
          </div>
        ) : (
          <>
            {unreadNotifications.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                  Non lues
                </div>
                {unreadNotifications.map((notification) => {
                  const Icon = typeIcons[notification.type];
                  const colorClass = typeColors[notification.type];

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition text-left group"
                    >
                      <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{notification.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.timestamp.toLocaleString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {notification.actionUrl && (
                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    </button>
                  );
                })}
              </div>
            )}

            {readNotifications.length > 0 && (
              <div className="p-2 border-t border-white/10">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                  Lues
                </div>
                {readNotifications.slice(0, 10).map((notification) => {
                  const Icon = typeIcons[notification.type];
                  const colorClass = typeColors[notification.type];

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition text-left opacity-60 group"
                    >
                      <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{notification.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {notification.actionUrl && (
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition flex-shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

