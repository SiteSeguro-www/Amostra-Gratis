
import React from 'react';

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

export const getNotificationPermission = (): NotificationPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission as NotificationPermissionState;
};

export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

export const isNotificationActive = (): boolean => {
  return getNotificationPermission() === 'granted';
};

// Helper for components to reactively track permission
export const useNotificationStatus = () => {
  const [status, setStatus] = React.useState<NotificationPermissionState>(getNotificationPermission());

  React.useEffect(() => {
    const check = () => {
      const current = getNotificationPermission();
      if (current !== status) setStatus(current);
    };

    const interval = setInterval(check, 1000);
    window.addEventListener('focus', check);
    window.addEventListener('visibilitychange', check);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', check);
      window.removeEventListener('visibilitychange', check);
    };
  }, [status]);

  return status;
};
