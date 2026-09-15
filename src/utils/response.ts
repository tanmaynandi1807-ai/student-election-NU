import { Response } from "express";

export function sendSuccess(
  res: Response,
  data?: unknown,
  message?: string,
  statusCode = 200
) {
  const body: Record<string, unknown> = { success: true };
  if (data !== undefined) body.data = data;
  if (message !== undefined) body.message = message;
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
