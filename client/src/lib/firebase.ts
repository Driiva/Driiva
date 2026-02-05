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
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Read env vars - ONLY use VITE_FIREBASE_* prefix (Vite convention)
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

// Runtime validation - check which vars are missing
const missingVars: string[] = [];
if (!apiKey) missingVars.push('VITE_FIREBASE_API_KEY');
if (!projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID');
if (!appId) missingVars.push('VITE_FIREBASE_APP_ID');

/**
 * Export flag to let the app know if Firebase is properly configured.
 * Components should check this before attempting auth operations.
 */
export const isFirebaseConfigured = missingVars.length === 0;

// Log configuration status clearly
if (missingVars.length > 0) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ FIREBASE CONFIGURATION ERROR');
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
}

// Firebase config - authDomain is hardcoded for stability
const firebaseConfig = {
  apiKey: apiKey || 'missing-api-key',
  authDomain: 'driiva.firebaseapp.com', // Hardcoded - do not change
  projectId: projectId || 'missing-project-id',
  storageBucket: `${projectId || 'missing-project-id'}.firebasestorage.app`,
  appId: appId || 'missing-app-id',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  // SINGLE initializeApp call - all imports should use this module
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (isFirebaseConfigured) {
    console.log(`✓ Firebase initialized with projectId=${projectId}`);
  } else {
    console.warn('⚠ Firebase initialized with incomplete config - auth will fail');
    console.warn('⚠ Demo mode will still work, but real authentication is disabled');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw new Error(`Firebase initialization failed: ${error}`);
}

export { auth, db };
export default app;
