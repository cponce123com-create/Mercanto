import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useGetMyStore, useUpdateStore, useListCategories,
  getGetMyStoreQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Store, MapPin, Phone, Globe, Instagram, Facebook, Image as ImageIcon, CreditCard, Clock, Truck } from "lucide-react";
import { useCloudinaryUpload } from "@/lib/useCloudinaryUpload";
import { DISTRICTS } from "@/lib/constants";

const NO_CATEGORY = "__none__";

const PAYMENT_OPTIONS = [
  { id: "efectivo", label: "Efectivo" },
  { id: "yape", label: "Yape" },
  { id: "plin", label: "Plin" },
  { id: "transferencia", label: "Transferencia bancaria" },
  { id: "visa", label: "Tarjeta Visa/Mastercard" },
  { id: "contra_entrega", label: "Contra entrega" },
];

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface StoreForm {
  name: string;
  description: string;
  categoryId: string;
  location: string;
  district: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  website: string;
  logoUrl: string;
  logoPublicId: string;
  bannerUrl: string;
  bannerPublicId: string;
  paymentMethods: string[];
  openingHours: Record<string, string>;
  doesDelivery: boolean;
  deliveryRadius: string;
}

function ImageField({
  label, value, onUpload, folder, aspect, isUploading, progress
}: {
  label: string;
  value: string;
  onUpload: (file: File) => void;
  folder: "stores/logos" | "stores/banners";
  aspect: string;
  isUploading: boolean;
  progress: number;
}) {
  const inputId = `img-${folder.replace("/", "-")}`;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={`border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors ${aspect}`}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        {isUploading ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        ) : value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
            <ImageIcon className="w-7 h-7 mb-1" />
            <span className="text-xs">Subir imagen</span>
          </div>
        )}
      </div>
      <input
        id={inputId}
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

export default function VendorStoreSettings() {
  const queryClient = useQueryClient();
  const { data: store, isLoading } = useGetMyStore();
  const { data: categoriesData } = useListCategories();

  const logoUpload = useCloudinaryUpload();
  const bannerUpload = useCloudinaryUpload();

  const [form, setForm] = useState<StoreForm>({
    name: "", description: "", categoryId: NO_CATEGORY,
    location: "", district: "", whatsapp: "",
    instagram: "", facebook: "", website: "",
    logoUrl: "", logoPublicId: "", bannerUrl: "", bannerPublicId: "",
    paymentMethods: [], openingHours: {}, doesDelivery: false, deliveryRadius: "",
  });

  useEffect(() => {
    if (store) {
      const s = store as any;
      setForm({
        name: store.name || "",
        description: store.description || "",
        categoryId: store.categoryId?.toString() || NO_CATEGORY,
        location: store.location || "",
        district: store.district || "",
        whatsapp: store.whatsapp || "",
        instagram: store.instagram || "",
        facebook: store.facebook || "",
        website: store.website || "",
        logoUrl: store.logoUrl || "",
        logoPublicId: "",
        bannerUrl: store.bannerUrl || "",
        bannerPublicId: "",
        paymentMethods: Array.isArray(s.paymentMethods) ? s.paymentMethods : [],
        openingHours: (s.openingHours && typeof s.openingHours === "object") ? s.openingHours : {},
        doesDelivery: s.doesDelivery ?? false,
        deliveryRadius: s.deliveryRadius?.toString() || "",
      });
    }
  }, [store]);

  const updateMutation = useUpdateStore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyStoreQueryKey() });
        toast.success("¡Tienda actualizada correctamente!");
      },
      onError: (e: any) => toast.error(e.message || "Error al actualizar"),
    },
  });

  const handleLogoUpload = async (file: File) => {
    try {
      const result = await logoUpload.upload(file, "stores/logos");
      setForm(f => ({ ...f, logoUrl: result.url, logoPublicId: result.publicId }));
    } catch (e: any) {
      toast.error(e.message || "Error al subir logo");
    }
  };

  const handleBannerUpload = async (file: File) => {
    try {
      const result = await bannerUpload.upload(file, "stores/banners");
      setForm(f => ({ ...f, bannerUrl: result.url, bannerPublicId: result.publicId }));
    } catch (e: any) {
      toast.error(e.message || "Error al subir portada");
    }
  };

  const togglePayment = (id: string) => {
    setForm(f => ({
      ...f,
      paymentMethods: f.paymentMethods.includes(id)
        ? f.paymentMethods.filter(m => m !== id)
        : [...f.paymentMethods, id],
    }));
  };

  const handleHours = (day: string, value: string) => {
    setForm(f => ({ ...f, openingHours: { ...f.openingHours, [day]: value } }));
  };

  const handleSave = () => {
    if (!store?.slug) return;
    updateMutation.mutate({
      slug: store.slug,
      data: {
        name: form.name,
        description: form.description || undefined,
        categoryId: form.categoryId !== NO_CATEGORY ? Number(form.categoryId) : undefined,
        location: form.location || undefined,
        district: form.district || undefined,
        whatsapp: form.whatsapp || undefined,
        instagram: form.instagram || undefined,
        facebook: form.facebook || undefined,
        website: form.website || undefined,
        logoUrl: form.logoUrl || undefined,
        logoPublicId: form.logoPublicId || undefined,
        bannerUrl: form.bannerUrl || undefined,
        bannerPublicId: form.bannerPublicId || undefined,
        paymentMethods: form.paymentMethods as any,
        openingHours: Object.keys(form.openingHours).length > 0 ? (form.openingHours as any) : undefined,
        doesDelivery: form.doesDelivery,
        deliveryRadius: form.deliveryRadius ? Number(form.deliveryRadius) : undefined,
      } as any,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="vendor">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!store) {
    return (
      <DashboardLayout role="vendor">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Store className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">No tienes una tienda aún</h2>
          <p className="text-muted-foreground mb-4">Crea tu tienda para empezar a vender.</p>
          <Button onClick={() => window.location.href = "/create-store"}>Crear Tienda</Button>
        </div>
      </DashboardLayout>
    );
  }

  const categories = categoriesData || [];

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Ajustes de Tienda</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Personaliza tu perfil público</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || logoUpload.isUploading || bannerUpload.isUploading}
            className="gap-2"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </Button>
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2 mb-1">
            <ImageIcon className="w-4 h-4" /> Imágenes
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <ImageField
              label="Logo de la tienda"
              value={form.logoUrl}
              onUpload={handleLogoUpload}
              folder="stores/logos"
              aspect="aspect-square"
              isUploading={logoUpload.isUploading}
              progress={logoUpload.progress}
            />
            <ImageField
              label="Portada / Banner"
              value={form.bannerUrl}
              onUpload={handleBannerUpload}
              folder="stores/banners"
              aspect="aspect-square"
              isUploading={bannerUpload.isUploading}
              progress={bannerUpload.progress}
            />
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2 mb-1">
            <Store className="w-4 h-4" /> Información General
          </h2>
          <div className="space-y-1.5">
            <Label>Nombre de la tienda *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Mi Tienda"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe tu tienda y los productos que ofreces..."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>Sin categoría</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4" /> Ubicación
          </h2>
          <div className="space-y-1.5">
            <Label>Distrito</Label>
            <Select value={form.district || ""} onValueChange={v => setForm(f => ({ ...f, district: v }))}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecciona distrito" />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Dirección o referencia</Label>
            <Input
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Jr. Progreso 123, mercado central..."
            />
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4" /> Delivery
          </h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.doesDelivery}
              onChange={e => setForm(f => ({ ...f, doesDelivery: e.target.checked }))}
              className="w-4 h-4 accent-primary rounded"
            />
            <span className="text-sm font-medium">Ofrezco servicio de delivery</span>
          </label>
          {form.doesDelivery && (
            <div className="space-y-1.5">
              <Label>Radio de cobertura (km)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={form.deliveryRadius}
                onChange={e => setForm(f => ({ ...f, deliveryRadius: e.target.value }))}
                placeholder="Ej: 5"
                className="max-w-[140px]"
              />
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4" /> Métodos de Pago
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">Selecciona los métodos que aceptas</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map(opt => (
              <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.paymentMethods.includes(opt.id)}
                  onChange={() => togglePayment(opt.id)}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Opening hours */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" /> Horario de Atención
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">Ej: "8:00 - 18:00" o "Cerrado"</p>
          <div className="space-y-2">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 shrink-0">{day}</span>
                <Input
                  value={form.openingHours[day] || ""}
                  onChange={e => handleHours(day, e.target.value)}
                  placeholder="8:00 - 18:00"
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4" /> Contacto y Redes
          </h2>
          <div className="space-y-1.5">
            <Label>WhatsApp (número Perú, sin +51)</Label>
            <Input
              value={form.whatsapp}
              onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
              placeholder="987654321"
              type="tel"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </Label>
              <Input
                value={form.instagram}
                onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                placeholder="@mitienda"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5" /> Facebook
              </Label>
              <Input
                value={form.facebook}
                onChange={e => setForm(f => ({ ...f, facebook: e.target.value }))}
                placeholder="facebook.com/mitienda"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Sitio Web
            </Label>
            <Input
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="https://mitienda.com"
              type="url"
            />
          </div>
        </div>

        {/* Save bottom */}
        <div className="flex justify-end pb-4">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={updateMutation.isPending || logoUpload.isUploading || bannerUpload.isUploading}
            className="gap-2 px-8"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
