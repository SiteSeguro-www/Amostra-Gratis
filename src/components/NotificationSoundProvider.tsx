import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface NotificationSoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  browserNotificationsEnabled: boolean;
  setBrowserNotificationsEnabled: (enabled: boolean) => void;
  playSound: (type: 'like' | 'comment' | 'message' | 'order' | 'follow') => void;
}

const NotificationSoundContext = createContext<NotificationSoundContextType | undefined>(undefined);

export const NotificationSoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useAuthState(auth);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  
  const sounds = useRef<{ [key: string]: HTMLAudioElement }>({
    like: new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'),
    comment: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'),
    message: new Audio('https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3'),
    order: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
    follow: new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3'),
  });

  useEffect(() => {
    // Preload sounds and set volume with error handling
    Object.entries(sounds.current).forEach(([key, audio]) => {
      audio.volume = 0.4;
      audio.addEventListener('error', (e) => {
        console.warn(`Som de notificação '${key}' falhou ao carregar. Usando fallback silencioso.`);
      });
      audio.load();
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'user_settings', user.uid);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setSoundEnabled(data.soundEnabled !== false);
          setBrowserNotificationsEnabled(data.browserNotificationsEnabled === true);
        }
      } catch (error: any) {
        if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
          console.warn("Notification settings fetch suppressed due to quota");
          return;
        }
        console.error("Error fetching notification settings:", error);
      }
    };
    fetchSettings();
  }, [user]);

  const saveSettings = async (updates: any) => {
    if (!user) return;
    try {
      const settingsRef = doc(db, 'user_settings', user.uid);
      await setDoc(settingsRef, updates, { merge: true });
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  };

  const handleSetSoundEnabled = (enabled: boolean) => {
    setSoundEnabled(enabled);
    saveSettings({ soundEnabled: enabled });
  };

  useEffect(() => {
    // Solicitar permissão de notificação na primeira vez que o site abrir
    const requestInitialPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (error) {
          console.error("Error requesting initial notification permission:", error);
        }
      }
    };
    
    // Pequeno atraso para não bloquear a renderização inicial
    setTimeout(requestInitialPermission, 2000);
  }, []);

  const handleSetBrowserNotificationsEnabled = async (enabled: boolean) => {
    setBrowserNotificationsEnabled(enabled);
    saveSettings({ browserNotificationsEnabled: enabled });

    if (enabled) {
      if (!('Notification' in window)) {
        console.warn('Este navegador não suporta notificações de desktop.');
        return;
      }
      
      try {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn('Permissão de notificação não concedida:', permission);
          }
        } else if (Notification.permission === 'denied') {
          alert('As notificações estão bloqueadas no seu navegador. Por favor, permita nas configurações do site (ícone de cadeado na barra de endereços).');
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    }
  };

  const playSound = React.useCallback((type: string) => {
    if (!soundEnabled || document.hidden) return;
    
    const audio = sounds.current[type] || sounds.current['follow'];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => {
        if (e.name === 'NotAllowedError') {
          // User hasn't interacted with the page yet, ignore the error silently
          console.warn(`Autoplay blocked for ${type} sound. User interaction required.`);
        } else {
          console.error(`Error playing ${type} sound:`, e);
        }
      });
    }
  }, [soundEnabled]);

  return (
    <NotificationSoundContext.Provider value={{
      soundEnabled,
      setSoundEnabled: handleSetSoundEnabled,
      browserNotificationsEnabled,
      setBrowserNotificationsEnabled: handleSetBrowserNotificationsEnabled,
      playSound
    }}>
      {children}
    </NotificationSoundContext.Provider>
  );
};

export const useNotificationSound = () => {
  const context = useContext(NotificationSoundContext);
  if (context === undefined) {
    throw new Error('useNotificationSound must be used within a NotificationSoundProvider');
  }
  return context;
};
