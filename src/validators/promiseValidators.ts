import {
  ensurePlainObject,
  optionalTrimmedString,
  requireTrimmedString,
  validateStatus,
} from "./common";

export interface PromiseInput {
  title_en: string;
  title_as: string;
  description_en?: string | null;
  description_as?: string | null;
  status: "pending" | "completed";
}

/**
 * Validates POST/PUT /api/admin/promises body.
 * created_at / updated_at / completed_at are intentionally never read from
 * the client — they are always derived server-side.
 */
export function validatePromiseInput(body: unknown): PromiseInput {
  const obj = ensurePlainObject(body);

  const title_en = requireTrimmedString(obj.title_en, "title_en", 300);
  const title_as = requireTrimmedString(obj.title_as, "title_as", 300);
  const description_en = optionalTrimmedString(obj.description_en, "description_en", 5000);
  const description_as = optionalTrimmedString(obj.description_as, "description_as", 5000);
  const status = validateStatus(obj.status ?? "pending");

  return { title_en, title_as, description_en, description_as, status };
}
