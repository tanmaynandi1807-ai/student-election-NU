/**
 * Standard application error carrying an HTTP status, a machine-readable
 * error code, and a human-readable message. Thrown from controllers/services
 * and caught by the global error handler middleware.
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const Errors = {
  validation: (message: string) => new AppError(400, "VALIDATION_ERROR", message),
  unauthorized: (message = "Authentication required.") =>
    new AppError(401, "UNAUTHORIZED", message),
  forbidden: (message = "You do not have permission to perform this action.") =>
    new AppError(403, "FORBIDDEN", message),
  notFound: (message = "Resource not found.") => new AppError(404, "NOT_FOUND", message),
  conflict: (message: string) => new AppError(409, "CONFLICT", message),
  payloadTooLarge: (message = "Request payload is too large.") =>
    new AppError(413, "PAYLOAD_TOO_LARGE", message),
  unsupportedMediaType: (message = "Unsupported file type.") =>
    new AppError(415, "UNSUPPORTED_MEDIA_TYPE", message),
  tooManyRequests: (message = "Too many requests. Please try again later.") =>
    new AppError(429, "TOO_MANY_REQUESTS", message),
  internal: (message = "An unexpected error occurred.") =>
    new AppError(500, "INTERNAL_ERROR", message),
};
