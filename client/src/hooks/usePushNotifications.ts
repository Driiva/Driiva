/**
 * usePushNotifications
 * ====================
 * Hook that handles FCM token registration and foreground notification display.
 *
 * Flow:
 *   1. Check Notification.permission
 *   2. If 'default', prompt the user
 *   3. If 'granted', get FCM token and store it on the user document
 *   4. Listen for foreground messages and surface via toast/callback
 *
 * Designed to be called once from a top-level component (e.g. Dashboard).
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app, { isFirebaseConfigured } from '@/lib/firebase';
import { addFcmToken } from '@/lib/firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export interface PushNotificationState {
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  loading: boolean;
}

export interface UsePushNotificationsOptions {
  userId: string | null;
  onForegroundMessage?: (payload: { title: string; body: string; data?: Record<string, string> }) => void;
}

export function usePushNotifications({ userId, onForegroundMessage }: UsePushNotificationsOptions): PushNotificationState & { requestPermission: () => Promise<void> } {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  // Register the service worker and inject Firebase config so the SW can init
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;

    // Inject config into the SW global scope before it initialises
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    if (reg.active) {
      reg.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        },
      });
    }
    return reg;
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isFirebaseConfigured || !app) return;
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setLoading(false);
        return;
      }

      const supported = await isSupported();
      if (!supported) {
        setPermission('unsupported');
        setLoading(false);
        return;
      }

      const messaging = getMessaging(app);
      const swReg = await registerServiceWorker();

      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg ?? undefined,
      });

      setToken(fcmToken);

      // Persist token to Firestore
      if (userId && fcmToken) {
        await addFcmToken(userId, fcmToken);
      }

      // Listen for foreground messages
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? 'Driiva';
        const body = payload.notification?.body ?? '';
        onForegroundMessage?.({ title, body, data: payload.data });
      });
    } catch (err) {
      console.error('[PushNotifications] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, onForegroundMessage, registerServiceWorker]);

  // Check current permission on mount
  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Cleanup foreground listener on unmount
  useEffect(() => {
    return () => {
      unsubRef.current?.();
    };
  }, []);

  return { permission, token, loading, requestPermission };
}
