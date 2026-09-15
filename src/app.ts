import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimiters";
import { Errors } from "./utils/AppError";

import healthRoutes from "./routes/healthRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import promisesRoutes from "./routes/promisesRoutes";
import galleryRoutes from "./routes/galleryRoutes";
import completedWorkRoutes from "./routes/completedWorkRoutes";
import adminRoutes from "./routes/adminRoutes";

export function createApp() {
  const app = express();

  // Trust proxy (needed for correct client IPs behind Replit/other reverse proxies,
  // which the rate limiter relies on).
  app.set("trust proxy", 1);

  // Secure HTTP headers
  app.use(helmet());

  // CORS: only the configured frontend origin(s) are allowed. Never "*" — admin
  // routes rely on Authorization headers and credentials semantics.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser tools (no Origin header) and any explicitly configured origin.
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(Errors.forbidden("This origin is not allowed to access this API."));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Body parsing with a reasonable size limit (image uploads go through multer's
  // separate multipart handling, not this JSON body parser).
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Baseline rate limiting across the whole API.
  app.use(globalLimiter);

  // Routes
  app.use("/api/health", healthRoutes);
  app.use("/api/campaign", campaignRoutes);
  app.use("/api/promises", promisesRoutes);
  app.use("/api/gallery", galleryRoutes);
  app.use("/api/completed-work", completedWorkRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
