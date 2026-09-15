import { ensurePlainObject, optionalTrimmedString } from "./common";

export interface GalleryInput {
  caption_en?: string | null;
  caption_as?: string | null;
}

/**
 * Validates the non-file fields of gallery create/update requests.
 * The image file itself is validated separately by the upload middleware.
 */
export function validateGalleryInput(body: unknown): GalleryInput {
  const obj = ensurePlainObject(body);
  const caption_en = optionalTrimmedString(obj.caption_en, "caption_en", 500);
  const caption_as = optionalTrimmedString(obj.caption_as, "caption_as", 500);
  return { caption_en, caption_as };
}
