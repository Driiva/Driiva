/**
 * FIREBASE CONFIGURATION
 * ----------------------
 * Single source of truth for Firebase initialization.
 * 
 * Required environment variables (set in .env.local or Replit Secrets):
 *   - VITE_FIREBASE_API_KEY     (from Firebase Console > Project Settings)
 *   - VITE_FIREBASE_PROJECT_ID  (e.g., "driiva")
 *   - VITE_FIREBASE_APP_ID      (from Firebase Console > Project Settings)
 * 
 * The authDomain is hardcoded to "driiva.firebaseapp.com" for stability.
 * 
 * FAIL-FAST BEHAVIOR:
 * If required env vars are missing, Firebase will NOT be initialized and
 * isFirebaseConfigured will be false. Demo mode will still work.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Runtime env validation - required vars with their env key names
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check for missing vars
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.toUpperCase()}`);

/**
 * Export flag to let the app know if Firebase is properly configured.
 * Components should check this before attempting auth operations.
 */
export const isFirebaseConfigured = missingVars.length === 0;

// Fail fast: log errors and skip initialization if env vars missing
if (missingVars.length > 0) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ FIREBASE CONFIGURATION INCOMPLETE');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('');
  console.error('To fix this in local development:');
  console.error('  1. Create a .env.local file in the client/ folder');
  console.error('  2. Add the following:');
  console.error('     VITE_FIREBASE_API_KEY=your-api-key');
  console.error('     VITE_FIREBASE_PROJECT_ID=driiva');
  console.error('     VITE_FIREBASE_APP_ID=your-app-id');
  console.error('');
  console.error('To fix this in Replit:');
  console.error('  1. Go to Secrets (lock icon in sidebar)');
  console.error('  2. Add the three VITE_FIREBASE_* secrets');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');
  console.error('⚠ Firebase NOT initialized - demo mode still works');
}

// Firebase config - only valid when all env vars present
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey,
  authDomain: 'driiva.firebaseapp.com', // Hardcoded - do not change
  projectId: requiredEnvVars.projectId,
  appId: requiredEnvVars.appId,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Only initialize Firebase if properly configured
if (isFirebaseConfigured) {
  try {
    // SINGLE initializeApp call - all imports should use this module
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log(`✓ Firebase initialized with projectId=${requiredEnvVars.projectId}`);
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw new Error(`Firebase initialization failed: ${error}`);
  }
}

// Export with type assertions for consumers that check isFirebaseConfigured first
export { auth, db };
export default app;
