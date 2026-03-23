import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth.js";
import { generateUploadSignature } from "../services/cloudinary.js";

const router: IRouter = Router();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/upload/sign
// Returns a signed upload signature so the frontend can upload directly to Cloudinary.
// Allowed folders: "stores/logos", "stores/banners", "products"
router.post("/sign", requireAuth, (req, res) => {
  const { folder, mimeType, fileSize } = req.body as {
    folder?: string;
    mimeType?: string;
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

  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    res.status(400).json({
      error: "Tipo de archivo no permitido",
      message: "Solo se permiten imágenes en formato JPEG, PNG, WebP o GIF.",
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

  const result = generateUploadSignature(folder);
  res.json({
    ...result,
    allowedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
    maxFileSize: MAX_FILE_SIZE,
  });
});

export default router;
