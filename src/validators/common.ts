import { Errors } from "../utils/AppError";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Requires a string field, trims it, and enforces a max length.
 * Throws a validation AppError with a field-specific message on failure.
 */
export function requireTrimmedString(
  value: unknown,
  fieldName: string,
  maxLength: number
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw Errors.validation(`${fieldName} is required and cannot be empty.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw Errors.validation(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

/**
 * Optional string field: trims if present, enforces max length, returns
 * undefined if not provided (so callers can distinguish "not provided" from "").
 */
export function optionalTrimmedString(
  value: unknown,
  fieldName: string,
  maxLength: number
): string | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw Errors.validation(`${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw Errors.validation(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

export function validateUUID(value: unknown, fieldName = "id"): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw Errors.validation(`${fieldName} must be a valid UUID.`);
  }
  return value;
}

export function validateStatus(value: unknown): "pending" | "completed" {
  if (value !== "pending" && value !== "completed") {
    throw Errors.validation('status must be either "pending" or "completed".');
  }
  return value;
}

export function optionalDate(value: unknown, fieldName = "work_date"): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !DATE_REGEX.test(value) || Number.isNaN(Date.parse(value))) {
    throw Errors.validation(`${fieldName} must be a valid date in YYYY-MM-DD format.`);
  }
  return value;
}

/**
 * Rejects request bodies that are not plain objects (guards against arrays,
 * null, or primitives being sent where an object is expected).
 */
export function ensurePlainObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw Errors.validation("Request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}
