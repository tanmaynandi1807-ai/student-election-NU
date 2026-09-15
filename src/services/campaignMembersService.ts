import { supabaseAdmin } from "../config/supabaseClient";
import { Errors } from "../utils/AppError";
import { JoinCampaignInput } from "../validators/campaignValidators";

export async function getMemberCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("campaign_members")
    .select("id", { count: "exact", head: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("getMemberCount error:", error.message);
    throw Errors.internal("Unable to retrieve campaign member count.");
  }

  return count ?? 0;
}

export async function joinCampaign(input: JoinCampaignInput): Promise<void> {
  const { error } = await supabaseAdmin.from("campaign_members").insert({
    full_name: input.full_name,
    department: input.department,
    semester: input.semester,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("joinCampaign error:", error.message);
    throw Errors.internal("Unable to join the campaign at this time.");
  }
}

export interface CampaignMemberRecord {
  id: string;
  full_name: string;
  department: string;
  semester: string;
  joined_at: string;
}

export async function listMembersForAdmin(): Promise<CampaignMemberRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("campaign_members")
    .select("id, full_name, department, semester, joined_at")
    .order("joined_at", { ascending: false });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("listMembersForAdmin error:", error.message);
    throw Errors.internal("Unable to retrieve campaign members.");
  }

  return data ?? [];
}
