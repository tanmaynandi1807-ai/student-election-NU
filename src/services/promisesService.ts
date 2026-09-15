import { supabaseAdmin } from "../config/supabaseClient";
import { Errors } from "../utils/AppError";
import { PromiseInput } from "../validators/promiseValidators";

export interface PromiseRecord {
  id: string;
  title_en: string;
  title_as: string;
  description_en: string | null;
  description_as: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const PUBLIC_COLUMNS =
  "id, title_en, title_as, description_en, description_as, status, completed_at, created_at, updated_at";

export async function listPromisesPublic(): Promise<PromiseRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("promises")
    .select(PUBLIC_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("listPromisesPublic error:", error.message);
    throw Errors.internal("Unable to retrieve promises.");
  }

  return data ?? [];
}

export async function listPromisesAdmin(): Promise<PromiseRecord[]> {
  return listPromisesPublic();
}

export async function createPromise(input: PromiseInput): Promise<PromiseRecord> {
  const now = new Date().toISOString();
  const completed_at = input.status === "completed" ? now : null;

  const { data, error } = await supabaseAdmin
    .from("promises")
    .insert({
      title_en: input.title_en,
      title_as: input.title_as,
      description_en: input.description_en ?? null,
      description_as: input.description_as ?? null,
      status: input.status,
      completed_at,
      // Set explicitly rather than relying on a DB-side default, since the
      // documented schema does not guarantee created_at/updated_at defaults.
      created_at: now,
      updated_at: now,
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error("createPromise error:", error?.message);
    throw Errors.internal("Unable to create promise.");
  }

  return data;
}

export async function updatePromise(id: string, input: PromiseInput): Promise<PromiseRecord> {
  // Fetch existing record first so we know whether completed_at is already set,
  // and whether the promise even exists (so we can return a proper 404).
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("promises")
    .select("id, status, completed_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    // eslint-disable-next-line no-console
    console.error("updatePromise fetch error:", fetchError.message);
    throw Errors.internal("Unable to update promise.");
  }

  if (!existing) {
    throw Errors.notFound("Promise not found.");
  }

  let completed_at: string | null;
  if (input.status === "completed") {
    completed_at = existing.completed_at ?? new Date().toISOString();
  } else {
    completed_at = null;
  }

  const { data, error } = await supabaseAdmin
    .from("promises")
    .update({
      title_en: input.title_en,
      title_as: input.title_as,
      description_en: input.description_en ?? null,
      description_as: input.description_as ?? null,
      status: input.status,
      completed_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(PUBLIC_COLUMNS)
    .single();

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error("updatePromise error:", error?.message);
    throw Errors.internal("Unable to update promise.");
  }

  return data;
}

export async function deletePromise(id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("promises")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    // eslint-disable-next-line no-console
    console.error("deletePromise fetch error:", fetchError.message);
    throw Errors.internal("Unable to delete promise.");
  }

  if (!existing) {
    throw Errors.notFound("Promise not found.");
  }

  const { error } = await supabaseAdmin.from("promises").delete().eq("id", id);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("deletePromise error:", error.message);
    throw Errors.internal("Unable to delete promise.");
  }
}
