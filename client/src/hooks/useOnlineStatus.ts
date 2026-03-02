/**
 * ONLINE STATUS HOOK
 * ==================
 * Detects offline state for the Driiva app so we can show a banner and
 * disable trip start when sync would fail.
 *
 * Combines:
 * - navigator.onLine and 'online' / 'offline' events
 * - Optional Firestore connection failures (report via context when
 *   onSnapshot errors so we can show offline even if navigator says online)
 *
 * When offline, Firestore's built-in persistence (enableIndexedDbPersistence)
 * queues writes and syncs automatically when back online.
 */

import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatusResult {
  /** False when browser is offline or Firestore has reported a connection error */
  isOnline: boolean;
  /** Call when an onSnapshot (or other Firestore op) fails due to network */
  reportFirestoreError: () => void;
}

/**
 * useOnlineStatus
 *
 * - Listens to navigator.onLine and window 'online' / 'offline' events.
 * - When reportFirestoreError() is called (e.g. from onSnapshot error callback),
 *   we treat as offline until the next 'online' event (optimistic recovery).
 */
export function useOnlineStatus(): OnlineStatusResult {
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [firestoreError, setFirestoreError] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setBrowserOnline(true);
      setFirestoreError(false);
    };

    const handleOffline = () => {
      setBrowserOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Called when a Firestore operation fails due to a suspected network issue.
   * Fires a GET /api/health ping to confirm we are truly offline before showing
   * the banner — a transient Firestore error while the browser is actually online
   * should not lock the UI in offline mode.
   */
  const reportFirestoreError = useCallback(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch('/api/health', { method: 'GET', cache: 'no-store', signal: controller.signal })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          // Server responded but with an error — treat as offline
          setFirestoreError(true);
        }
        // Server responded OK → browser is online; Firestore error is transient, do not show banner
      })
      .catch(() => {
        clearTimeout(timeoutId);
        // Fetch itself failed (network down or timeout) → genuinely offline
        setFirestoreError(true);
      });
  }, []);

  const isOnline = browserOnline && !firestoreError;

  return {
    isOnline,
    reportFirestoreError,
  };
}

export default useOnlineStatus;
