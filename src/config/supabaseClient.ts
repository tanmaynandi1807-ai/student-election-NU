import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * IMPORTANT:
 * This client uses the SUPABASE_SERVICE_ROLE_KEY, which bypasses Row Level Security.
 * It must NEVER be imported into any client-facing/frontend code, and its responses
 * must never leak the key itself. Only backend services/controllers should use this.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
