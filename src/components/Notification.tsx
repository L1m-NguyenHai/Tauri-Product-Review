import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  autoClose?: boolean;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose, autoClose = true }) => {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [onClose, autoClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${getStyles()} shadow-lg max-w-md`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Hook to manage notifications
export const useNotification = () => {
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const NotificationComponent = notification ? (
    <Notification
      type={notification.type}
      message={notification.message}
      onClose={hideNotification}
    />
  ) : null;

  return {
    showNotification,
    hideNotification,
    NotificationComponent
  };
};

export default Notification;