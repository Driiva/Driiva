/**
 * OFFLINE BANNER
 * ==============
 * Persistent banner at top of app when offline. Orange/yellow (warning).
 * Auto-dismisses when back online.
 */

import { WifiOff } from 'lucide-react';
import { useOnlineStatusContext } from '@/contexts/OnlineStatusContext';

export default function OfflineBanner() {
  const { isOnline } = useOnlineStatusContext();

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-950 bg-amber-400/95 shadow-md border-b border-amber-500/50"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden />
      <span>
        You're offline. Trip data will sync when reconnected.
      </span>
    </div>
  );
}
