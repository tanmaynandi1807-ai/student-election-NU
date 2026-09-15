import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/response";

/**
 * Central error handler. Every route/middleware error should end up here
 * (via asyncHandler or next(err)). Never leaks stack traces, Supabase
 * credentials, or raw SQL/database errors to the client — those are logged
 * server-side only.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message);
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, 413, "PAYLOAD_TOO_LARGE", "Photo or video exceeds the maximum allowed size (50MB).");
    }
    return sendError(res, 400, "UPLOAD_ERROR", err.message);
  }

  // Malformed JSON bodies raised by express.json()
  if (
    err &&
    typeof err === "object" &&
    "type" in err &&
    (err as { type?: string }).type === "entity.parse.failed"
  ) {
    return sendError(res, 400, "INVALID_JSON", "Request body is not valid JSON.");
  }

  if (
    err &&
    typeof err === "object" &&
    "status" in err &&
    (err as { status?: number }).status === 413
  ) {
    return sendError(res, 413, "PAYLOAD_TOO_LARGE", "Request payload is too large.");
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);

  return sendError(res, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
}

export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, 404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found.`);
}
