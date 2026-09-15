import { ensurePlainObject, requireTrimmedString } from "./common";
import { Errors } from "../utils/AppError";

export interface JoinCampaignInput {
  full_name: string;
  department: string;
  semester: string;
}

/**
 * Validates the public POST /api/campaign/join payload.
 * Only extracts the three allowed fields — any other fields in the body
 * (e.g. an attempted "isAdmin" or "id") are silently dropped, never trusted.
 */
export function validateJoinCampaignInput(body: unknown): JoinCampaignInput {
  const obj = ensurePlainObject(body);

  const full_name = requireTrimmedString(obj.full_name, "full_name", 150);
  const department = requireTrimmedString(obj.department, "department", 150);
  const semester = requireTrimmedString(obj.semester, "semester", 50);

  // Basic sanity check against obviously malformed input (e.g. pure symbols/control chars).
  const printableRegex = /^[\p{L}\p{N}\s.,'&/()-]+$/u;
  if (!printableRegex.test(full_name)) {
    throw Errors.validation("full_name contains unsupported characters.");
  }

  return { full_name, department, semester };
}
