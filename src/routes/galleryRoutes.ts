import { Router } from "express";
import { getGalleryPublic } from "../controllers/galleryController";

const router = Router();

router.get("/", getGalleryPublic);

export default router;
