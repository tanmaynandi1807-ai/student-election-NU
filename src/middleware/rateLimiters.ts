import rateLimit from "express-rate-limit";
import { sendError } from "../utils/response";

/**
 * Limits how often a single client can hit the public campaign-join endpoint,
 * to deter spam/bulk submissions without needing captchas.
 */
export const joinCampaignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 join attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      429,
      "TOO_MANY_REQUESTS",
      "Too many join attempts. Please try again later."
    );
  },
});

/**
 * General-purpose looser limiter, applied globally as a baseline safety net.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, "TOO_MANY_REQUESTS", "Too many requests. Please try again later.");
  },
});
