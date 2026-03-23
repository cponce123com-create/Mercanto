import { Link, useLocation } from "wouter";
import { useListStores, useListCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useDistrict } from "@/lib/contexts";
import { ChevronDown, ArrowRight, MapPin, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { DISTRICTS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OfferProduct {
  id: number;
  name: string;
  slug: string;
  storeSlug: string;
  storeName: string;
  price: string;
  offerPrice: string;
  images: Array<{ url: string }>;
  category: { name: string; icon?: string | null } | null;
}

function fmtPrice(price: string | number | null | undefined) {
  if (!price) return null;
  return `S/ ${parseFloat(String(price)).toFixed(2)}`;
}

const CATEGORY_ICONS: Record<string, { emoji: string; bg: string }> = {
  "Abarrotes y Bodega":   { emoji: "🛒", bg: "#EF4444" },
  "Frutas y Verduras":    { emoji: "🍎", bg: "#22C55E" },
  "Ropa y Calzado":       { emoji: "👔", bg: "#8B5CF6" },
  "Hogar y Decoración":   { emoji: "🏠", bg: "#F59E0B" },
  "Electrónica":          { emoji: "💻", bg: "#3B82F6" },
  "Café y Cacao":         { emoji: "☕", bg: "#92400E" },
  "Artesanía Local":      { emoji: "🎨", bg: "#EC4899" },
  "Salud y Belleza":      { emoji: "💄", bg: "#F43F5E" },
  "Panadería y Pasteles": { emoji: "🥖", bg: "#D97706" },
  "Carnes y Pescados":    { emoji: "🥩", bg: "#DC2626" },
  "Miel y Apicultura":    { emoji: "🍯", bg: "#F59E0B" },
  "Plantas y Hierbas":    { emoji: "🌿", bg: "#16A34A" },
  "Bebidas y Jugos":      { emoji: "🥤", bg: "#0EA5E9" },
  "Muebles":              { emoji: "🛋️", bg: "#78716C" },
  "Ferretería":           { emoji: "🔧", bg: "#6B7280" },
  "Deportes":             { emoji: "⚽", bg: "#10B981" },
  "Mascotas":             { emoji: "🐾", bg: "#F97316" },
  "Restaurante":          { emoji: "🍽️", bg: "#EF4444" },
  "Servicios":            { emoji: "⚙️", bg: "#6366F1" },
  "Otros":                { emoji: "📦", bg: "#94A3B8" },
};

const CAT_FALLBACK = { emoji: "📦", bg: "#94A3B8" };

const FEATURE_BANNERS = [
  {
    slug: "frutas-y-verduras",
    label: "Frutas y Verduras Frescas",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&auto=format&fit=crop",
  },
  {
    slug: "ropa-y-calzado",
    label: "Moda & Accesorios",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop",
  },
  {
    slug: "electronica",
    label: "Tecnología y Gadgets",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80&auto=format&fit=crop",
  },
];

const STORE_PHOTOS = [
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80&auto=format&fit=crop",
];

const OFFER_PHOTOS = [
  "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=300&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541643600914-78b084683702?w=300&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80&auto=format&fit=crop",
];

const BANNERS = [
  {
    id: 1,
    headline1: "Ofertas",
    headline2: "de la Semana",
    pill: "¡Descuentos Imperdibles!",
    badge: "-50%",
    from: "#f97316",
    to: "#ef4444",
    emojis: ["🛒", "🍊", "👟", "📸", "🎒"],
  },
  {
    id: 2,
    headline1: "Café",
    headline2: "Directo del Productor",
    pill: "El mejor de Chanchamayo",
    badge: "LOCAL",
    from: "#2563eb",
    to: "#1e40af",
    emojis: ["☕", "🌿", "🏔️", "🫘", "✨"],
  },
  {
    id: 3,
    headline1: "Artesanía",
    headline2: "Amazónica Única",
    pill: "Apoya lo local",
    badge: "ÚNICO",
    from: "#16a34a",
    to: "#166534",
    emojis: ["🎨", "🌺", "🦜", "🌿", "🏺"],
  },
];

function BannerCarousel() {
  const [cur, setCur] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    timer.current = setInterval(() => setCur(p => (p + 1) % BANNERS.length), 4000);
  };
  useEffect(() => { start(); return () => { if (timer.current) clearInterval(timer.current); }; }, []);

  const go = (i: number) => {
    if (timer.current) clearInterval(timer.current);
    setCur(i);
    start();
  };

  const b = BANNERS[cur];
  return (
    <div className="relative w-full h-52 md:h-64 rounded-xl overflow-hidden select-none"
      style={{ background: `linear-gradient(135deg, ${b.from} 0%, ${b.to} 100%)` }}>
      {/* Wave decoration */}
      <svg className="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 400 80" preserveAspectRatio="none">
        <path d="M0,40 Q100,80 200,40 T400,40 L400,80 L0,80Z" fill="white"/>
      </svg>

      {/* Content */}
      <div className="relative h-full flex items-center px-8 md:px-12 gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-white leading-tight mb-2">
            <span className="text-3xl md:text-5xl font-black">{b.headline1}</span>
            <span className="text-2xl md:text-4xl font-light ml-2">{b.headline2}</span>
          </h2>
          <div className="inline-block bg-white/25 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-3 border border-white/30">
            {b.pill}
          </div>
          <div>
            <span className="inline-block bg-[#EF4444] text-white font-black text-lg px-3 py-1 rounded-lg shadow-lg">
              {b.badge}
            </span>
          </div>
        </div>
        {/* Product imagery */}
        <div className="flex gap-2 items-center shrink-0 opacity-90">
          {b.emojis.map((e, i) => (
            <div key={i} className="text-3xl md:text-5xl drop-shadow-lg transform"
              style={{ rotate: `${(i - 2) * 8}deg`, translateY: i % 2 === 0 ? '-4px' : '4px' }}>
              {e}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <button onClick={() => go((cur - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/40 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={() => go((cur + 1) % BANNERS.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/40 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm">
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === cur ? "w-6 bg-white" : "w-2 bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { district, setDistrict } = useDistrict();
  const [, setLocation] = useLocation();

  const { data: featured, isLoading: loadingFeatured } = useListStores({ district, featured: true, limit: 4 });
  const { data: categories } = useListCategories();

  const { data: offers, isLoading: loadingOffers } = useQuery<OfferProduct[]>({
    queryKey: ["/api/products/offers", district],
    queryFn: async () => {
      const params = new URLSearchParams({ district, limit: "8" });
      const res = await fetch(`${import.meta.env.BASE_URL}api/products/offers?${params}`);
      if (!res.ok) throw new Error("err");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFC" }}>
      <Navbar />

      {/* District selector bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2.5 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <span className="text-[#1E293B] font-semibold text-base md:text-lg">
              Compra en tu Distrito:
            </span>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="border-none shadow-none bg-transparent p-0 h-auto text-[#EF4444] font-bold text-base md:text-lg hover:bg-transparent focus:ring-0 gap-0.5 w-auto [&>svg]:hidden">
                <SelectValue />
                <ChevronDown className="w-4 h-4 text-[#EF4444] ml-0.5 inline" />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-gray-500 text-xs md:text-sm">Productos cerca de ti para recoger en tienda</p>
        </div>
      </div>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 space-y-5">

          {/* ── Banner rotativo ── */}
          <BannerCarousel />

          {/* ── 3 Feature banners con foto ── */}
          <div className="grid grid-cols-3 gap-3">
            {FEATURE_BANNERS.map(fb => (
              <Link key={fb.slug} href={`/stores?category=${fb.slug}`}>
                <div className="relative h-28 md:h-36 rounded-xl overflow-hidden cursor-pointer group">
                  <img
                    src={fb.img}
                    alt={fb.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="text-white font-bold text-xs md:text-sm leading-tight drop-shadow-md">
                      {fb.label}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Categorías Populares ── */}
          <section className="bg-white rounded-xl py-5 px-4 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-[#1E293B] text-center mb-4">Categorías Populares</h2>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {(categories || []).slice(0, 7).map(cat => {
                const ci = CATEGORY_ICONS[cat.name] || CAT_FALLBACK;
                return (
                  <Link key={cat.id} href={`/stores?category=${cat.slug}`}>
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                      <div
                        className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-sm group-hover:scale-110 transition-transform"
                        style={{ background: ci.bg }}
                      >
                        {ci.emoji}
                      </div>
                      <span className="text-xs font-medium text-[#1E293B] text-center leading-tight group-hover:text-[#2563EB] transition-colors line-clamp-2">
                        {cat.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Tiendas Destacadas ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#1E293B]">Tiendas Destacadas</h2>
              <Link href="/stores" className="text-[#2563EB] text-sm flex items-center gap-0.5 hover:underline font-medium">
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingFeatured ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /></div>
            ) : featured?.stores && featured.stores.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {featured.stores.map((store, idx) => (
                  <Link key={store.id} href={`/stores/${store.slug}`}>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-[#2563EB]/30 transition-all group cursor-pointer">
                      {/* Store image */}
                      <div className="relative h-28 md:h-32 overflow-hidden bg-gray-100">
                        {store.bannerUrl ? (
                          <img src={store.bannerUrl} alt={store.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <img
                            src={STORE_PHOTOS[idx % STORE_PHOTOS.length]}
                            alt={store.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="font-semibold text-sm text-[#1E293B] mb-0.5 line-clamp-1">{store.name}</p>
                        {store.district && (
                          <p className="text-xs text-gray-400 flex items-center gap-0.5 mb-2">
                            <MapPin className="w-3 h-3" /> {store.district}
                          </p>
                        )}
                        <button className="w-full py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg transition-colors">
                          Ver Tienda
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-500 text-sm mb-3">No hay tiendas destacadas en {district} aún.</p>
                <button onClick={() => setLocation('/create-store')}
                  className="px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors">
                  Registra tu tienda
                </button>
              </div>
            )}
          </section>

          {/* ── Ofertas Cercanas ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#1E293B]">Ofertas Cercanas</h2>
              <Link href="/stores" className="text-[#2563EB] text-sm flex items-center gap-0.5 hover:underline font-medium">
                Ver más <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingOffers ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /></div>
            ) : offers && offers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {offers.slice(0, 8).map((product, idx) => (
                  <Link key={product.id} href={`/stores/${product.storeSlug}`}>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-[#2563EB]/30 transition-all group cursor-pointer">
                      <div className="relative h-32 md:h-40 bg-gray-50 overflow-hidden">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <img
                            src={OFFER_PHOTOS[idx % OFFER_PHOTOS.length]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        )}
                        {/* Oferta badge */}
                        <div className="absolute top-2 right-2 bg-[#EF4444] text-white text-xs font-bold px-2 py-0.5 rounded">
                          Oferta
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-[#1E293B] line-clamp-2 mb-1.5 leading-tight min-h-[2.5rem]">
                          {product.name}
                        </p>
                        <p className="text-xl font-black text-[#16A34A] leading-none">
                          {fmtPrice(product.offerPrice)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-500 text-sm">No hay ofertas disponibles en {district} por ahora.</p>
              </div>
            )}
          </section>

          {/* ── Banners promocionales dobles ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            <div className="rounded-xl overflow-hidden relative flex items-center gap-4 px-5 py-4 cursor-pointer hover:brightness-105 transition-all"
              style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}>
              <div className="absolute right-3 top-0 bottom-0 flex items-center opacity-20 text-7xl pointer-events-none select-none">
                🎁
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="text-4xl">🎁</div>
                <div>
                  <p className="text-white font-bold text-base leading-tight">Promociones Especiales</p>
                  <p className="text-white/80 text-sm mt-0.5">¡No te las pierdas!</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden relative flex items-center gap-4 px-5 py-4 cursor-pointer hover:brightness-105 transition-all"
              style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}>
              <div className="absolute right-3 top-0 bottom-0 flex items-center opacity-20 text-7xl pointer-events-none select-none">
                ✅
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-none stroke-white stroke-[2.5]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-tight">Compra Fácil y Seguro</p>
                  <p className="text-white/80 text-sm mt-0.5">en tu Distrito</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
