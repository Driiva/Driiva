import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { crypto } from "./lib/crypto";
import { telematicsProcessor, TelematicsData } from "./lib/telematics";
import { insertTripSchema, insertIncidentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get user dashboard data
  app.get("/api/dashboard/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      const profile = await storage.getDrivingProfile(userId);
      const recentTrips = await storage.getUserTrips(userId, 5);
      const pool = await storage.getCommunityPool();
      const achievements = await storage.getUserAchievements(userId);
      const leaderboard = await storage.getLeaderboard('weekly', 10);

      if (!user || !profile) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate projected refund
      const poolSafetyFactor = pool?.safetyFactor || 0.80;
      const projectedRefund = telematicsProcessor.calculateRefund(
        profile.currentScore || 0,
        Number(poolSafetyFactor),
        Number(user.premiumAmount)
      );

      res.json({
        user,
        profile: { ...profile, projectedRefund },
        recentTrips,
        communityPool: pool,
        achievements,
        leaderboard
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching dashboard data: " + error.message });
    }
  });

  // Submit trip data
  app.post("/api/trips", async (req, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      const telematicsData: TelematicsData = req.body.telematicsData;
      
      // Process telematics data
      const metrics = telematicsProcessor.processTrip(telematicsData);
      
      // Create trip with processed metrics
      const trip = await storage.createTrip({
        ...tripData,
        score: metrics.score,
        hardBrakingEvents: metrics.hardBrakingEvents,
        harshAcceleration: metrics.harshAccelerationEvents,
        speedViolations: metrics.speedViolations,
        nightDriving: metrics.nightDriving,
        sharpCorners: metrics.sharpCorners,
        distance: metrics.distance.toString(),
        duration: metrics.duration,
        telematicsData: crypto.encrypt(JSON.stringify(telematicsData), process.env.ENCRYPTION_KEY || 'default-key')
      });

      // Update user's driving profile
      const profile = await storage.getDrivingProfile(tripData.userId);
      if (profile) {
        const currentScore = profile.currentScore || 0;
        const totalTrips = profile.totalTrips || 0;
        const newCurrentScore = Math.round((currentScore * totalTrips + metrics.score) / (totalTrips + 1));
        
        const updatedProfile = await storage.updateDrivingProfile(tripData.userId, {
          currentScore: newCurrentScore,
          hardBrakingScore: (profile.hardBrakingScore || 0) + metrics.hardBrakingEvents,
          accelerationScore: (profile.accelerationScore || 0) + metrics.harshAccelerationEvents,
          speedAdherenceScore: (profile.speedAdherenceScore || 0) + metrics.speedViolations,
          nightDrivingScore: (profile.nightDrivingScore || 0) + (metrics.nightDriving ? 1 : 0),
          corneringScore: (profile.corneringScore || 0) + metrics.sharpCorners,
          totalTrips: totalTrips + 1,
          totalMiles: (Number(profile.totalMiles) + metrics.distance).toString()
        });

        // Update leaderboard
        await storage.updateLeaderboard(tripData.userId, newCurrentScore);
      }

      res.json({ trip, metrics });
    } catch (error: any) {
      res.status(500).json({ message: "Error processing trip: " + error.message });
    }
  });

  // Get user trips
  app.get("/api/trips/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 20;
      const trips = await storage.getUserTrips(userId, limit);
      res.json(trips);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching trips: " + error.message });
    }
  });

  // Report incident
  app.post("/api/incidents", async (req, res) => {
    try {
      const incidentData = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(incidentData);
      res.json(incident);
    } catch (error: any) {
      res.status(500).json({ message: "Error reporting incident: " + error.message });
    }
  });

  // Get community pool data
  app.get("/api/community-pool", async (req, res) => {
    try {
      const pool = await storage.getCommunityPool();
      res.json(pool);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching community pool: " + error.message });
    }
  });

  // Update community pool (admin only)
  app.put("/api/community-pool", async (req, res) => {
    try {
      const poolData = req.body;
      const pool = await storage.updateCommunityPool(poolData);
      res.json(pool);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating community pool: " + error.message });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const period = req.query.period as string || 'weekly';
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await storage.getLeaderboard(period, limit);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching leaderboard: " + error.message });
    }
  });

  // Get achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching achievements: " + error.message });
    }
  });

  // Get user achievements
  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user achievements: " + error.message });
    }
  });

  // Refund simulator
  app.post("/api/simulate-refund", async (req, res) => {
    try {
      const { personalScore, poolSafetyFactor, premiumAmount } = req.body;
      const refund = telematicsProcessor.calculateRefund(personalScore, poolSafetyFactor, premiumAmount);
      res.json({ refund });
    } catch (error: any) {
      res.status(500).json({ message: "Error simulating refund: " + error.message });
    }
  });

  // GDPR: Export user data
  app.get("/api/gdpr/export/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userData = await storage.exportUserData(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=driiva-data-${userId}.json`);
      res.json(userData);
    } catch (error: any) {
      res.status(500).json({ message: "Error exporting data: " + error.message });
    }
  });

  // GDPR: Delete user account
  app.delete("/api/gdpr/delete/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await storage.deleteUserData(userId);
      res.json({ message: "User data deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting user data: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
