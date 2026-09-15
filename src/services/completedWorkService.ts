import { supabaseAdmin } from "../config/supabaseClient";
import { Errors } from "../utils/AppError";
import { generateSafeFileName } from "../utils/fileNaming";
import { CompletedWorkInput } from "../validators/completedWorkValidators";

const BUCKET = "campaign-assets";
const STORAGE_PREFIX = "completed-work";
const PUBLIC_COLUMNS =
  "id, title_en, title_as, description_en, description_as, image_url, work_date, created_at, updated_at";

export interface CompletedWorkRecord {
  id: string;
  title_en: string;
  title_as: string;
  description_en: string | null;
  description_as: string | null;
  image_url: string | null;
  work_date: string | null;
  created_at: string;
  updated_at: string;
}

export async function listCompletedWorkPublic(): Promise<CompletedWorkRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("completed_work")
    .select(PUBLIC_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("listCompletedWorkPublic error:", error.message);
    throw Errors.internal("Unable to retrieve completed work.");
  }

  return data ?? [];
}

export async function listCompletedWorkAdmin(): Promise<CompletedWorkRecord[]> {
  return listCompletedWorkPublic();
}

async function uploadCompletedWorkMedia(file: Express.Multer.File): Promise<string> {
  const fileName = generateSafeFileName(file.mimetype);
  const storagePath = `${STORAGE_PREFIX}/${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    // eslint-disable-next-line no-console
    console.error("uploadCompletedWorkMedia error:", uploadError.message);
    throw Errors.internal("Unable to upload completed work media.");
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

export async function createCompletedWork(
  input: CompletedWorkInput,
  file: Express.Multer.File | undefined
): Promise<CompletedWorkRecord> {
  const image_url = file ? await uploadCompletedWorkMedia(file) : null;
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("completed_work")
    .insert({
      title_en: input.title_en,
      title_as: input.title_as,
      description_en: input.description_en ?? null,
      description_as: input.description_as ?? null,
      work_date: input.work_date ?? null,
      image_url,
      // Set explicitly rather than relying on a DB-side default, since the
      // documented schema does not guarantee created_at/updated_at defaults.
      created_at: now,
      updated_at: now,
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error("createCompletedWork error:", error?.message);
    if (image_url) {
      const path = extractStoragePathFromPublicUrl(image_url);
      if (path) {
        await supabaseAdmin.storage.from(BUCKET).remove([path]).catch(() => undefined);
      }
    }
    throw Errors.internal("Unable to create completed work item.");
  }

  return data;
}

export async function updateCompletedWork(
  id: string,
  input: CompletedWorkInput,
  file: Express.Multer.File | undefined
): Promise<CompletedWorkRecord> {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("completed_work")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    // eslint-disable-next-line no-console
    console.error("updateCompletedWork fetch error:", fetchError.message);
    throw Errors.internal("Unable to update completed work item.");
  }

  if (!existing) {
    throw Errors.notFound("Completed work item not found.");
  }

  const updates: Record<string, unknown> = {
    title_en: input.title_en,
    title_as: input.title_as,
    description_en: input.description_en ?? null,
    description_as: input.description_as ?? null,
    work_date: input.work_date ?? null,
    updated_at: new Date().toISOString(),
  };

  let oldImagePath: string | null = null;
  if (file) {
    updates.image_url = await uploadCompletedWorkMedia(file);
    if (existing.image_url) {
      oldImagePath = extractStoragePathFromPublicUrl(existing.image_url);
    }
  }

  const { data, error } = await supabaseAdmin
    .from("completed_work")
    .update(updates)
    .eq("id", id)
    .select(PUBLIC_COLUMNS)
    .single();

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error("updateCompletedWork error:", error?.message);
    throw Errors.internal("Unable to update completed work item.");
  }

  if (oldImagePath) {
    const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([oldImagePath]);
    if (removeError) {
      // eslint-disable-next-line no-console
      console.error("Failed to remove old completed-work image from storage:", removeError.message);
    }
  }

  return data;
}

export async function deleteCompletedWork(id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("completed_work")
    .select("id, image_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    // eslint-disable-next-line no-console
    console.error("deleteCompletedWork fetch error:", fetchError.message);
    throw Errors.internal("Unable to delete completed work item.");
  }

  if (!existing) {
    throw Errors.notFound("Completed work item not found.");
  }

  const { error } = await supabaseAdmin.from("completed_work").delete().eq("id", id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("deleteCompletedWork error:", error.message);
    throw Errors.internal("Unable to delete completed work item.");
  }

  if (existing.image_url) {
    const path = extractStoragePathFromPublicUrl(existing.image_url);
    if (path) {
      const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
      if (removeError) {
        // eslint-disable-next-line no-console
        console.error("Failed to remove completed-work image from storage:", removeError.message);
      }
    }
  }
}
