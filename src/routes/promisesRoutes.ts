import { Router } from "express";
import { getPromisesPublic } from "../controllers/promisesController";

const router = Router();

router.get("/", getPromisesPublic);

export default router;
