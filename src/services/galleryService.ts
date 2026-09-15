import { supabaseAdmin } from "../config/supabaseClient";
import { Errors } from "../utils/AppError";
import { generateSafeFileName } from "../utils/fileNaming";
import { GalleryInput } from "../validators/galleryValidators";

const BUCKET = "campaign-gallery";
const PUBLIC_COLUMNS = "id, image_url, caption_en, caption_as, created_at";

export interface GalleryRecord {
  id: string;
  image_url: string;
  caption_en: string | null;
  caption_as: string | null;
  created_at: string;
}

export async function listGalleryPublic(): Promise<GalleryRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("gallery")
    .select(PUBLIC_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("listGalleryPublic error:", error.message);
    throw Errors.internal("Unable to retrieve gallery.");
  }

  return data ?? [];
}

export async function listGalleryAdmin(): Promise<GalleryRecord[]> {
  return listGalleryPublic();
}

/**
 * Uploads a photo or video buffer to the campaign-gallery Storage bucket under a
 * generated, collision-safe path, and returns its public URL.
 */
async function uploadGalleryMedia(file: Express.Multer.File): Promise<string> {
  const fileName = generateSafeFileName(file.mimetype);
  const storagePath = `gallery/${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    // eslint-disable-next-line no-console
    console.error("uploadGalleryMedia error:", uploadError.message);
    throw Errors.internal("Unable to upload gallery media.");
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrlData.publicUrl;
}

function extractStoragePathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export async function createGalleryItem(
  input: GalleryInput,
  file: Express.Multer.File | undefined
): Promise<GalleryRecord> {
  if (!file) {
    throw Errors.validation("A photo or video file is required.");
  }

  const image_url = await uploadGalleryMedia(file);

  const { data, error } = await supabaseAdmin
    .from("gallery")
    .insert({
      image_url,
      caption_en: input.caption_en ?? null,
      caption_as: input.caption_as ?? null,
      // Set explicitly rather than relying on a DB-side default, since the
      // documented schema does not guarantee a created_at default.
      created_at: new Date().toISOString(),
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error("createGalleryItem error:", error?.message);
    // Attempt to clean up the orphaned storage object if the DB insert failed.
    const path = extractStoragePathFromPublicUrl(image_url);
    if (path) {
      await supabaseAdmin.storage.from(BUCKET).remove([path]).catch(() => undefined);
    }
    throw Errors.internal("Unable to create gallery item.");
  }

  return data;
}

export async function updateGalleryItem(
  id: string,
  input: GalleryInput,
  file: Express.Multer.File | undefined
): Promise<GalleryRecord> {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("gallery")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    // eslint-disable-next-line no-console
    console.error("updateGalleryItem fetch error:", fetchError.message);
    throw Errors.internal("Unable to update gallery item.");
  }

  if (!existing) {
    throw Errors.notFound("Gallery item not found.");
  }

  const updates: Record<string, unknown> = {};
  if (input.caption_en !== undefined) updates.caption_en = input.caption_en;
  if (input.caption_as !== undefined) updates.caption_as = input.caption_as;

  let oldImagePath: string | null = null;
  if (file) {
    updates.image_url = await uploadGalleryMedia(file);
    oldImagePath = extractStoragePathFromPublicUrl(existing.image_url);
  }

  // Nothing to change (no captions supplied, no new image) — return the
  // existing record as-is rather than sending an empty PATCH body to
  // PostgREST, which some Supabase/PostgREST versions reject as invalid.
  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from("gallery")
    .update(updates)
    .eq("id", id)
    .select(PUBLIC_COLUMNS)
    .single();

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error("updateGalleryItem error:", error?.message);
    throw Errors.internal("Unable to update gallery item.");
  }

  // Only remove the old image after the DB update succeeds.
  if (oldImagePath) {
    const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([oldImagePath]);
    if (removeError) {
      // eslint-disable-next-line no-console
      console.error("Failed to remove old gallery image from storage:", removeError.message);
      // Non-fatal: the DB record is already correctly updated.
    }
  }

  return data;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("gallery")
    .select("id, image_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    // eslint-disable-next-line no-console
    console.error("deleteGalleryItem fetch error:", fetchError.message);
    throw Errors.internal("Unable to delete gallery item.");
  }

  if (!existing) {
    throw Errors.notFound("Gallery item not found.");
  }

  const { error } = await supabaseAdmin.from("gallery").delete().eq("id", id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("deleteGalleryItem error:", error.message);
    throw Errors.internal("Unable to delete gallery item.");
  }

  const path = extractStoragePathFromPublicUrl(existing.image_url);
  if (path) {
    const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (removeError) {
      // eslint-disable-next-line no-console
      console.error("Failed to remove gallery image from storage:", removeError.message);
      // The DB record is gone; the storage object failing to delete is logged
      // but does not fail the request since the primary resource is removed.
    }
  }
}
