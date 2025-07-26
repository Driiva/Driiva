
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export interface AuthService {
  verifyFirebaseToken(token: string): Promise<admin.auth.DecodedIdToken>;
  findOrCreateUser(firebaseUser: admin.auth.DecodedIdToken): Promise<User>;
  login(username: string, password: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
}

export class FirebaseAuthService implements AuthService {
  async verifyFirebaseToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return await admin.auth().verifyIdToken(token);
  }

  async findOrCreateUser(firebaseUser: admin.auth.DecodedIdToken): Promise<User> {
    // Try to find existing user by Firebase UID
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUser.uid));

    if (existingUser) {
      return existingUser;
    }

    // Create new user if doesn't exist
    const [newUser] = await db
      .insert(users)
      .values({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.slice(0, 8)}`,
        firstName: firebaseUser.name?.split(' ')[0] || '',
        lastName: firebaseUser.name?.split(' ').slice(1).join(' ') || '',
        password: '', // Not needed for Firebase users
      })
      .returning();

    return newUser;
  }

  // Keep existing methods for demo user compatibility
  async login(username: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user || user.password !== password) {
      return null;
    }

    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    
    return user;
  }
}

export const authService = new FirebaseAuthService();
