
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
// Firebase is not configured, removing Firebase dependency for now

export interface AuthService {
  login(username: string, password: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
}

export class SimpleAuthService implements AuthService {

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

export const authService = new SimpleAuthService();
