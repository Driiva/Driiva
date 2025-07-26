import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface AuthService {
  login(username: string, password: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

// Simple password hashing (in production, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  // For demo purposes, we'll just store plain text
  // In production, use bcrypt or similar
  return password;
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // For demo purposes, direct comparison
  // In production, use bcrypt.compare()
  return password === hashedPassword;
}

export class DatabaseAuthService implements AuthService {
  async login(username: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    
    return user;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return verifyPassword(password, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }
}

export const authService = new DatabaseAuthService();