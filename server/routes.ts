import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { crypto } from "./lib/crypto";
import { telematicsProcessor, TelematicsData } from "./lib/telematics";
import { aiInsightsEngine } from "./lib/aiInsights";
import { insertTripSchema, insertIncidentSchema } from "@shared/schema";
import { z } from "zod";
import { authService } from "./auth";
import { webauthnService } from "./webauthn";
import { authLimiter, tripDataLimiter } from "./middleware/security";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoints with rate limiting
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await authService.login(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed: " + error.message });
    }
  });

  app.get("/api/auth/check", async (req, res) => {
    // For now, we'll use a simple check - in production, use sessions/JWT
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ authenticated: false });
    }
    
    const user = await storage.getUser(parseInt(userId as string));
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ authenticated: true, user: userWithoutPassword });
  });


  // Firebase Authentication with rate limiting (placeholder for future implementation)
  app.post("/api/auth/firebase", authLimiter, async (req, res) => {
    try {
      // TODO: Implement Firebase authentication when needed
      res.status(501).json({ message: "Firebase authentication not implemented yet" });
    } catch (error) {
      console.error("Firebase auth error:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // WebAuthn (Face ID/Touch ID) Authentication Endpoints
  app.post("/api/auth/webauthn/register/start", authLimiter, async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      const options = await webauthnService.generateRegistrationOptions(username);
      res.json(options);
    } catch (error: any) {
      console.error("WebAuthn registration start error:", error);
      res.status(400).json({ message: error.message || "Failed to generate registration options" });
    }
  });

  app.post("/api/auth/webauthn/register/complete", authLimiter, async (req, res) => {
    try {
      const { username, credential } = req.body;
      
      if (!username || !credential) {
        return res.status(400).json({ message: "Username and credential required" });
      }

      const result = await webauthnService.verifyRegistration(username, credential);
      
      if (result.verified) {
        res.json({ success: true, message: "Biometric authentication registered successfully" });
      } else {
        res.status(400).json({ message: result.error || "Registration verification failed" });
      }
    } catch (error: any) {
      console.error("WebAuthn registration complete error:", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/webauthn/authenticate/start", authLimiter, async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      const options = await webauthnService.generateAuthenticationOptions(username);
      res.json(options);
    } catch (error: any) {
      console.error("WebAuthn authentication start error:", error);
      res.status(400).json({ message: error.message || "Failed to generate authentication options" });
    }
  });

  app.post("/api/auth/webauthn/authenticate/complete", authLimiter, async (req, res) => {
    try {
      const { username, assertion } = req.body;
      
      if (!username || !assertion) {
        return res.status(400).json({ message: "Username and assertion required" });
      }

      const result = await webauthnService.verifyAuthentication(username, assertion);
      
      if (result.verified && result.user) {
        res.json({ success: true, user: result.user });
      } else {
        res.status(401).json({ message: result.error || "Authentication failed" });
      }
    } catch (error: any) {
      console.error("WebAuthn authentication complete error:", error);
      res.status(500).json({ message: error.message || "Authentication failed" });
    }
  });

  app.get("/api/auth/webauthn/credentials/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      const credentials = await webauthnService.getUserCredentials(username);
      res.json({
        credentials: credentials.map((cred: any) => ({
          id: cred.credentialId,
          deviceType: cred.deviceType,
          deviceName: cred.deviceName,
          createdAt: cred.createdAt,
          lastUsed: cred.lastUsed
        }))
      });
    } catch (error: any) {
      console.error("Get credentials error:", error);
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });


  // Get user dashboard data
  app.get("/api/dashboard/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`Fetching dashboard data for user ${userId}`);

      const user = await storage.getUser(userId);
      console.log(`User found:`, !!user);

      const profile = await storage.getDrivingProfile(userId);
      console.log(`Profile found:`, !!profile);

      const recentTrips = await storage.getUserTrips(userId, 5);
      console.log(`Recent trips count:`, recentTrips?.length || 0);

      const pool = await storage.getCommunityPool();
      console.log(`Community pool found:`, !!pool);

      const achievements = await storage.getUserAchievements(userId);
      console.log(`Achievements count:`, achievements?.length || 0);

      const leaderboard = await storage.getLeaderboard('weekly', 10);
      console.log(`Leaderboard count:`, leaderboard?.length || 0);

      if (!user || !profile) {
        console.log(`Missing data - User: ${!!user}, Profile: ${!!profile}`);
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate projected refund
      const poolSafetyFactor = pool?.safetyFactor || 0.80;
      const projectedRefund = telematicsProcessor.calculateRefund(
        profile.currentScore || 0,
        Number(poolSafetyFactor),
        Number(user.premiumAmount)
      );

      console.log(`Dashboard data compiled successfully for user ${userId}`);
      res.json({
        user,
        profile: { ...profile, projectedRefund },
        recentTrips,
        communityPool: pool,
        achievements,
        leaderboard
      });
    } catch (error: any) {
      console.error("Dashboard error details:", error);
      res.status(500).json({ message: "Error fetching dashboard data: " + error.message });
    }
  });

  // Submit trip data with rate limiting
  app.post("/api/trips", tripDataLimiter, async (req, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      const telematicsData: TelematicsData = req.body.telematicsData;
      const userId = tripData.userId;

      // Process telematics data with AI models
      const metrics = await telematicsProcessor.processTrip(telematicsData, userId);

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
      const offset = parseInt(req.query.offset as string) || 0;
      const trips = await storage.getUserTrips(userId, limit, offset);
      res.json(trips);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching trips: " + error.message });
    }
  });

  // Report incident
  app.post("/api/incidents", async (req, res) => {
    try {
      console.log("Received incident data:", req.body);

      // Prepare the data with proper timestamp
      const incidentData = {
        ...req.body,
        reportedAt: new Date(),
        timestamp: req.body.timestamp || new Date().toISOString()
      };

      const validatedData = insertIncidentSchema.parse(incidentData);
      const incident = await storage.createIncident(validatedData);
      res.json(incident);
    } catch (error: any) {
      console.error("Incident submission error:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: "Error reporting incident: " + error.message });
      }
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

  // AI insights endpoint
  app.get("/api/insights/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get user profile and recent trips
      const profile = await storage.getDrivingProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Driving profile not found" });
      }
      
      const trips = await storage.getTrips(userId, 20, 0);
      const communityPool = await storage.getCommunityPool(1);
      
      // Generate AI insights
      const insights = aiInsightsEngine.generateInsights(
        profile,
        trips,
        Number(communityPool?.safetyFactor) * 100 || 75
      );
      
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ message: "Error generating insights: " + error.message });
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

  // Perplexity AI endpoint
  app.post("/api/ask", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: "sonar-pro",
          stream: false,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          return_images: false,
          return_related_questions: false
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Perplexity API error:", response.status, errorData);
        throw new Error(`Perplexity API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      res.json({
        answer: data.choices[0].message.content,
        citations: data.citations || []
      });
    } catch (error: any) {
      console.error("AI backend error:", error);
      res.status(500).json({ message: "AI backend error: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}