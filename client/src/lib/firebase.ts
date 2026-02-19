/**
 * FIREBASE CONFIGURATION
 * ----------------------
 * Single source of truth for Firebase initialization.
 *
 * Required environment variables (set in .env at repo root, or Replit Secrets):
 *   - VITE_FIREBASE_API_KEY     (from Firebase Console > Project Settings)
 *   - VITE_FIREBASE_PROJECT_ID  (e.g., "driiva")
 *   - VITE_FIREBASE_APP_ID      (from Firebase Console > Project Settings)
 *
 * Optional (used when present, sensible defaults otherwise):
 *   - VITE_FIREBASE_AUTH_DOMAIN
 *   - VITE_FIREBASE_STORAGE_BUCKET
 *   - VITE_FIREBASE_MESSAGING_SENDER_ID
 *   - VITE_FIREBASE_MEASUREMENT_ID
 *
 * The authDomain defaults to "<projectId>.firebaseapp.com" for stability.
 *
 * FAIL-FAST BEHAVIOR:
 * If required env vars are missing, Firebase will NOT be initialized and
 * isFirebaseConfigured will be false. Demo mode will still work.
 *
 * ENV LOADING:
 * Vite loads .env from the repo root (configured via envDir in vite.config.ts).
 * All client-side vars must start with VITE_.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

// ---------------------------------------------------------------------------
// 1. Read environment variables
// ---------------------------------------------------------------------------

const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const envAppId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;
const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
const envStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
const envMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined;
const envMeasurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined;

// ---------------------------------------------------------------------------
// 2. Validate required vars
// ---------------------------------------------------------------------------

const requiredEnvVars: Record<string, string | undefined> = {
  VITE_FIREBASE_API_KEY: envApiKey,
  VITE_FIREBASE_PROJECT_ID: envProjectId,
  VITE_FIREBASE_APP_ID: envAppId,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value || value.trim() === '')
  .map(([key]) => key);

/**
 * Export flag to let the app know if Firebase is properly configured.
 * Components should check this before attempting auth operations.
 */
export const isFirebaseConfigured: boolean = missingVars.length === 0;

// Fail fast: log errors and skip initialization if env vars missing
if (missingVars.length > 0) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ FIREBASE CONFIGURATION INCOMPLETE');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('');
  console.error('To fix this in local development:');
  console.error('  1. Ensure .env exists in the repo root (not client/)');
  console.error('  2. Required keys:');
  console.error('     VITE_FIREBASE_API_KEY=<from Firebase Console>');
  console.error('     VITE_FIREBASE_PROJECT_ID=driiva');
  console.error('     VITE_FIREBASE_APP_ID=<from Firebase Console>');
  console.error('  3. Restart the dev server after changes');
  console.error('');
  console.error('To fix this in Replit:');
  console.error('  1. Go to Secrets (lock icon in sidebar)');
  console.error('  2. Add the three VITE_FIREBASE_* secrets');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('⚠ Firebase NOT initialized — demo mode still works');
}

// ---------------------------------------------------------------------------
// 3. Diagnostic logging (redacted keys for safety)
// ---------------------------------------------------------------------------

function redact(value: string | undefined): string {
  if (!value) return '<NOT SET>';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 6)}...${value.slice(-4)} (${value.length} chars)`;
}

if (import.meta.env.DEV) {
  console.group('🔧 Firebase env diagnostics');
  console.log('VITE_FIREBASE_API_KEY       :', redact(envApiKey));
  console.log('VITE_FIREBASE_PROJECT_ID    :', envProjectId ?? '<NOT SET>');
  console.log('VITE_FIREBASE_APP_ID        :', redact(envAppId));
  console.log('VITE_FIREBASE_AUTH_DOMAIN   :', envAuthDomain ?? '<default>');
  console.log('VITE_FIREBASE_STORAGE_BUCKET:', envStorageBucket ?? '<not set>');
  console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', envMessagingSenderId ?? '<not set>');
  console.log('isFirebaseConfigured        :', isFirebaseConfigured);
  console.groupEnd();
}

// ---------------------------------------------------------------------------
// 4. Build Firebase config object
// ---------------------------------------------------------------------------

const projectId = envProjectId ?? 'driiva';

const firebaseConfig = {
  apiKey: envApiKey ?? '',
  // authDomain hardcoded for stability; override via env if needed
  authDomain: envAuthDomain || `${projectId}.firebaseapp.com`,
  projectId,
  appId: envAppId ?? '',
  // Optional fields — include when available for full Firebase functionality
  ...(envStorageBucket && { storageBucket: envStorageBucket }),
  ...(envMessagingSenderId && { messagingSenderId: envMessagingSenderId }),
  ...(envMeasurementId && { measurementId: envMeasurementId }),
};

// ---------------------------------------------------------------------------
// 5. Initialize Firebase (only when all required env vars are present)
// ---------------------------------------------------------------------------

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured) {
  try {
    // SINGLE initializeApp call — all imports should use this module
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators in development mode
    /*
    if (import.meta.env.DEV) {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('✓ Connected to Firebase Emulators (Auth: 9099, Firestore: 8080)');
    }
    */

    // Analytics: initialize when measurementId is available (throws in some environments)
    if (envMeasurementId) {
      try {
        analytics = getAnalytics(app);
      } catch (analyticsErr) {
        // Analytics can fail in environments with ad-blockers or restricted APIs
        console.warn('Firebase Analytics could not be initialized:', analyticsErr);
      }
    }

    // Offline persistence: queue writes when offline and sync when back online
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence: multiple tabs open, using cache in this tab only.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser.');
      } else {
        console.warn('Firestore persistence error:', err);
      }
    });

    console.log(`✓ Firebase initialized — project="${projectId}"`);
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw new Error(`Firebase initialization failed: ${error}`);
  }
}

// ---------------------------------------------------------------------------
// 6. Exports
// ---------------------------------------------------------------------------

// Google Auth provider — pre-configured, ready for signInWithPopup
const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : null;

export { auth, db, googleProvider, analytics };
export default app;
