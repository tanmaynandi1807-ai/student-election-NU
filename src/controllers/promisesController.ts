import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { validateUUID } from "../validators/common";
import { validatePromiseInput } from "../validators/promiseValidators";
import {
  createPromise,
  deletePromise,
  listPromisesAdmin,
  listPromisesPublic,
  updatePromise,
} from "../services/promisesService";

export const getPromisesPublic = asyncHandler(async (_req: Request, res: Response) => {
  const promises = await listPromisesPublic();
  return sendSuccess(res, promises);
});

export const getPromisesAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const promises = await listPromisesAdmin();
  return sendSuccess(res, promises);
});

export const postPromise = asyncHandler(async (req: Request, res: Response) => {
  const input = validatePromiseInput(req.body);
  const created = await createPromise(input);
  return sendSuccess(res, created, "Promise created successfully.", 201);
});

export const putPromise = asyncHandler(async (req: Request, res: Response) => {
  const id = validateUUID(req.params.id, "id");
  const input = validatePromiseInput(req.body);
  const updated = await updatePromise(id, input);
  return sendSuccess(res, updated, "Promise updated successfully.");
});

export const deletePromiseHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = validateUUID(req.params.id, "id");
  await deletePromise(id);
  return sendSuccess(res, undefined, "Promise deleted successfully.");
});
