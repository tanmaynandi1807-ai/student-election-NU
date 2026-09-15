import multer from "multer";
import { Request } from "express";
import { Errors } from "../utils/AppError";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);
export const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      Errors.unsupportedMediaType(
        "Only JPEG, PNG, WEBP, GIF, MP4, WEBM, MOV, or OGG files are allowed."
      )
    );
  }
  cb(null, true);
}

/**
 * In-memory storage: the file buffer is uploaded directly to Supabase Storage
 * from the controller/service and never written to local disk.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MEDIA_SIZE_BYTES, files: 1 },
  fileFilter,
});

export const MEDIA_EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
};
