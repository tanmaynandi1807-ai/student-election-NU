import { Router } from "express";
import { getCompletedWorkPublic } from "../controllers/completedWorkController";

const router = Router();

router.get("/", getCompletedWorkPublic);

export default router;
