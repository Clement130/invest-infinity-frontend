import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';

export default function NotificationBadge() {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return (
      <div className="relative">
        <Bell className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-gray-400" />
      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </div>
  );
}

