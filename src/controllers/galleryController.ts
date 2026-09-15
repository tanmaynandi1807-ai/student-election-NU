import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { validateUUID } from "../validators/common";
import { validateGalleryInput } from "../validators/galleryValidators";
import {
  createGalleryItem,
  deleteGalleryItem,
  listGalleryAdmin,
  listGalleryPublic,
  updateGalleryItem,
} from "../services/galleryService";

export const getGalleryPublic = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listGalleryPublic();
  return sendSuccess(res, items);
});

export const getGalleryAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listGalleryAdmin();
  return sendSuccess(res, items);
});

export const postGalleryItem = asyncHandler(async (req: Request, res: Response) => {
  const input = validateGalleryInput(req.body);
  const created = await createGalleryItem(input, req.file);
  return sendSuccess(res, created, "Gallery item created successfully.", 201);
});

export const putGalleryItem = asyncHandler(async (req: Request, res: Response) => {
  const id = validateUUID(req.params.id, "id");
  const input = validateGalleryInput(req.body);
  const updated = await updateGalleryItem(id, input, req.file);
  return sendSuccess(res, updated, "Gallery item updated successfully.");
});

export const deleteGalleryItemHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = validateUUID(req.params.id, "id");
  await deleteGalleryItem(id);
  return sendSuccess(res, undefined, "Gallery item deleted successfully.");
});
