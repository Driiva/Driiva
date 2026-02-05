import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

const missingVars: string[] = [];
if (!apiKey) missingVars.push('VITE_FIREBASE_API_KEY');
if (!projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID');
if (!appId) missingVars.push('VITE_FIREBASE_APP_ID');

export const isFirebaseConfigured = missingVars.length === 0;

if (missingVars.length > 0) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ FIREBASE CONFIGURATION ERROR');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('');
  console.error('To fix this:');
  console.error('1. Go to Replit Secrets (lock icon in sidebar)');
  console.error('2. Add the following secrets:');
  console.error('   - VITE_FIREBASE_API_KEY     (from Firebase Console)');
  console.error('   - VITE_FIREBASE_PROJECT_ID  (e.g., "driiva")');
  console.error('   - VITE_FIREBASE_APP_ID      (from Firebase Console)');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

const firebaseConfig = {
  apiKey: apiKey || 'missing-api-key',
  authDomain: 'driiva.firebaseapp.com',
  projectId: projectId || 'missing-project-id',
  storageBucket: `${projectId || 'missing-project-id'}.firebasestorage.app`,
  appId: appId || 'missing-app-id',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (isFirebaseConfigured) {
    console.log(`✓ Firebase initialized with projectId=${projectId}`);
  } else {
    console.warn('⚠ Firebase initialized with incomplete config - auth will fail');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw new Error(`Firebase initialization failed: ${error}`);
}

export { auth, db };
export default app;
