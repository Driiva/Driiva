/**
 * Make a user an admin by setting isAdmin: true in their Firestore document
 * Usage: tsx scripts/make-admin.ts your.email@example.com
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function makeUserAdmin(email: string) {
  try {
    console.log(`Looking for user with email: ${email}...`);
    
    // Get user by email from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;
    
    console.log(`Found user: ${uid}`);
    
    // Update Firestore document
    await db.collection('users').doc(uid).update({
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'make-admin-script',
    });
    
    console.log('✅ User is now an admin!');
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${uid}`);
    console.log('\nYou can now sign in and access /admin routes.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error && error.message.includes('no user record')) {
      console.log('\nUser not found. Make sure they have signed up first.');
    }
  } finally {
    process.exit(0);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: tsx scripts/make-admin.ts your.email@example.com');
  process.exit(1);
}

makeUserAdmin(email);
