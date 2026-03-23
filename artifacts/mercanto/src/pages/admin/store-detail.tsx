import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ArrowLeft, Store as StoreIcon, MapPin, Phone, Star, Package, MessageSquare,
  Eye, EyeOff, CheckCircle2, XCircle, Loader2, Trash2, ExternalLink,
  Users, BarChart2, ToggleLeft, ToggleRight, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "wouter";

// ─── API helpers ──────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Error");
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminStore {
  id: number; name: string; slug: string; description?: string | null;
  logoUrl?: string | null; bannerUrl?: string | null;
  district?: string | null; location?: string | null; whatsapp?: string | null;
  status: string; isFeatured: boolean | null;
  totalVisits?: number | null; createdAt?: string | null;
  category?: { id: number; name: string; icon?: string | null } | null;
  owner?: { id: number; name: string; email: string; role: string; isBlocked: boolean | null } | null;
  productCount: number; reviewCount: number; averageRating?: number | null;
}

interface AdminProduct {
  id: number; name: string; slug: string; price: string; offerPrice?: string | null;
  stock: number; unit?: string | null; status: string;
  description?: string | null;
  images: { id: number; url: string; publicId: string; sortOrder: number }[];
}

interface AdminReview {
  id: number; rating: number; comment?: string | null; isVisible: boolean | null;
  createdAt?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date?: string | null): string {
  if (!date) return "";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`;
  return `hace ${Math.floor(diff / 2592000)} meses`;
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    active:   { label: "Activa",     cls: "bg-green-100 text-green-700 border-green-200" },
    pending:  { label: "Pendiente",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
    rejected: { label: "Suspendida", cls: "bg-red-100 text-red-700 border-red-200" },
    inactive: { label: "Inactiva",   cls: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const c = cfg[status] || cfg.inactive;
  return <Badge variant="outline" className={`${c.cls} font-semibold`}>{c.label}</Badge>;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-4 h-4 ${n <= Math.round(rating) ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-gray-200 text-gray-200"}`} />
      ))}
    </div>
  );
}

// ─── Products panel ───────────────────────────────────────────────────────────

function ProductsPanel({ storeId }: { storeId: number }) {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery<AdminProduct[]>({
    queryKey: ["admin", "store-products", storeId],
    queryFn: () => apiFetch(`/admin/stores/${storeId}/products`),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/admin/products/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store-products", storeId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "store-detail", storeId] });
      toast.success("Estado del producto actualizado");
    },
    onError: () => toast.error("Error al actualizar producto"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store-products", storeId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "store-detail", storeId] });
      toast.success("Producto eliminado");
    },
    onError: () => toast.error("Error al eliminar producto"),
  });

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /></div>;

  if (products.length === 0) return (
    <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-200">
      Esta tienda no tiene productos registrados.
    </div>
  );

  const active = products.filter(p => p.status === "active").length;
  const inactive = products.filter(p => p.status !== "active").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> {active} activos
        </span>
        <span className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 px-3 py-1 rounded-full font-medium">
          <XCircle className="w-3.5 h-3.5" /> {inactive} inactivos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {products.map(p => {
          const img = p.images[0]?.url;
          const isActive = p.status === "active";
          return (
            <div key={p.id} className={`bg-white border rounded-xl overflow-hidden flex gap-3 p-3 transition-all ${!isActive ? "opacity-60 border-red-200" : "border-gray-100"}`}>
              {/* Image */}
              <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                {img
                  ? <img src={img} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm text-[#1E293B] line-clamp-1">{p.name}</p>
                  <Badge variant="outline" className={isActive
                    ? "text-green-700 border-green-200 bg-green-50 text-xs shrink-0"
                    : "text-red-600 border-red-200 bg-red-50 text-xs shrink-0"}>
                    {isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[#16A34A]">S/ {p.price}</span>
                  {p.offerPrice && <span className="text-xs text-[#F97316] font-semibold bg-orange-50 px-1.5 rounded">Oferta S/ {p.offerPrice}</span>}
                </div>
                <p className="text-xs text-gray-400">Stock: {p.stock} {p.unit}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 text-xs px-2 ${isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-700 border-green-200 hover:bg-green-50"}`}
                  onClick={() => statusMutation.mutate({ id: p.id, status: isActive ? "inactive" : "active" })}
                  disabled={statusMutation.isPending}
                >
                  {isActive ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                </Button>
                {confirmDelete === p.id ? (
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="destructive" className="h-6 text-xs px-2"
                      onClick={() => { deleteMutation.mutate(p.id); setConfirmDelete(null); }}>
                      ¿Confirmar?
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                      onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-gray-400 hover:text-red-500"
                    onClick={() => setConfirmDelete(p.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reviews panel ────────────────────────────────────────────────────────────

function ReviewsPanel({ storeId }: { storeId: number }) {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery<AdminReview[]>({
    queryKey: ["admin", "store-reviews", storeId],
    queryFn: () => apiFetch(`/admin/stores/${storeId}/reviews`),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/reviews/${id}/visible`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store-reviews", storeId] });
      toast.success("Visibilidad de reseña actualizada");
    },
    onError: () => toast.error("Error al actualizar reseña"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store-reviews", storeId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "store-detail", storeId] });
      toast.success("Reseña eliminada");
    },
    onError: () => toast.error("Error al eliminar reseña"),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /></div>;

  if (reviews.length === 0) return (
    <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-200">
      Esta tienda no tiene reseñas.
    </div>
  );

  const visible = reviews.filter(r => r.isVisible).length;
  const hidden = reviews.filter(r => !r.isVisible).length;
  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      <div className="flex gap-3 text-sm flex-wrap">
        <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-[#2563EB] px-3 py-1 rounded-full font-medium">
          <Eye className="w-3.5 h-3.5" /> {visible} visibles
        </span>
        <span className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-500 px-3 py-1 rounded-full font-medium">
          <EyeOff className="w-3.5 h-3.5" /> {hidden} ocultas
        </span>
        <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
          <Star className="w-3.5 h-3.5 fill-current" /> Promedio: {avg}
        </span>
      </div>

      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r.id} className={`bg-white border rounded-xl p-4 transition-all ${!r.isVisible ? "opacity-50 border-dashed" : "border-gray-100"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-[#1E293B]">{r.user?.name || "Anónimo"}</span>
                  <span className="text-xs text-gray-400">{r.user?.email}</span>
                  {!r.isVisible && <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">Oculta</Badge>}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  size="sm" variant="outline"
                  className={`h-8 text-xs gap-1 ${r.isVisible ? "text-gray-500 hover:text-red-600" : "text-[#2563EB] hover:text-blue-700"}`}
                  onClick={() => toggleMutation.mutate(r.id)}
                  disabled={toggleMutation.isPending}
                  title={r.isVisible ? "Ocultar" : "Mostrar"}
                >
                  {r.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {r.isVisible ? "Ocultar" : "Mostrar"}
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className="h-8 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 gap-1"
                  onClick={() => deleteMutation.mutate(r.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Borrar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminStoreDetail() {
  const [, params] = useRoute("/admin/stores/:id");
  const [, setLocation] = useLocation();
  const storeId = parseInt(params?.id || "0");
  const queryClient = useQueryClient();

  const { data: store, isLoading } = useQuery<AdminStore>({
    queryKey: ["admin", "store-detail", storeId],
    queryFn: () => apiFetch(`/admin/stores/${storeId}/detail`),
    enabled: !!storeId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiFetch(`/admin/stores/${storeId}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store-detail", storeId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
      toast.success("Estado de tienda actualizado");
    },
    onError: () => toast.error("Error al actualizar tienda"),
  });

  const featuredMutation = useMutation({
    mutationFn: () => apiFetch(`/admin/stores/${storeId}/featured`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store-detail", storeId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stores"] });
      toast.success(store?.isFeatured ? "Tienda removida de destacados" : "Tienda marcada como destacada");
    },
    onError: () => toast.error("Error"),
  });

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" /></div>
      </DashboardLayout>
    );
  }

  if (!store) {
    return (
      <DashboardLayout role="admin">
        <div className="text-center py-20 text-gray-400">
          <StoreIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Tienda no encontrada</p>
          <Button variant="link" onClick={() => setLocation("/admin/stores")}>Volver</Button>
        </div>
      </DashboardLayout>
    );
  }

  const isActive = store.status === "active";

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Back + breadcrumb */}
        <button
          onClick={() => setLocation("/admin/stores")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#2563EB] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Tiendas
        </button>

        {/* ── Store header card ── */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-28 w-full bg-gradient-to-r from-blue-50 to-indigo-100 relative">
            {store.bannerUrl && <img src={store.bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="p-5 flex flex-col md:flex-row gap-5 items-start -mt-8">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl border-4 border-white bg-gray-100 shrink-0 overflow-hidden shadow-md flex items-center justify-center relative z-10">
              {store.logoUrl
                ? <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                : <StoreIcon className="w-8 h-8 text-gray-400 opacity-50" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 mt-4 md:mt-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-[#1E293B]">{store.name}</h1>
                    <StatusBadge status={store.status} />
                    {store.isFeatured && (
                      <Badge className="bg-[#F97316] text-white">⭐ Destacada</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                    {store.category && <span className="flex items-center gap-1"><span>{store.category.icon}</span>{store.category.name}</span>}
                    {store.district && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{store.district}</span>}
                    {store.whatsapp && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />+{store.whatsapp}</span>}
                    {store.averageRating && (
                      <span className="flex items-center gap-1 text-[#F59E0B]">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {Number(store.averageRating).toFixed(1)} ({store.reviewCount} reseñas)
                      </span>
                    )}
                  </div>
                  {store.location && <p className="text-xs text-gray-400 mt-1">{store.location}</p>}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={isActive
                      ? "text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                      : "text-green-700 border-green-200 hover:bg-green-50 gap-1.5"}
                    onClick={() => statusMutation.mutate(isActive ? "rejected" : "active")}
                    disabled={statusMutation.isPending}
                  >
                    {statusMutation.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isActive ? "Suspender Tienda" : "Activar Tienda"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 ${store.isFeatured ? "text-amber-600 border-amber-200" : "text-gray-500"}`}
                    onClick={() => featuredMutation.mutate()}
                    disabled={featuredMutation.isPending || !isActive}
                    title={!isActive ? "Activa la tienda para destacarla" : ""}
                  >
                    <Star className={`w-4 h-4 ${store.isFeatured ? "fill-[#F59E0B] text-[#F59E0B]" : ""}`} />
                    {store.isFeatured ? "Quitar Destacado" : "Destacar"}
                  </Button>

                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <Link href={`/stores/${store.slug}`} target="_blank">
                      <ExternalLink className="w-4 h-4" /> Ver Pública
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Package, label: "Productos", value: store.productCount, color: "text-[#2563EB]" },
            { icon: MessageSquare, label: "Reseñas", value: store.reviewCount, color: "text-[#F97316]" },
            { icon: BarChart2, label: "Visitas", value: store.totalVisits || 0, color: "text-[#16A34A]" },
            { icon: Star, label: "Promedio", value: store.averageRating ? Number(store.averageRating).toFixed(1) : "—", color: "text-[#F59E0B]" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Icon className={`w-4 h-4 ${color}`} /> {label}
              </div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── Owner info ── */}
        {store.owner && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center font-bold text-[#2563EB] text-sm shrink-0">
              {store.owner.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#1E293B]">{store.owner.name}</p>
              <p className="text-xs text-gray-500">{store.owner.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">{store.owner.role}</Badge>
              {store.owner.isBlocked && <Badge variant="destructive" className="text-xs">Bloqueado</Badge>}
            </div>
            <Users className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
        )}

        {/* ── Tabs: products + reviews ── */}
        <Tabs defaultValue="products">
          <TabsList className="bg-white border border-gray-100 rounded-xl p-1 h-auto shadow-sm">
            <TabsTrigger
              value="products"
              className="rounded-lg px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-[#2563EB] data-[state=active]:text-white"
            >
              <Package className="w-4 h-4 mr-1.5" />
              Productos ({store.productCount})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-lg px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-[#2563EB] data-[state=active]:text-white"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Reseñas ({store.reviewCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <ProductsPanel storeId={storeId} />
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <ReviewsPanel storeId={storeId} />
          </TabsContent>
        </Tabs>

        {/* ── Danger zone ── */}
        {store.status !== "active" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-700 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Esta tienda está <strong>{store.status === "pending" ? "pendiente de aprobación" : "suspendida"}</strong> y no es visible al público.</span>
            <Button size="sm" className="ml-auto bg-green-600 hover:bg-green-700 text-white shrink-0 gap-1.5"
              onClick={() => statusMutation.mutate("active")}
              disabled={statusMutation.isPending}>
              <ShieldCheck className="w-4 h-4" /> Activar
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
