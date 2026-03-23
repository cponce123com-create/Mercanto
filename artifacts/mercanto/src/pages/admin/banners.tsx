import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useAdminListBanners, useAdminCreateBanner, useAdminUpdateBanner, useAdminDeleteBanner,
  getAdminListBannersQueryKey, type Banner,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, ImageIcon, Pencil, Trash2, Upload, ExternalLink, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCloudinaryUpload } from "@/lib/useCloudinaryUpload";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface BannerForm {
  title: string;
  subtitle: string;
  linkUrl: string;
  imageUrl: string;
  publicId: string;
  isActive: boolean;
  sortOrder: number;
}

function emptyForm(): BannerForm {
  return { title: "", subtitle: "", linkUrl: "", imageUrl: "", publicId: "", isActive: true, sortOrder: 0 };
}

function ImageUploadZone({
  value, onChange, isUploading, progress, onUpload
}: {
  value: string;
  onChange: (url: string, publicId: string) => void;
  isUploading: boolean;
  progress: number;
  onUpload: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>Imagen del Banner</Label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[3/1]">
          <img src={value} alt="Banner preview" className="w-full h-full object-cover" />
          <button
            type="button"
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            onClick={() => onChange("", "")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl aspect-[3/1] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/3 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {isUploading ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Subiendo... {progress}%</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Haz clic para subir imagen</p>
              <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WebP — Recomendado: 1200×400</p>
            </div>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }}
      />
    </div>
  );
}

function BannerFormContent({
  form, setForm
}: { form: BannerForm; setForm: (f: BannerForm) => void }) {
  const { upload, isUploading, progress } = useCloudinaryUpload();

  const handleUpload = async (file: File) => {
    try {
      const result = await upload(file, "stores/banners");
      setForm({ ...form, imageUrl: result.url, publicId: result.publicId });
    } catch (e: any) {
      toast.error(e.message || "Error al subir imagen");
    }
  };

  return (
    <div className="space-y-4">
      <ImageUploadZone
        value={form.imageUrl}
        onChange={(url, publicId) => setForm({ ...form, imageUrl: url, publicId })}
        isUploading={isUploading}
        progress={progress}
        onUpload={handleUpload}
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Título (opcional)</Label>
          <Input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="¡Ofertas de verano!"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Subtítulo (opcional)</Label>
          <Input
            value={form.subtitle}
            onChange={e => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Hasta 50% de descuento"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>URL de destino (opcional)</Label>
        <Input
          value={form.linkUrl}
          onChange={e => setForm({ ...form, linkUrl: e.target.value })}
          placeholder="https://... o /stores"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Orden de aparición</Label>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={form.isActive}
            onCheckedChange={v => setForm({ ...form, isActive: v })}
          />
          <Label>Banner activo</Label>
        </div>
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<BannerForm>(emptyForm());
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BannerForm>(emptyForm());

  const { data: banners, isLoading } = useAdminListBanners();

  const createMutation = useAdminCreateBanner({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListBannersQueryKey() });
        setCreateOpen(false);
        setCreateForm(emptyForm());
        toast.success("Banner creado");
      },
      onError: (e: any) => toast.error(e.message || "Error al crear banner"),
    },
  });

  const updateMutation = useAdminUpdateBanner({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListBannersQueryKey() });
        setEditId(null);
        toast.success("Banner actualizado");
      },
      onError: (e: any) => toast.error(e.message || "Error al actualizar"),
    },
  });

  const deleteMutation = useAdminDeleteBanner({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListBannersQueryKey() });
        toast.success("Banner eliminado");
      },
      onError: (e: any) => toast.error(e.message || "Error al eliminar"),
    },
  });

  const startEdit = (b: Banner) => {
    setEditId(b.id);
    setEditForm({
      title: b.title || "",
      subtitle: b.subtitle || "",
      linkUrl: b.linkUrl || "",
      imageUrl: b.imageUrl,
      publicId: b.publicId || "",
      isActive: b.isActive ?? true,
      sortOrder: b.sortOrder ?? 0,
    });
  };

  const toggleActive = (b: Banner) => {
    updateMutation.mutate({
      id: b.id,
      data: { imageUrl: b.imageUrl, isActive: !b.isActive },
    });
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-display font-bold">Banners & Portadas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {(banners || []).length} banners · Se muestran en el carrusel de la página principal
            </p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Nuevo Banner
          </Button>
        </div>

        {/* Create dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Banner</DialogTitle>
            </DialogHeader>
            <BannerFormContent form={createForm} setForm={setCreateForm} />
            <Button
              className="w-full mt-2"
              disabled={!createForm.imageUrl || createMutation.isPending}
              onClick={() => createMutation.mutate({ data: { ...createForm } })}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear Banner
            </Button>
          </DialogContent>
        </Dialog>

        {/* Banners list */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {(banners || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map(banner => (
              <div
                key={banner.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${!banner.isActive ? "opacity-60" : ""}`}
              >
                {editId === banner.id ? (
                  <div className="p-5 space-y-4">
                    <BannerFormContent form={editForm} setForm={setEditForm} />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditId(null)}
                        disabled={updateMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateMutation.mutate({ id: banner.id, data: { ...editForm } })}
                        disabled={!editForm.imageUrl || updateMutation.isPending}
                      >
                        {updateMutation.isPending
                          ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          : <Check className="w-4 h-4 mr-1" />}
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    {/* Image preview */}
                    <div className="w-48 h-28 bg-gray-100 shrink-0 relative overflow-hidden">
                      {banner.imageUrl
                        ? <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground/30" /></div>
                      }
                      {!banner.isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 py-4 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{banner.title || <span className="text-muted-foreground italic">Sin título</span>}</span>
                        <Badge variant="outline" className="text-xs shrink-0">Orden: {banner.sortOrder ?? 0}</Badge>
                      </div>
                      {banner.subtitle && (
                        <p className="text-sm text-muted-foreground truncate mb-1">{banner.subtitle}</p>
                      )}
                      {banner.linkUrl && (
                        <a
                          href={banner.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> {banner.linkUrl}
                        </a>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col items-end justify-between p-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={banner.isActive ?? true}
                          onCheckedChange={() => toggleActive(banner)}
                          disabled={updateMutation.isPending}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => startEdit(banner)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar banner?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El banner será eliminado permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => deleteMutation.mutate({ id: banner.id })}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {banner.isActive ? "Visible" : "Oculto"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {(banners || []).length === 0 && !isLoading && (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-gray-100 rounded-2xl">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No hay banners creados aún</p>
                <p className="text-sm mt-1">Los banners aparecen en el carrusel de la página principal.</p>
                <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4" /> Crear primer banner
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
