import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon, CheckCircle2 } from "lucide-react";
import { useCloudinaryUpload, type UploadFolder, type CloudinaryUploadResult } from "@/lib/useCloudinaryUpload";
import { toast } from "sonner";

interface ImageUploadProps {
  folder: UploadFolder;
  value?: string;
  onChange: (result: CloudinaryUploadResult | null) => void;
  label?: string;
  hint?: string;
  aspect?: "square" | "banner" | "product";
  maxSizeMb?: number;
}

const ASPECT_CLASSES: Record<string, string> = {
  square: "aspect-square max-w-[160px]",
  banner: "aspect-[3/1] w-full",
  product: "aspect-square max-w-[220px]",
};

export function ImageUpload({
  folder,
  value,
  onChange,
  label = "Subir imagen",
  hint,
  aspect = "product",
  maxSizeMb = 5,
}: ImageUploadProps) {
  const { upload, isUploading, progress } = useCloudinaryUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Tamaño máximo: ${maxSizeMb}MB`);
      return;
    }

    try {
      const result = await upload(file, folder);
      onChange(result);
      toast.success("Imagen subida correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al subir imagen");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      <div
        className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all
          ${dragOver ? "border-[#2563EB] bg-blue-50" : "border-dashed border-gray-300 hover:border-[#2563EB] hover:bg-gray-50"}
          ${ASPECT_CLASSES[aspect]}`}
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {value ? (
          /* Preview */
          <>
            <img src={value} alt="preview" className="w-full h-full object-cover" />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Upload className="w-6 h-6 text-white" />
              <span className="text-white text-xs font-medium">Cambiar imagen</span>
            </div>
            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-10"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : isUploading ? (
          /* Uploading state */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
            <span className="text-sm font-medium text-gray-600">Subiendo... {progress}%</span>
            <div className="w-3/4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">
                {dragOver ? "Suelta para subir" : "Haz click o arrastra aquí"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · Máx. {maxSizeMb}MB</p>
            </div>
          </div>
        )}
      </div>

      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}

/* Compact inline uploader for multiple images (product gallery) */
interface MultiImageUploadProps {
  folder: UploadFolder;
  values: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}

export function MultiImageUpload({ folder, values, onChange, max = 5, label = "Fotos del producto" }: MultiImageUploadProps) {
  const { upload, isUploading } = useCloudinaryUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const remaining = max - values.length;
    const toProcess = Array.from(files).slice(0, remaining);

    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} supera 5MB`); continue; }
      try {
        const result = await upload(file, folder);
        onChange([...values, result.url]);
      } catch (err: any) {
        toast.error(err.message || "Error al subir imagen");
      }
    }
  };

  const removeImage = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {values.map((url, idx) => (
          <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
            <img src={url} alt={`foto ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
            {idx === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5 font-medium">
                Principal
              </div>
            )}
          </div>
        ))}

        {values.length < max && (
          <button
            type="button"
            onClick={() => !isUploading && inputRef.current?.click()}
            disabled={isUploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#2563EB] flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
            ) : (
              <>
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] text-gray-400">Añadir</span>
              </>
            )}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">{values.length}/{max} fotos · La primera será la foto principal</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
