import { useState } from "react";
import { getStoredToken } from "@/lib/contexts";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

interface SignResponse {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export type UploadFolder = "stores/logos" | "stores/banners" | "products";

export function useCloudinaryUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File, folder: UploadFolder): Promise<CloudinaryUploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      // Step 1: Get signature from backend
      const token = getStoredToken();
      const signRes = await fetch(`${import.meta.env.BASE_URL}api/upload/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ folder }),
      });

      if (!signRes.ok) {
        const err = await signRes.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo firmar la subida");
      }

      const sign: SignResponse = await signRes.json();

      // Step 2: Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sign.apiKey);
      formData.append("timestamp", sign.timestamp.toString());
      formData.append("signature", sign.signature);
      formData.append("folder", sign.folder);

      const uploadRes = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            resolve({
              url: data.secure_url,
              publicId: data.public_id,
              width: data.width,
              height: data.height,
              format: data.format,
            });
          } else {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error?.message || "Error al subir imagen"));
          }
        };

        xhr.onerror = () => reject(new Error("Error de red al subir imagen"));
        xhr.send(formData);
      });

      return uploadRes;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return { upload, isUploading, progress };
}
