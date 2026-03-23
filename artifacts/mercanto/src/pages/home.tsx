import { Link, useLocation } from "wouter";
import { useListStores, useListCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useDistrict } from "@/lib/contexts";
import { ChevronDown, ArrowRight, MapPin, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
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

/* ─── Category config ─── */
const PREFERRED_CATS = [
  "Abarrotes y Bodega",
  "Frutas y Verduras",
  "Ropa y Calzado",
  "Hogar y Muebles",
  "Electrónica y Tecnología",
  "Farmacia y Salud",
  "Belleza y Cuidado Personal",
];

const CATEGORY_DISPLAY: Record<string, string> = {
  "Abarrotes y Bodega":        "Abarrotes",
  "Frutas y Verduras":         "Frutas & Verduras",
  "Ropa y Calzado":            "Ropa & Calzado",
  "Hogar y Muebles":           "Hogar",
  "Electrónica y Tecnología":  "Electrónica",
  "Farmacia y Salud":          "Farmacia",
  "Belleza y Cuidado Personal":"Belleza",
};

const CATEGORY_ICONS: Record<string, { emoji: string; bg: string }> = {
  "Abarrotes y Bodega":        { emoji: "🛒", bg: "#EF4444" },
  "Frutas y Verduras":         { emoji: "🍎", bg: "#22C55E" },
  "Ropa y Calzado":            { emoji: "👗", bg: "#F59E0B" },
  "Hogar y Muebles":           { emoji: "🏠", bg: "#1E40AF" },
  "Electrónica y Tecnología":  { emoji: "💻", bg: "#1E3A8A" },
  "Farmacia y Salud":          { emoji: "💊", bg: "#3B82F6" },
  "Belleza y Cuidado Personal":{ emoji: "💄", bg: "#EC4899" },
  /* fallbacks for other cats */
  "Café y Cacao":              { emoji: "☕", bg: "#92400E" },
  "Miel y Apicultura":         { emoji: "🍯", bg: "#D97706" },
  "Plantas y Hierbas":         { emoji: "🌿", bg: "#16A34A" },
  "Carnes y Pescados":         { emoji: "🥩", bg: "#DC2626" },
  "Panadería y Pasteles":      { emoji: "🥐", bg: "#B45309" },
  "Bebidas y Jugos":           { emoji: "🧃", bg: "#0EA5E9" },
  "Artesanía":                 { emoji: "🎨", bg: "#8B5CF6" },
  "Mascotas":                  { emoji: "🐾", bg: "#F97316" },
  "Otros":                     { emoji: "📦", bg: "#94A3B8" },
};
const CAT_FALLBACK = { emoji: "📦", bg: "#94A3B8" };

/* ─── Static assets ─── */
const FEATURE_BANNERS = [
  {
    slug: "frutas-verduras",
    label: "Frutas y Verduras Frescas",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&auto=format&fit=crop",
  },
  {
    slug: "ropa-calzado",
    label: "Moda & Accesorios",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop",
  },
  {
    slug: "electronica-tecnologia",
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
    from: "#F97316",
    to: "#EF4444",
    pillColor: "#F97316",
    emojis: ["🛒", "🍊", "👟", "📸", "🎒"],
  },
  {
    id: 2,
    headline1: "Café",
    headline2: "Directo del Productor",
    pill: "El mejor de Chanchamayo",
    badge: "LOCAL",
    from: "#2563EB",
    to: "#1E40AF",
    pillColor: "#2563EB",
    emojis: ["☕", "🌿", "🏔️", "🫘", "✨"],
  },
  {
    id: 3,
    headline1: "Artesanía",
    headline2: "Amazónica Única",
    pill: "Apoya lo local",
    badge: "ÚNICO",
    from: "#16A34A",
    to: "#166534",
    pillColor: "#16A34A",
    emojis: ["🎨", "🌺", "🦜", "🌿", "🏺"],
  },
];

/* ─── Banner carousel ─── */
function BannerCarousel() {
  const [cur, setCur] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    timer.current = setInterval(() => setCur(p => (p + 1) % BANNERS.length), 4500);
  };
  useEffect(() => {
    start();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const go = (i: number) => {
    if (timer.current) clearInterval(timer.current);
    setCur(i);
    start();
  };

  const b = BANNERS[cur];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden select-none"
      style={{ background: `linear-gradient(135deg, ${b.from} 0%, ${b.to} 100%)`, minHeight: "180px" }}
    >
      {/* Wave decoration */}
      <svg className="absolute bottom-0 left-0 w-full opacity-15 pointer-events-none" viewBox="0 0 400 60" preserveAspectRatio="none">
        <path d="M0,30 Q100,60 200,30 T400,30 L400,60 L0,60Z" fill="white" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-full opacity-10 pointer-events-none" viewBox="0 0 400 60" preserveAspectRatio="none">
        <path d="M0,45 Q100,15 200,45 T400,45 L400,60 L0,60Z" fill="white" />
      </svg>

      {/* Content */}
      <div className="relative flex items-center px-6 md:px-10 py-6 md:py-8 gap-4 min-h-[180px]">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <div className="text-white leading-none font-black text-4xl md:text-5xl">{b.headline1}</div>
            <div className="text-white/90 leading-tight font-light text-2xl md:text-3xl mt-0.5">{b.headline2}</div>
          </div>

          {/* Pill — solid white */}
          <div
            className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm mb-3"
          >
            <span className="font-bold text-sm" style={{ color: b.pillColor }}>
              {b.pill}
            </span>
          </div>

          {/* Badge */}
          <div>
            <span className="inline-block bg-[#EF4444] text-white font-black text-base md:text-lg px-3 py-1 rounded-xl shadow-lg tracking-tight">
              {b.badge}
            </span>
          </div>
        </div>

        {/* Right: product emoji grid */}
        <div className="shrink-0 grid grid-cols-2 gap-2 md:gap-3 pr-2">
          {b.emojis.slice(0, 4).map((e, i) => (
            <div
              key={i}
              className="text-4xl md:text-5xl drop-shadow-lg flex items-center justify-center"
              style={{
                transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 8}deg) translateY(${i < 2 ? "-4px" : "4px"})`,
              }}
            >
              {e}
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next */}
      <button
        onClick={() => go((cur - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/35 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => go((cur + 1) % BANNERS.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/35 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === cur ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function Home() {
  const { district, setDistrict } = useDistrict();
  const [, setLocation] = useLocation();

  const { data: featured, isLoading: loadingFeatured } = useListStores({ featured: true, limit: 4 });
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

  /* Build ordered category list matching target */
  const displayCats = useMemo(() => {
    if (!categories) return [];
    const byName: Record<string, (typeof categories)[0]> = Object.fromEntries(
      categories.map(c => [c.name, c])
    );
    const ordered = PREFERRED_CATS.map(n => byName[n]).filter(Boolean);
    if (ordered.length < 7) {
      const extras = categories.filter(c => !PREFERRED_CATS.includes(c.name));
      ordered.push(...extras.slice(0, 7 - ordered.length));
    }
    return ordered.slice(0, 7);
  }, [categories]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F5F5" }}>
      <Navbar />

      {/* District selector bar */}
      <div className="bg-white border-b border-gray-200 shadow-none">
        <div className="container mx-auto px-4 py-2 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <span className="text-[#1E293B] font-semibold text-base">Compra en tu Distrito:</span>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="border-none shadow-none bg-transparent p-0 h-auto text-[#EF4444] font-bold text-base hover:bg-transparent focus:ring-0 gap-0.5 w-auto [&>svg]:hidden">
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
          <p className="text-gray-500 text-xs">Productos cerca de ti para recoger en tienda</p>
        </div>
      </div>

      <main className="flex-1">
        <div className="container mx-auto px-3 md:px-4 py-3 space-y-4">

          {/* ── Banner rotativo ── */}
          <BannerCarousel />

          {/* ── 3 Feature banners con foto ── */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {FEATURE_BANNERS.map(fb => (
              <Link key={fb.slug} href={`/stores?category=${fb.slug}`}>
                <div className="relative h-28 md:h-40 rounded-xl overflow-hidden cursor-pointer group">
                  <img
                    src={fb.img}
                    alt={fb.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2">
                    <span className="text-white font-bold text-xs md:text-sm leading-tight drop-shadow-md">
                      {fb.label}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Categorías Populares ── */}
          <section className="bg-white rounded-2xl py-5 px-4 border border-gray-100 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-[#1E293B] text-center mb-4">
              Categorías Populares
            </h2>
            <div className="grid grid-cols-7 gap-1 md:gap-3">
              {displayCats.map(cat => {
                const ci = CATEGORY_ICONS[cat.name] || CAT_FALLBACK;
                const label = CATEGORY_DISPLAY[cat.name] || cat.name;
                return (
                  <Link key={cat.id} href={`/stores?category=${cat.slug}`}>
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                      <div
                        className="w-11 h-11 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-3xl shadow-sm group-hover:scale-110 transition-transform duration-200"
                        style={{ background: ci.bg }}
                      >
                        <span className="drop-shadow">{ci.emoji}</span>
                      </div>
                      <span className="text-[9px] md:text-xs font-medium text-[#374151] text-center leading-tight group-hover:text-[#2563EB] transition-colors line-clamp-2 max-w-[56px]">
                        {label}
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
              <h2 className="text-base md:text-lg font-bold text-[#1E293B]">Tiendas Destacadas</h2>
              <Link href="/stores" className="text-[#2563EB] text-sm flex items-center gap-0.5 hover:underline font-medium">
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingFeatured ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
              </div>
            ) : featured?.stores && featured.stores.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {featured.stores.map((store, idx) => (
                  <Link key={store.id} href={`/stores/${store.slug}`}>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-[#2563EB]/40 transition-all group cursor-pointer">
                      {/* Photo */}
                      <div className="relative h-28 md:h-32 overflow-hidden bg-gray-100">
                        <img
                          src={store.bannerUrl || STORE_PHOTOS[idx % STORE_PHOTOS.length]}
                          alt={store.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      {/* Info */}
                      <div className="p-2.5 md:p-3">
                        <p className="font-semibold text-sm text-[#1E293B] mb-1 line-clamp-1">{store.name}</p>
                        {store.district && (
                          <p className="text-[11px] text-gray-400 flex items-center gap-0.5 mb-2">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            {store.district}
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
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-500 text-sm mb-3">No hay tiendas destacadas en {district} aún.</p>
                <button
                  onClick={() => setLocation("/create-store")}
                  className="px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors"
                >
                  Registra tu tienda
                </button>
              </div>
            )}
          </section>

          {/* ── Ofertas Cercanas ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-bold text-[#1E293B]">Ofertas Cercanas</h2>
            </div>

            {loadingOffers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
              </div>
            ) : offers && offers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {offers.slice(0, 8).map((product, idx) => (
                  <Link key={product.id} href={`/stores/${product.storeSlug}`}>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-[#2563EB]/30 transition-all group cursor-pointer">
                      <div className="relative h-32 md:h-40 bg-gray-50 overflow-hidden">
                        <img
                          src={product.images?.[0]?.url || OFFER_PHOTOS[idx % OFFER_PHOTOS.length]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 bg-[#EF4444] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          Oferta
                        </div>
                      </div>
                      <div className="p-2.5 md:p-3">
                        <p className="text-xs font-medium text-[#1E293B] line-clamp-2 mb-1.5 leading-tight min-h-[2.5rem]">
                          {product.name}
                        </p>
                        <p className="text-lg md:text-xl font-black text-[#16A34A] leading-none">
                          {fmtPrice(product.offerPrice)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-500 text-sm">No hay ofertas disponibles en {district} por ahora.</p>
              </div>
            )}
          </section>

          {/* ── Banners promocionales ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
            {/* Orange */}
            <div
              className="rounded-2xl relative flex items-center gap-4 px-5 py-4 cursor-pointer hover:brightness-105 transition-all overflow-hidden"
              style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)" }}
            >
              {/* big faint bg emoji */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-20 pointer-events-none select-none">
                🎁
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="text-4xl shrink-0">🎁</div>
                <div>
                  <p className="text-white font-bold text-sm md:text-base leading-tight">
                    Promociones Especiales
                  </p>
                  <p className="text-white/85 text-xs md:text-sm mt-0.5">¡No te las pierdas!</p>
                </div>
              </div>
            </div>

            {/* Blue */}
            <div
              className="rounded-2xl relative flex items-center gap-4 px-5 py-4 cursor-pointer hover:brightness-105 transition-all overflow-hidden"
              style={{ background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)" }}
            >
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-10 pointer-events-none select-none">
                ✅
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-11 h-11 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-white stroke-[2.5]">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm md:text-base leading-tight">
                    Compra Fácil y Seguro
                  </p>
                  <p className="text-white/85 text-xs md:text-sm mt-0.5">en tu Distrito</p>
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
