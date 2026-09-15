import { v4 as uuidv4 } from "uuid";
import { MEDIA_EXTENSION_BY_MIME } from "../middleware/imageUpload";

/**
 * Generates a safe, unique storage filename from a MIME type.
 * Never uses the client-provided original filename, which avoids path
 * traversal, collisions, and leaking client-controlled strings into storage keys.
 */
export function generateSafeFileName(mimetype: string): string {
  const ext = MEDIA_EXTENSION_BY_MIME[mimetype] || "bin";
  return `${uuidv4()}.${ext}`;
}
