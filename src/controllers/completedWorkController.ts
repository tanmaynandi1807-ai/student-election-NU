import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { validateUUID } from "../validators/common";
import { validateCompletedWorkInput } from "../validators/completedWorkValidators";
import {
  createCompletedWork,
  deleteCompletedWork,
  listCompletedWorkAdmin,
  listCompletedWorkPublic,
  updateCompletedWork,
} from "../services/completedWorkService";

export const getCompletedWorkPublic = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listCompletedWorkPublic();
  return sendSuccess(res, items);
});

export const getCompletedWorkAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listCompletedWorkAdmin();
  return sendSuccess(res, items);
});

export const postCompletedWork = asyncHandler(async (req: Request, res: Response) => {
  const input = validateCompletedWorkInput(req.body);
  const created = await createCompletedWork(input, req.file);
  return sendSuccess(res, created, "Completed work item created successfully.", 201);
});

export const putCompletedWork = asyncHandler(async (req: Request, res: Response) => {
  const id = validateUUID(req.params.id, "id");
  const input = validateCompletedWorkInput(req.body);
  const updated = await updateCompletedWork(id, input, req.file);
  return sendSuccess(res, updated, "Completed work item updated successfully.");
});

export const deleteCompletedWorkHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = validateUUID(req.params.id, "id");
  await deleteCompletedWork(id);
  return sendSuccess(res, undefined, "Completed work item deleted successfully.");
});
