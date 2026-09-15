import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { imageUpload } from "../middleware/imageUpload";
import { getAdminMembers } from "../controllers/campaignController";
import {
  deletePromiseHandler,
  getPromisesAdmin,
  postPromise,
  putPromise,
} from "../controllers/promisesController";
import {
  deleteGalleryItemHandler,
  getGalleryAdmin,
  postGalleryItem,
  putGalleryItem,
} from "../controllers/galleryController";
import {
  deleteCompletedWorkHandler,
  getCompletedWorkAdmin,
  postCompletedWork,
  putCompletedWork,
} from "../controllers/completedWorkController";

const router = Router();

// Every route in this file requires a valid Supabase Auth session
// belonging to a user registered in admin_profiles.
router.use(requireAdmin);

// Members (read-only for admins)
router.get("/members", getAdminMembers);

// Promises
router.get("/promises", getPromisesAdmin);
router.post("/promises", postPromise);
router.put("/promises/:id", putPromise);
router.delete("/promises/:id", deletePromiseHandler);

// Gallery (multipart/form-data with an "image" file field for photos or videos)
router.get("/gallery", getGalleryAdmin);
router.post("/gallery", imageUpload.single("image"), postGalleryItem);
router.put("/gallery/:id", imageUpload.single("image"), putGalleryItem);
router.delete("/gallery/:id", deleteGalleryItemHandler);

// Completed work (multipart/form-data with an optional "image" file field for photos or videos)
router.get("/completed-work", getCompletedWorkAdmin);
router.post("/completed-work", imageUpload.single("image"), postCompletedWork);
router.put("/completed-work/:id", imageUpload.single("image"), putCompletedWork);
router.delete("/completed-work/:id", deleteCompletedWorkHandler);

export default router;
