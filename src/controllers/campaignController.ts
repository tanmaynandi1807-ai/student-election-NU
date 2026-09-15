import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { validateJoinCampaignInput } from "../validators/campaignValidators";
import {
  getMemberCount,
  joinCampaign,
  listMembersForAdmin,
} from "../services/campaignMembersService";

export const getCampaignCount = asyncHandler(async (_req: Request, res: Response) => {
  const count = await getMemberCount();
  // Matches the spec's explicit example shape: { success: true, count: 0 }
  // (top-level "count", not nested under "data").
  return res.status(200).json({ success: true, count });
});

export const postCampaignJoin = asyncHandler(async (req: Request, res: Response) => {
  const input = validateJoinCampaignInput(req.body);
  await joinCampaign(input);
  return sendSuccess(res, undefined, "Successfully joined the campaign.", 201);
});

export const getAdminMembers = asyncHandler(async (_req: Request, res: Response) => {
  const members = await listMembersForAdmin();
  return sendSuccess(res, members);
});
