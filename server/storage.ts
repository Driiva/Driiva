import { 
  users, 
  drivingProfiles, 
  trips, 
  communityPool, 
  achievements, 
  userAchievements, 
  incidents, 
  leaderboard,
  type User, 
  type InsertUser,
  type DrivingProfile,
  type InsertDrivingProfile,
  type Trip,
  type InsertTrip,
  type CommunityPool,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type Incident,
  type InsertIncident,
  type Leaderboard
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // Driving profile operations
  getDrivingProfile(userId: number): Promise<DrivingProfile | undefined>;
  createDrivingProfile(profile: InsertDrivingProfile): Promise<DrivingProfile>;
  updateDrivingProfile(userId: number, updates: Partial<InsertDrivingProfile>): Promise<DrivingProfile>;
  
  // Trip operations
  createTrip(trip: InsertTrip): Promise<Trip>;
  getUserTrips(userId: number, limit?: number): Promise<Trip[]>;
  getTripById(id: number): Promise<Trip | undefined>;
  
  // Community pool operations
  getCommunityPool(): Promise<CommunityPool | undefined>;
  updateCommunityPool(updates: Partial<CommunityPool>): Promise<CommunityPool>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement>;
  
  // Incident operations
  createIncident(incident: InsertIncident): Promise<Incident>;
  getUserIncidents(userId: number): Promise<Incident[]>;
  updateIncident(id: number, updates: Partial<InsertIncident>): Promise<Incident>;
  
  // Leaderboard operations
  getLeaderboard(period?: string, limit?: number): Promise<Leaderboard[]>;
  updateLeaderboard(userId: number, score: number, period?: string): Promise<Leaderboard>;
  
  // GDPR operations
  exportUserData(userId: number): Promise<any>;
  deleteUserData(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Create initial driving profile
    await this.createDrivingProfile({ userId: user.id });
    
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getDrivingProfile(userId: number): Promise<DrivingProfile | undefined> {
    const [profile] = await db.select().from(drivingProfiles).where(eq(drivingProfiles.userId, userId));
    return profile || undefined;
  }

  async createDrivingProfile(profile: InsertDrivingProfile): Promise<DrivingProfile> {
    const [newProfile] = await db.insert(drivingProfiles).values(profile).returning();
    return newProfile;
  }

  async updateDrivingProfile(userId: number, updates: Partial<InsertDrivingProfile>): Promise<DrivingProfile> {
    const [profile] = await db.update(drivingProfiles)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(drivingProfiles.userId, userId))
      .returning();
    return profile;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async getUserTrips(userId: number, limit: number = 10): Promise<Trip[]> {
    return await db.select().from(trips)
      .where(eq(trips.userId, userId))
      .orderBy(desc(trips.createdAt))
      .limit(limit);
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }

  async getCommunityPool(): Promise<CommunityPool | undefined> {
    const [pool] = await db.select().from(communityPool).orderBy(desc(communityPool.lastUpdated)).limit(1);
    return pool || undefined;
  }

  async updateCommunityPool(updates: Partial<CommunityPool>): Promise<CommunityPool> {
    const [pool] = await db.update(communityPool)
      .set({ ...updates, lastUpdated: new Date() })
      .returning();
    return pool;
  }

  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const [achievement] = await db.insert(userAchievements)
      .values({ userId, achievementId })
      .returning();
    return achievement;
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async getUserIncidents(userId: number): Promise<Incident[]> {
    return await db.select().from(incidents)
      .where(eq(incidents.userId, userId))
      .orderBy(desc(incidents.reportedAt));
  }

  async updateIncident(id: number, updates: Partial<InsertIncident>): Promise<Incident> {
    const [incident] = await db.update(incidents).set(updates).where(eq(incidents.id, id)).returning();
    return incident;
  }

  async getLeaderboard(period: string = 'weekly', limit: number = 50): Promise<Leaderboard[]> {
    return await db.select().from(leaderboard)
      .where(eq(leaderboard.period, period))
      .orderBy(asc(leaderboard.rank))
      .limit(limit);
  }

  async updateLeaderboard(userId: number, score: number, period: string = 'weekly'): Promise<Leaderboard> {
    const [entry] = await db.insert(leaderboard)
      .values({ userId, score, period, rank: 1 })
      .onConflictDoUpdate({
        target: [leaderboard.userId, leaderboard.period],
        set: { score, lastUpdated: new Date() }
      })
      .returning();
    return entry;
  }

  async exportUserData(userId: number): Promise<any> {
    const user = await this.getUser(userId);
    const profile = await this.getDrivingProfile(userId);
    const userTrips = await this.getUserTrips(userId, 1000);
    const userAchievements = await this.getUserAchievements(userId);
    const userIncidents = await this.getUserIncidents(userId);

    return {
      user,
      drivingProfile: profile,
      trips: userTrips,
      achievements: userAchievements,
      incidents: userIncidents,
      exportedAt: new Date().toISOString()
    };
  }

  async deleteUserData(userId: number): Promise<void> {
    await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
    await db.delete(incidents).where(eq(incidents.userId, userId));
    await db.delete(leaderboard).where(eq(leaderboard.userId, userId));
    await db.delete(trips).where(eq(trips.userId, userId));
    await db.delete(drivingProfiles).where(eq(drivingProfiles.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
