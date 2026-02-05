/**
 * ONLINE STATUS CONTEXT
 * =====================
 * Provides isOnline and reportFirestoreError so any component or hook can
 * react to offline state and report Firestore connection failures.
 */

import React, { createContext, useContext } from 'react';
import { useOnlineStatus, type OnlineStatusResult } from '@/hooks/useOnlineStatus';

export const OnlineStatusContext = createContext<OnlineStatusResult | null>(null);

export function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const value = useOnlineStatus();
  return (
    <OnlineStatusContext.Provider value={value}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatusContext(): OnlineStatusResult {
  const ctx = useContext(OnlineStatusContext);
  if (ctx) return ctx;
  return {
    isOnline: true,
    reportFirestoreError: () => {},
  };
}
