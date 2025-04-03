import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./migrations";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Logging middleware for API calls
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
  try {
    // ✅ Run database migrations before starting the server
    log("Running database migrations...");
    await runMigrations();
    log("✅ Database migrations completed!");
  } catch (error) {
    log(`❌ Failed to run database migrations: ${error}`, "error");
    // Continue even if migrations fail
  }

  // ✅ Register API routes
  const server = await registerRoutes(app);

  // ✅ Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`❌ Error: ${message}`, "error");

    res.status(status).json({ message });
  });

  // ✅ Setup Vite for development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ✅ Start the server on `127.0.0.1` (fixes Windows issue)
  const PORT = 5000;
  const HOST = "127.0.0.1"; // Use localhost instead of 0.0.0.0

  server.listen(PORT, HOST, () => {
    log(`🚀 Server running at http://${HOST}:${PORT}`);
  });

})();
