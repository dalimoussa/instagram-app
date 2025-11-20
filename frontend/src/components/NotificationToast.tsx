import { useNotificationStore } from '../store/notificationStore';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => {
        const Icon = {
          success: CheckCircle,
          error: XCircle,
          warning: AlertCircle,
          info: Info,
        }[notification.type];

        const bgColor = {
          success: 'bg-green-50 border-green-200',
          error: 'bg-red-50 border-red-200',
          warning: 'bg-yellow-50 border-yellow-200',
          info: 'bg-blue-50 border-blue-200',
        }[notification.type];

        const iconColor = {
          success: 'text-green-600',
          error: 'text-red-600',
          warning: 'text-yellow-600',
          info: 'text-blue-600',
        }[notification.type];

        return (
          <div
            key={notification.id}
            className={`${bgColor} border rounded-lg shadow-lg p-4 max-w-md flex items-start gap-3 animate-slide-in`}
          >
            <Icon className={`${iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
            <p className="flex-1 text-sm text-gray-800">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
