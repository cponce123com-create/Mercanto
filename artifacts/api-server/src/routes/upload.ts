import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth.js";
import { generateUploadSignature } from "../services/cloudinary.js";

const router: IRouter = Router();

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedContentType = typeof ALLOWED_CONTENT_TYPES[number];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MIME_TO_EXT: Record<AllowedContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// POST /api/upload/sign
// Returns a signed upload signature so the frontend can upload directly to Cloudinary.
// Allowed folders: "stores/logos", "stores/banners", "products"
router.post("/sign", requireAuth, (req, res) => {
  const { folder, contentType, fileSize } = req.body as {
    folder?: string;
    contentType?: string;
    fileSize?: number;
  };

  const allowedFolders = ["stores/logos", "stores/banners", "products"];
  if (!folder || !allowedFolders.includes(folder)) {
    res.status(400).json({
      error: "Carpeta inválida",
      message: "Usa una de: stores/logos | stores/banners | products",
    });
    return;
  }

  if (!contentType || !(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    res.status(400).json({
      error: "Tipo de archivo no permitido",
      message: "contentType es requerido. Solo se permiten: image/jpeg, image/png, image/webp, image/gif.",
    });
    return;
  }

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    res.status(400).json({
      error: "Archivo demasiado grande",
      message: "El tamaño máximo permitido es 5MB.",
    });
    return;
  }

  const ext = MIME_TO_EXT[contentType as AllowedContentType];
  const result = generateUploadSignature(folder, undefined, ext);
  res.json({
    ...result,
    allowedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
    maxFileSize: MAX_FILE_SIZE,
  });
});

export default router;
