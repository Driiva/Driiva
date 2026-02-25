import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, sanitizeInput, errorHandler, apiLimiter } from "./middleware/security";

const app = express();

// Apply security headers
app.use(securityHeaders);

// CORS: allow only approved origins (app domain + localhost for dev). No wildcard.
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:5173,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const CORS_ORIGIN_SET = new Set(CORS_ORIGINS);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGIN_SET.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Input sanitization
app.use(sanitizeInput);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Use the centralized error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default 3001 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const PORT = parseInt(process.env.PORT || '3001', 10);

  server.listen(PORT, () => {
    log(`Server running on http://localhost:${PORT}`);
  });
})();
