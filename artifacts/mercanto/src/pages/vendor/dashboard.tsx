import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetMyStore, useGetVendorProducts, useUpdateStore } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Eye, Store, AlertCircle, Loader2, Camera } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { type CloudinaryUploadResult } from "@/lib/useCloudinaryUpload";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyStoreQueryKey } from "@workspace/api-client-react";

export default function VendorDashboard() {
  const { data: store, isLoading: storeLoading } = useGetMyStore();
  const { data: products, isLoading: productsLoading } = useGetVendorProducts();
  const queryClient = useQueryClient();

  const updateMutation = useUpdateStore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyStoreQueryKey() });
        toast.success("Imagen actualizada");
      },
      onError: () => toast.error("Error al actualizar imagen"),
    }
  });

  const handleLogoUpload = (result: CloudinaryUploadResult | null) => {
    if (!result || !store) return;
    updateMutation.mutate({ slug: store.slug, data: { logoUrl: result.url } as any });
  };

  const handleBannerUpload = (result: CloudinaryUploadResult | null) => {
    if (!result || !store) return;
    updateMutation.mutate({ slug: store.slug, data: { bannerUrl: result.url } as any });
  };

  if (storeLoading || productsLoading) {
    return (
      <DashboardLayout role="vendor">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!store) {
    return (
      <DashboardLayout role="vendor">
        <div className="max-w-md mx-auto text-center mt-20 p-8 bg-white rounded-2xl border">
          <Store className="w-12 h-12 mx-auto text-gray-400 mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Aún no tienes una tienda</h2>
          <p className="text-gray-500 mb-6">Crea tu perfil de comercio para empezar a vender.</p>
          <Button asChild className="bg-[#2563EB] hover:bg-[#1d4ed8]">
            <Link href="/create-store">Crear Tienda</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const activeProducts = products?.filter(p => p.status === "active").length || 0;

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">¡Hola, {store.name}!</h1>
          <p className="text-gray-500 mt-1 text-sm">Resumen de tu comercio en Mercanto.</p>
        </div>

        {/* Pending alert */}
        {store.status === "pending" && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">Tienda en revisión</h3>
              <p className="text-sm mt-0.5">Tu tienda está pendiente de aprobación. Pronto estará visible al público.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Productos Totales</CardTitle>
              <Package className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1E293B]">{products?.length || 0}</div>
              <p className="text-xs text-gray-400 mt-1">{activeProducts} activos</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Visitas al Perfil</CardTitle>
              <Eye className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1E293B]">{store.totalVisits || 0}</div>
              <p className="text-xs text-gray-400 mt-1">Visitas acumuladas</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</CardTitle>
              <Store className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${store.status === "active" ? "text-[#16A34A]" : "text-amber-600"}`}>
                {store.status === "active" ? "Activa" : "Pendiente"}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {store.status === "active" ? "Visible en el directorio" : "Esperando aprobación"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Imágenes de la tienda */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h2 className="font-bold text-[#1E293B]">Imágenes de tu Tienda</h2>
              <p className="text-xs text-gray-500">Sube tu logo y banner para que los clientes te reconozcan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo */}
            <ImageUpload
              folder="stores/logos"
              value={store.logoUrl || undefined}
              onChange={handleLogoUpload}
              label="Logo de la tienda"
              hint="Aparece como avatar en tu perfil y tarjetas. Recomendado: 200×200px"
              aspect="square"
            />

            {/* Banner */}
            <ImageUpload
              folder="stores/banners"
              value={store.bannerUrl || undefined}
              onChange={handleBannerUpload}
              label="Banner / Foto de portada"
              hint="Aparece en la parte superior de tu perfil. Recomendado: 1200×400px"
              aspect="banner"
            />
          </div>

          {updateMutation.isPending && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[#2563EB]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando imagen...</span>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/vendor/products">
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4 hover:border-[#2563EB] hover:shadow-sm transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-blue-50 text-[#2563EB] rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B]">Gestionar Productos</h3>
                <p className="text-sm text-gray-500 mt-0.5">Añade o edita tu catálogo</p>
              </div>
            </div>
          </Link>

          <Link href={`/stores/${store.slug}`}>
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4 hover:border-[#2563EB] hover:shadow-sm transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-orange-50 text-[#F97316] rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E293B]">Ver mi Tienda</h3>
                <p className="text-sm text-gray-500 mt-0.5">Cómo te ven los clientes</p>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </DashboardLayout>
  );
}
