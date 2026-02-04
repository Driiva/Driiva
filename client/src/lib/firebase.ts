import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

const missingVars: string[] = [];
if (!apiKey) missingVars.push('VITE_FIREBASE_API_KEY');
if (!projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID');
if (!appId) missingVars.push('VITE_FIREBASE_APP_ID');

if (missingVars.length > 0) {
  console.error(`❌ Firebase configuration error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please add these to your Replit Secrets or .env file.');
}

const firebaseConfig = {
  apiKey,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: `${projectId}.firebasestorage.app`,
  appId,
};

export const isFirebaseConfigured = missingVars.length === 0;

if (import.meta.env.DEV) {
  console.log('🔥 Firebase Config:', {
    apiKey: apiKey ? '✓ Set' : '✗ Missing',
    projectId: projectId ? '✓ Set' : '✗ Missing',
    appId: appId ? '✓ Set' : '✗ Missing',
  });
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (import.meta.env.DEV && isFirebaseConfigured) {
  console.log('✓ Firebase initialized successfully');
}

export default app;
