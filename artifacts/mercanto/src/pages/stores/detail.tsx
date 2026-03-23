import { useRoute, useLocation, Link } from "wouter";
import {
  useGetStoreBySlug, useIncrementStoreVisit,
  useGetStoreReviews, useCreateReview, useDeleteReview,
  getGetStoreReviewsQueryKey,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/contexts";
import { useEffect, useState } from "react";
import {
  MapPin, Phone, Globe, Instagram, Facebook, Store as StoreIcon,
  Loader2, Star, Trash2, Edit2, Send, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/shared/ProductCard";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string | Date): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`;
  if (diff < 31536000) return `hace ${Math.floor(diff / 2592000)} meses`;
  return `hace ${Math.floor(diff / 31536000)} años`;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ─── Star selector ────────────────────────────────────────────────────────────

function StarSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${(hover || value) >= n ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Stars display ─────────────────────────────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`${cls} transition-colors ${n <= Math.round(rating) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

// ─── Review form ──────────────────────────────────────────────────────────────

const reviewSchema = z.object({
  rating: z.number().min(1, "Selecciona una calificación").max(5),
  comment: z.string().min(10, "Mínimo 10 caracteres").max(500, "Máximo 500 caracteres"),
});

interface ReviewFormProps {
  storeSlug: string;
  existingReview?: { id: number; rating: number; comment?: string | null } | null;
  onDone: () => void;
}

function ReviewForm({ storeSlug, existingReview, onDone }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const createMutation = useCreateReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoreReviewsQueryKey(storeSlug) });
        toast.success("¡Reseña publicada!");
        onDone();
      },
      onError: (err: any) => toast.error(err?.message || "Error al publicar reseña"),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = reviewSchema.safeParse({ rating, comment });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(err => { errs[err.path[0]] = err.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    createMutation.mutate({ storeSlug, data: { rating, comment } });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
      <h4 className="font-bold text-[#1E293B]">
        {existingReview ? "Editar tu reseña" : "Deja tu reseña"}
      </h4>

      <div>
        <StarSelector value={rating} onChange={setRating} />
        {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
      </div>

      <div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Cuéntanos tu experiencia con esta tienda..."
          maxLength={500}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] bg-white"
        />
        <div className="flex justify-between mt-1">
          {errors.comment ? <p className="text-red-500 text-xs">{errors.comment}</p> : <span />}
          <span className="text-xs text-gray-400">{comment.length}/500</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-[#2563EB] hover:bg-[#1d4ed8] gap-2"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Publicar Reseña
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

// ─── Reviews section ──────────────────────────────────────────────────────────

function ReviewsSection({ storeSlug }: { storeSlug: string }) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useGetStoreReviews(storeSlug);

  const deleteMutation = useDeleteReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoreReviewsQueryKey(storeSlug) });
        toast.success("Reseña eliminada");
      },
      onError: () => toast.error("Error al eliminar reseña"),
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /></div>;
  }

  const myReview = reviews.find(r => r.userId === user?.id);
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // Distribution
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  const displayed = showAll ? reviews : reviews.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* ── Rating overview ── */}
      {reviews.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
          {/* Big number */}
          <div className="flex flex-col items-center justify-center shrink-0 min-w-[120px]">
            <div className="text-6xl font-black text-[#1E293B]">{avg.toFixed(1)}</div>
            <Stars rating={avg} size="lg" />
            <p className="text-xs text-gray-500 mt-2 text-center">basado en {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 w-full space-y-2">
            {dist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-right text-gray-500 font-medium">{star}</span>
                <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B] shrink-0" />
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500 text-xs">{pct}%</span>
                <span className="w-6 text-right text-gray-400 text-xs">({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Form / auth prompt ── */}
      {isAuthenticated ? (
        myReview ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 mb-1">Tu reseña:</p>
              <Stars rating={myReview.rating} />
              <p className="text-sm text-gray-700 mt-1.5">{myReview.comment}</p>
            </div>
            <button
              onClick={() => deleteMutation.mutate({ id: myReview.id })}
              disabled={deleteMutation.isPending}
              className="shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        ) : showForm ? (
          <ReviewForm storeSlug={storeSlug} onDone={() => setShowForm(false)} />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-[#2563EB]/40 rounded-2xl p-5 text-center hover:border-[#2563EB] hover:bg-blue-50 transition-all group"
          >
            <div className="flex gap-1 justify-center mb-1">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} className="w-5 h-5 text-gray-300 group-hover:text-[#F59E0B] transition-colors" />
              ))}
            </div>
            <p className="text-sm font-semibold text-[#2563EB]">Escribe una reseña</p>
            <p className="text-xs text-gray-400 mt-0.5">Comparte tu experiencia con esta tienda</p>
          </button>
        )
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
          <p className="text-gray-600 text-sm mb-3">Inicia sesión para dejar una reseña</p>
          <Button
            size="sm"
            onClick={() => setLocation("/login")}
            className="bg-[#2563EB] hover:bg-[#1d4ed8] gap-2"
          >
            <LogIn className="w-4 h-4" /> Iniciar Sesión
          </Button>
        </div>
      )}

      {/* ── Reviews list ── */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          Sé el primero en dejar una reseña sobre esta tienda.
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(r => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0 font-bold text-[#2563EB] text-sm">
                  {r.user?.avatarUrl
                    ? <img src={r.user.avatarUrl} alt={r.user.name} className="w-full h-full rounded-full object-cover" />
                    : initials(r.user?.name || "U")}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-semibold text-sm text-[#1E293B]">{r.user?.name || "Usuario"}</span>
                    <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  <div className="mt-0.5 mb-2">
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            </div>
          ))}

          {reviews.length > 10 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors"
            >
              Ver más reseñas ({reviews.length - 10} restantes)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StoreDetail() {
  const [, params] = useRoute("/stores/:slug");
  const slug = params?.slug || "";

  const { data: store, isLoading } = useGetStoreBySlug(slug, {
    query: { enabled: !!slug, retry: false },
  });

  const visitMutation = useIncrementStoreVisit();
  useEffect(() => {
    if (slug) visitMutation.mutate({ slug });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
          <StoreIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
          <h1 className="text-2xl font-bold mb-2">Comercio no encontrado</h1>
          <p className="text-muted-foreground">La tienda que buscas no existe o fue removida.</p>
        </div>
      </div>
    );
  }

  const handleWhatsApp = () => {
    if (!store.whatsapp) return;
    const num = store.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${num.startsWith("51") ? num : `51${num}`}`, "_blank");
  };

  const avg = store.averageRating ? Number(store.averageRating) : null;
  const reviewCount = store.reviewCount || 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFC" }}>
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Banner */}
        <div className="h-48 md:h-72 w-full bg-gray-200 relative overflow-hidden">
          {store.bannerUrl ? (
            <img src={store.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #2563EB22, #F9731622)" }} />
          )}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        <div className="container mx-auto px-4 -mt-14 md:mt-[-72px] relative z-10">
          {/* Info card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 md:p-8 flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="w-28 h-28 md:w-36 md:h-36 shrink-0 rounded-2xl border-4 border-white bg-gray-100 shadow-md overflow-hidden flex items-center justify-center -mt-10 md:-mt-14 relative z-20">
              {store.logoUrl
                ? <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                : <StoreIcon className="w-10 h-10 text-gray-400 opacity-50" />}
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#1E293B] mb-2">{store.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                    {store.category && (
                      <Badge variant="secondary" className="bg-blue-50 text-[#2563EB] border-blue-100">
                        {store.category.name}
                      </Badge>
                    )}
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {store.district}</span>
                    {avg !== null && (
                      <span className="flex items-center gap-1 text-[#F59E0B] font-semibold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {avg.toFixed(1)}
                        <span className="text-gray-400 font-normal">({reviewCount} reseña{reviewCount !== 1 ? "s" : ""})</span>
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 leading-relaxed max-w-2xl text-sm md:text-base">{store.description}</p>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                  <Button
                    size="lg"
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white h-12 rounded-xl gap-2 w-full md:w-auto"
                    onClick={handleWhatsApp}
                    disabled={!store.whatsapp}
                  >
                    <Phone className="w-5 h-5" /> Contactar por WhatsApp
                  </Button>
                  {store.lat && store.lng && (
                    <Link href={`/map?district=${encodeURIComponent(store.district)}&storeId=${store.id}`}>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-12 rounded-xl gap-2 w-full border-primary/30 text-primary hover:bg-primary/5"
                      >
                        <MapPin className="w-5 h-5" /> Ubica en el mapa
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-gray-100">
                {store.location && <span className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-4 h-4 shrink-0" /> {store.location}</span>}
                {store.instagram && <a href={store.instagram} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-[#2563EB] flex items-center gap-1.5 transition-colors"><Instagram className="w-4 h-4" /> Instagram</a>}
                {store.facebook && <a href={store.facebook} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-[#2563EB] flex items-center gap-1.5 transition-colors"><Facebook className="w-4 h-4" /> Facebook</a>}
                {store.website && <a href={store.website} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-[#2563EB] flex items-center gap-1.5 transition-colors"><Globe className="w-4 h-4" /> Sitio Web</a>}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <Tabs defaultValue="products">
              <TabsList className="bg-white border border-gray-100 w-full justify-start rounded-xl p-1 h-auto mb-6 shadow-sm">
                <TabsTrigger
                  value="products"
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-[#2563EB] data-[state=active]:text-white"
                >
                  Productos ({store.products?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-[#2563EB] data-[state=active]:text-white"
                >
                  Reseñas {reviewCount > 0 && `(${reviewCount})`}
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-[#2563EB] data-[state=active]:text-white"
                >
                  Sobre Nosotros
                </TabsTrigger>
              </TabsList>

              {/* Products tab */}
              <TabsContent value="products">
                {store.products && store.products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {store.products.map(p => (
                      <ProductCard key={p.id} product={p} storeWhatsapp={store.whatsapp} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">Esta tienda aún no ha agregado productos.</p>
                  </div>
                )}
              </TabsContent>

              {/* Reviews tab */}
              <TabsContent value="reviews">
                <ReviewsSection storeSlug={slug} />
              </TabsContent>

              {/* About tab */}
              <TabsContent value="about">
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-lg text-[#1E293B] mb-4">Información de la Tienda</h3>
                  <div className="space-y-3 text-gray-600">
                    {store.description && <p className="leading-relaxed">{store.description}</p>}
                    {store.location && <p><strong className="text-[#1E293B]">Dirección:</strong> {store.location}, {store.district}</p>}
                    {store.district && <p><strong className="text-[#1E293B]">Distrito:</strong> {store.district}, Chanchamayo, Junín</p>}
                    {store.whatsapp && <p><strong className="text-[#1E293B]">WhatsApp:</strong> +{store.whatsapp}</p>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
