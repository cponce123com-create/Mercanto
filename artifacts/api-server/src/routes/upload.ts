import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth.js";
import { generateUploadSignature } from "../services/cloudinary.js";

const router: IRouter = Router();

// POST /api/upload/sign
// Returns a signed upload signature so the frontend can upload directly to Cloudinary.
// Allowed folders: "stores/logos", "stores/banners", "products"
router.post("/sign", requireAuth, (req, res) => {
  const { folder } = req.body as { folder?: string };

  const allowedFolders = ["stores/logos", "stores/banners", "products"];
  if (!folder || !allowedFolders.includes(folder)) {
    return res.status(400).json({ error: "Invalid folder. Use: stores/logos | stores/banners | products" });
  }

  const result = generateUploadSignature(folder);
  res.json(result);
});

export default router;
