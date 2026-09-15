import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseClient";
import { Errors } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export interface AuthenticatedRequest extends Request {
  adminUserId?: string;
}

/**
 * Admin authentication + authorization middleware.
 *
 * 1. Reads the Bearer token from the Authorization header.
 * 2. Verifies it against Supabase Auth (supabase.auth.getUser).
 * 3. Confirms the resulting user UUID exists in public.admin_profiles.
 *
 * Never trusts any client-supplied "isAdmin" flag — admin status is only
 * ever derived from the admin_profiles table via the service-role client.
 *
 * Responds 401 for missing/invalid tokens, 403 for authenticated
 * non-administrators.
 */
export const requireAdmin = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw Errors.unauthorized("Missing or malformed Authorization header.");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      throw Errors.unauthorized("Missing bearer token.");
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      throw Errors.unauthorized("Invalid or expired authentication token.");
    }

    const userId = userData.user.id;

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from("admin_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (adminError) {
      // eslint-disable-next-line no-console
      console.error("Error checking admin_profiles:", adminError.message);
      throw Errors.internal("Unable to verify administrator status.");
    }

    if (!adminProfile) {
      throw Errors.forbidden("You are not authorized to access this resource.");
    }

    req.adminUserId = userId;
    next();
  }
);
