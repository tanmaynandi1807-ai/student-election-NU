import { Router } from "express";
import { getCampaignCount, postCampaignJoin } from "../controllers/campaignController";
import { joinCampaignLimiter } from "../middleware/rateLimiters";

const router = Router();

router.get("/count", getCampaignCount);
router.post("/join", joinCampaignLimiter, postCampaignJoin);

export default router;
