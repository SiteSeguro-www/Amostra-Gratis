
export type NotificationPermissionState = 'default' | 'granted' | 'denied';

export const getNotificationPermission = (): NotificationPermissionState => {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission as NotificationPermissionState;
};

export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  if (!('Notification' in window)) return 'denied';
  
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
