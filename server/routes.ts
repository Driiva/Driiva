/**
 * API route registration. All /api/* routes are protected except:
 *
 * PUBLIC (no auth): POST /api/auth/login, POST /api/auth/register, POST /api/auth/firebase,
 *   WebAuthn endpoints, GET /api/community-pool, GET /api/leaderboard, GET /api/achievements (list).
 *
 * PROTECTED (requireAuth): /api/profile/me, /api/auth/check, POST /api/trips, POST /api/incidents,
 *   POST /api/simulate-refund, POST /api/ask. Routes with :userId also use requireResourceOwner
 *   so User A cannot access User B's data (dashboard, trips, scores, insights, achievements, GDPR).
 *
 * ADMIN (requireAuth + requireAdmin): PUT /api/community-pool. Rate limited via poolModificationLimiter.
 * GDPR delete is rate limited via gdprDeleteLimiter.
 */
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { crypto } from "./lib/crypto";
import { telematicsProcessor, TelematicsData, TripJSON } from "./lib/telematics";
import { aiInsightsEngine } from "./lib/aiInsights";
import { scoreAggregation } from "./lib/scoreAggregation";
import { insertTripSchema, insertIncidentSchema } from "@shared/schema";
import { z } from "zod";
import { authService } from "./auth";
import { webauthnService } from "./webauthn";
import { authLimiter, tripDataLimiter } from "./middleware/security";
import { gdprDeleteLimiter, poolModificationLimiter } from "./middleware/rateLimiter";
import {
  verifyFirebaseAuth,
  requireAuth,
  requireResourceOwner,
  requireAdmin,
  type AuthRequest,
} from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Verify Firebase JWT on all requests; sets req.auth { uid, email, userId } from token only (never from headers)
  app.use(verifyFirebaseAuth);

  // -------------------------------------------------------------------------
  // PUBLIC ROUTES (no auth) — login, register, webauthn, read-only leaderboard/achievements/community-pool
  // -------------------------------------------------------------------------

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // -------------------------------------------------------------------------
  // Profile API (protected: Firebase token required; identity from token only)
  // -------------------------------------------------------------------------
  app.get("/api/profile/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.auth!.uid;
      const email = req.auth!.email ?? "";
      let profile = await storage.getUserByFirebaseUid(uid);
      if (!profile && email) {
        profile = await storage.getOrCreateUserByFirebase(uid, email, undefined);
      }
      if (!profile) {
        return res.status(404).json({ message: "Profile not found. Sign up first." });
      }
      const { password: _, ...safe } = profile;
      res.json({
        id: String(profile.id),
        firebaseUid: profile.firebaseUid,
        email: profile.email,
        name: profile.displayName ?? profile.firstName ?? profile.email?.split("@")[0] ?? "User",
        onboardingComplete: profile.onboardingComplete === true,
      });
    } catch (error: unknown) {
      console.error("GET /api/profile/me error:", error);
      res.status(500).json({ message: "Error fetching profile" });
    }
  });

  app.patch("/api/profile/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.auth!.uid;
      const user = await storage.getUserByFirebaseUid(uid);
      if (!user) {
        return res.status(404).json({ message: "Profile not found. Complete signup first." });
      }
      const { onboardingComplete } = req.body as { onboardingComplete?: boolean };
      if (typeof onboardingComplete !== "boolean") {
        return res.status(400).json({ message: "onboardingComplete must be a boolean" });
      }
      const updated = await storage.updateUser(user.id, { onboardingComplete });
      if (!updated) {
        return res.status(500).json({ message: "Update failed" });
      }
      res.json({
        id: String(updated.id),
        email: updated.email,
        name: updated.displayName ?? updated.email?.split("@")[0] ?? "User",
        onboardingComplete: updated.onboardingComplete === true,
      });
    } catch (error: unknown) {
      console.error("PATCH /api/profile/me error:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  });

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
      // Do not leak internal error details to the client
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth check: requires valid Firebase JWT; returns authenticated + user from verified token (never trusts x-user-id)
  app.get("/api/auth/check", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.auth!.uid;
      const user = await storage.getUserByFirebaseUid(uid);
      if (!user) {
        return res.status(200).json({ authenticated: true, user: null, firebaseUid: uid });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ authenticated: true, user: userWithoutPassword });
    } catch (e) {
      console.error("GET /api/auth/check error:", e);
      res.status(500).json({ authenticated: false });
    }
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

  // List WebAuthn credentials (protected: only own user's credentials)
  app.get("/api/auth/webauthn/credentials/:username", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.auth!.userId);
      if (!user || user.username !== req.params.username) {
        return res.status(403).json({ message: "Forbidden", code: "RESOURCE_OWNER_REQUIRED" });
      }
      const credentials = await webauthnService.getUserCredentials(req.params.username);
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


  // Get user dashboard data (protected: token required; user can only access own dashboard)
  app.get("/api/dashboard/:userId", requireAuth, requireResourceOwner("userId"), async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
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

  // Submit trip data (protected: auth required; userId taken from token, not body)
  app.post("/api/trips", requireAuth, tripDataLimiter, async (req: AuthRequest, res) => {
    try {
      const authenticatedUserId = req.auth!.userId;
      const body = { ...req.body, userId: authenticatedUserId };
      const tripData = insertTripSchema.parse(body);
      const telematicsDataOrJSON: TelematicsData | TripJSON = req.body.telematicsData || req.body;
      const userId = tripData.userId;

      // Get existing trips for duplicate detection (last 24 hours)
      const checkStart = new Date();
      checkStart.setHours(checkStart.getHours() - 24);
      const existingTrips = await storage.getTripsByDateRange(
        userId,
        checkStart,
        new Date(),
        100
      );

      // Convert to format needed for duplicate check
      const existingTripsForCheck = existingTrips.map(t => ({
        startTime: new Date(t.startTime),
        endTime: new Date(t.endTime),
        distance: Number(t.distance)
      }));

      // Process telematics data with anomaly detection
      const metrics = await telematicsProcessor.processTrip(
        telematicsDataOrJSON,
        userId,
        existingTripsForCheck
      );

      // Log anomalies if detected
      if (metrics.anomalies.hasImpossibleSpeed || metrics.anomalies.hasGPSJumps || metrics.anomalies.isDuplicate) {
        console.warn(`Trip anomalies detected for user ${userId}:`, {
          impossibleSpeed: metrics.anomalies.hasImpossibleSpeed,
          gpsJumps: metrics.anomalies.hasGPSJumps,
          duplicate: metrics.anomalies.isDuplicate,
          anomalyScore: metrics.anomalies.anomalyScore
        });
      }

      // Require a real encryption key — no insecure fallback in production
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        console.error('ENCRYPTION_KEY env var not set; refusing to store telematics data');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      // Create trip with processed metrics (distance in km)
      const trip = await storage.createTrip({
        ...tripData,
        score: metrics.score,
        hardBrakingEvents: metrics.hardBrakingEvents,
        harshAcceleration: metrics.harshAccelerationEvents,
        speedViolations: metrics.speedViolations,
        nightDriving: metrics.nightDriving,
        sharpCorners: metrics.sharpCorners,
        distance: metrics.distanceKm.toString(), // Store in km
        duration: metrics.duration,
        telematicsData: crypto.encrypt(
          JSON.stringify(telematicsDataOrJSON),
          encryptionKey
        )
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
          totalMiles: (Number(profile.totalMiles) + metrics.distanceKm).toString() // Add km
        });

        // Update leaderboard
        await storage.updateLeaderboard(tripData.userId, newCurrentScore);
      }

      res.json({
        trip,
        metrics: {
          ...metrics,
          distance_km: metrics.distanceKm,
          avg_speed: metrics.avgSpeed,
          harsh_braking_count: metrics.harshBrakingCount
        },
        anomalies: metrics.anomalies
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error processing trip: " + error.message });
    }
  });

  // Get user trips (protected: user can only access own trips)
  app.get("/api/trips/:userId", requireAuth, requireResourceOwner("userId"), async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Support date range filtering for time-series optimization
      if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({ message: 'Invalid startDate or endDate; use ISO 8601 format' });
        }
        if (endDate <= startDate) {
          return res.status(400).json({ message: 'endDate must be after startDate' });
        }
        const trips = await storage.getTripsByDateRange(userId, startDate, endDate, limit);
        return res.json(trips);
      }
      
      const trips = await storage.getUserTrips(userId, limit, offset);
      res.json(trips);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching trips: " + error.message });
    }
  });

  // Get aggregated weekly score (protected: own data only)
  app.get("/api/scores/weekly/:userId", requireAuth, requireResourceOwner("userId"), async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
      const weekStart = req.query.weekStart 
        ? new Date(req.query.weekStart as string)
        : undefined;
      
      const score = await scoreAggregation.getWeeklyScore(userId, weekStart);
      if (!score) {
        return res.status(404).json({ message: "No trips found for this week" });
      }
      res.json(score);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching weekly score: " + error.message });
    }
  });

  // Get aggregated monthly score (protected: own data only)
  app.get("/api/scores/monthly/:userId", requireAuth, requireResourceOwner("userId"), async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
      const monthStart = req.query.monthStart 
        ? new Date(req.query.monthStart as string)
        : undefined;
      
      const score = await scoreAggregation.getMonthlyScore(userId, monthStart);
      if (!score) {
        return res.status(404).json({ message: "No trips found for this month" });
      }
      res.json(score);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching monthly score: " + error.message });
    }
  });

  // Get time-series data (protected: own data only)
  app.get("/api/scores/timeseries/:userId", requireAuth, requireResourceOwner("userId"), async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
      const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      const endDate = new Date(req.query.endDate as string || new Date().toISOString());
      const granularity = (req.query.granularity as 'daily' | 'weekly' | 'monthly') || 'daily';
      
      const data = await scoreAggregation.getTimeSeriesData(userId, startDate, endDate, granularity);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching time-series data: " + error.message });
    }
  });

  // Get score trend (protected: own data only)
  app.get("/api/scores/trend/:userId", requireAuth, requireResourceOwner("userId"), async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
      const period = (req.query.period as 'weekly' | 'monthly') || 'weekly';
      
      const trend = await scoreAggregation.getScoreTrend(userId, period);
      res.json(trend);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching score trend: " + error.message });
    }
  });

  // Report incident (protected: userId set from token)
  app.post("/api/incidents", requireAuth, async (req: AuthRequest, res) => {
    try {
      console.log("Received incident data:", req.body);
      const incidentData = {
        ...req.body,
        userId: req.auth!.userId,
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

  // Get community pool (public read-only)
  app.get("/api/community-pool", async (req, res) => {
    try {
      const pool = await storage.getCommunityPool();
      res.json(pool);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching community pool: " + error.message });
    }
  });

  // Update community pool (admin only; rate limited)
  app.put("/api/community-pool", requireAuth, requireAdmin, poolModificationLimiter, async (req, res) => {
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

  // Get user achievements (protected: own data only)
  app.get("/api/achievements/:userId", requireAuth, requireResourceOwner("userId"), async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user achievements: " + error.message });
    }
  });

  // Refund simulator (protected)
  app.post("/api/simulate-refund", requireAuth, async (req, res) => {
    try {
      const { personalScore, poolSafetyFactor, premiumAmount } = req.body;
      const refund = telematicsProcessor.calculateRefund(personalScore, poolSafetyFactor, premiumAmount);
      res.json({ refund });
    } catch (error: any) {
      res.status(500).json({ message: "Error simulating refund: " + error.message });
    }
  });

  // AI insights (protected: own data only)
  app.get("/api/insights/:userId", requireAuth, requireResourceOwner("userId"), async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
      
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

  // GDPR: Export user data (protected: own data only)
  app.get("/api/gdpr/export/:userId", requireAuth, requireResourceOwner("userId"), async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
      const userData = await storage.exportUserData(userId);

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=driiva-data-${userId}.json`);
      res.json(userData);
    } catch (error: any) {
      res.status(500).json({ message: "Error exporting data: " + error.message });
    }
  });

  // GDPR: Delete user account (protected: own data only; strict rate limit)
  app.delete("/api/gdpr/delete/:userId", requireAuth, requireResourceOwner("userId"), gdprDeleteLimiter, async (req: AuthRequest, res) => {
    try {
      const userId = req.auth!.userId;
      await storage.deleteUserData(userId);
      res.json({ message: "User data deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting user data: " + error.message });
    }
  });

  // Perplexity AI endpoint (protected)
  app.post("/api/ask", requireAuth, async (req, res) => {
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