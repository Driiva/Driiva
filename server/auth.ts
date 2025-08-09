
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface AuthService {
  login(username: string, password: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | null>;
}

export class SimpleAuthService implements AuthService {

  // Secure login with bcrypt password checking
  async login(username: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user) {
      return null;
    }

    // Check password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    
    return user;
  }

  async getUser(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }
}

export const authService = new SimpleAuthService();
