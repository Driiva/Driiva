import { useEffect, useRef, useCallback, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import app, { isFirebaseConfigured } from '@/lib/firebase';
import { addFcmToken } from '@/lib/firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

interface UsePushNotificationsOptions {
  userId: string | null;
  onForegroundMessage?: (payload: { title: string; body: string }) => void;
}

interface PushNotificationState {
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  loading: boolean;
}

export function usePushNotifications({ userId, onForegroundMessage }: UsePushNotificationsOptions): PushNotificationState & { requestPermission: () => Promise<void> } {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);
  const messagingRef = useRef<Messaging | null>(null);
  const onForegroundRef = useRef(onForegroundMessage);
  onForegroundRef.current = onForegroundMessage;

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (swRegRef.current) return swRegRef.current;
    if (!('serviceWorker' in navigator)) return null;

    try {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      swRegRef.current = reg;

      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      if (reg.active) {
        reg.active.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
      } else {
        reg.addEventListener('activate', () => {
          reg.active?.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
        });
      }

      return reg;
    } catch (err) {
      console.warn('[Push] SW registration failed:', err);
      return null;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isFirebaseConfigured || !app || !userId) return;
    if (!('Notification' in window)) return;

    setLoading(true);
    try {
      const supported = await isSupported();
      if (!supported) {
        setPermission('unsupported');
        return;
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return;

      const swReg = await registerServiceWorker();
      if (!swReg) return;

      if (!messagingRef.current) {
        messagingRef.current = getMessaging(app);
      }

      const fcmToken = await getToken(messagingRef.current, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (fcmToken) {
        setToken(fcmToken);
        await addFcmToken(userId, fcmToken);
      }

      onMessage(messagingRef.current, (payload) => {
        onForegroundRef.current?.({
          title: payload.notification?.title || 'Driiva',
          body: payload.notification?.body || '',
        });
      });
    } catch (err) {
      console.warn('[Push] requestPermission error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, registerServiceWorker]);

  useEffect(() => {
    if (permission === 'granted' && userId && isFirebaseConfigured) {
      requestPermission();
    }
  }, [permission, userId]);

  return { permission, token, loading, requestPermission };
}
