import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export function generateUploadSignature(folder: string, publicId?: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = {
    timestamp,
    folder: `mercanto/${folder}`,
  };
  if (publicId) params.public_id = publicId;

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: params.folder,
    publicId,
  };
}

export async function deleteCloudinaryAsset(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (_) {
    // non-critical
  }
}
