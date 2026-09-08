/**
 * The Firestore handle the trip pipeline writes through, in its own module so
 * the modules that were split out of triggers/trips.ts and ai/tripAnalysis.ts
 * share the single getFirestore() call each of those files used to make at
 * import time.
 */
import { getFirestore } from 'firebase-admin/firestore';
export const db = getFirestore();
