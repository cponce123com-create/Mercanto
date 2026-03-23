import { Link, useLocation } from "wouter";
import { useListStores, useListCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useDistrict } from "@/lib/contexts";
import { ChevronDown, ArrowRight, MapPin, ChevronLeft, ChevronRight, Gift, ShieldCheck, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { DISTRICTS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES_WITH_ICONS: Record<string, string> = {
  "Abarrotes y Bodega": "🛒",
  "Frutas y Verduras": "🍎",
  "Carnes y Pescados": "🥩",
  "Panadería y Pasteles": "🥖",
  "Lácteos y Huevos": "🥚",
  "Bebidas": "🥤",
  "Café y Cacao": "☕",
  "Ropa y Calzado": "👔",
  "Artesanía Local": "🎨",
  "Hogar y Decoración": "🏠",
  "Electrónica": "💻",
  "Salud y Belleza": "💄",
  "Ferretería": "🔧",
  "Librería y Útiles": "📚",
  "Muebles": "🛋️",
  "Jardín y Plantas": "🌿",
  "Mascotas": "🐾",
  "Juguetes": "🧸",
  "Deportes": "⚽",
  "Restaurante": "🍽️",
  "Servicios": "⚙️",
  "Otros": "📦",
};

const BANNERS = [
  {
    id: 1,
    bg: "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #dc2626 100%)",
    title: "Ofertas de la Semana",
    subtitle: "¡Descuentos Imperdibles!",
    badge: "-50%",
    emoji: "🛒🍊👟🎒",
  },
  {
    id: 2,
    bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)",
    title: "Café Directo del Productor",
    subtitle: "El mejor café de Chanchamayo",
    badge: "LOCAL",
    emoji: "☕🌿🏔️✨",
  },
  {
    id: 3,
    bg: "linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)",
    title: "Artesanía Amazónica",
    subtitle: "Apoya a los artesanos locales",
    badge: "ÚNICO",
    emoji: "🎨🌺🦜🌿",
  },
];

const FEATURE_BANNERS = [
  {
    slug: "cafe-y-cacao",
    label: "Café y Productos del Campo",
    emoji: "☕",
    color: "#92400e",
    bg: "linear-gradient(135deg, #78350f, #b45309)",
  },
  {
    slug: "artesania-local",
    label: "Artesanía Local",
    emoji: "🎨",
    color: "#581c87",
    bg: "linear-gradient(135deg, #4c1d95, #7c3aed)",
  },
  {
    slug: "abarrotes-y-bodega",
    label: "Abarrotes y Bodega",
    emoji: "🛒",
    color: "#1e40af",
    bg: "linear-gradient(135deg, #1e3a8a, #2563eb)",
  },
];

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

function formatPrice(price: string | number | null | undefined) {
  if (!price) return null;
  return `S/ ${parseFloat(String(price)).toFixed(2)}`;
}

function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % BANNERS.length);
    }, 4000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const go = (idx: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(idx);
    startTimer();
  };

  const banner = BANNERS[current];

  return (
    <div className="relative w-full h-44 md:h-56 rounded-xl overflow-hidden shadow-md select-none">
      <div
        className="w-full h-full flex items-center px-8 md:px-12 transition-all duration-500"
        style={{ background: banner.bg }}
      >
        <div className="flex-1">
          <div className="inline-block bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded mb-2">
            {banner.badge}
          </div>
          <h2 className="text-white text-2xl md:text-4xl font-extrabold leading-tight mb-1">
            {banner.title}
          </h2>
          <p className="text-white/90 text-sm md:text-base font-medium">
            {banner.subtitle}
          </p>
        </div>
        <div className="text-5xl md:text-7xl hidden sm:block opacity-90 ml-8 tracking-wider">
          {banner.emoji}
        </div>
      </div>

      {/* Prev / Next */}
      <button
        onClick={() => go((current - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => go((current + 1) % BANNERS.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white w-5" : "bg-white/50"}`}
          />
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
      if (!res.ok) throw new Error("Failed to fetch offers");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1">
        {/* District Selector Bar */}
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="container mx-auto px-4 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[#1E293B] font-semibold text-lg">
                Compra en tu Distrito:
              </span>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="border-none shadow-none bg-transparent p-0 h-auto text-[#EF4444] font-bold text-lg hover:bg-transparent focus:ring-0 gap-1 w-auto">
                  <SelectValue />
                  <ChevronDown className="w-4 h-4 text-[#EF4444]" />
                </SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-gray-500 text-sm">Productos cerca de ti para recoger en tienda</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-5 space-y-8">

          {/* Banner Principal Rotativo */}
          <BannerCarousel />

          {/* Feature Banners — 3 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FEATURE_BANNERS.map((fb) => (
              <Link key={fb.slug} href={`/stores?category=${fb.slug}`}>
                <div
                  className="relative h-32 rounded-xl overflow-hidden cursor-pointer group shadow-sm"
                  style={{ background: fb.bg }}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="relative h-full flex items-end p-4">
                    <div>
                      <div className="text-3xl mb-1">{fb.emoji}</div>
                      <span className="text-white font-bold text-sm leading-tight drop-shadow-md">
                        {fb.label}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Categorías Populares */}
          <section>
            <h2 className="text-xl font-bold text-[#1E293B] text-center mb-4">Categorías Populares</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {(categories || []).slice(0, 8).map((cat) => (
                <Link key={cat.id} href={`/stores?category=${cat.slug}`} className="shrink-0">
                  <div className="flex flex-col items-center gap-2 w-20 group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:border-[#2563EB] group-hover:shadow-md transition-all">
                      <span className="text-3xl">{CATEGORIES_WITH_ICONS[cat.name] || "📦"}</span>
                    </div>
                    <span className="text-xs font-medium text-[#1E293B] text-center leading-tight group-hover:text-[#2563EB] transition-colors">
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Tiendas Destacadas */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1E293B]">Tiendas Destacadas</h2>
              <Link href="/stores" className="text-[#2563EB] text-sm font-medium flex items-center gap-1 hover:underline">
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingFeatured ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-7 h-7 animate-spin text-[#2563EB]" />
              </div>
            ) : featured?.stores && featured.stores.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {featured.stores.map((store) => (
                  <Link key={store.id} href={`/stores/${store.slug}`}>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#2563EB]/40 transition-all group">
                      <div className="h-28 bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
                        {store.bannerUrl ? (
                          <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            {store.category ? (CATEGORIES_WITH_ICONS[store.category.name] || "🏪") : "🏪"}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-[#1E293B] line-clamp-1 mb-1">{store.name}</h3>
                        {store.district && (
                          <p className="text-xs text-gray-500 flex items-center gap-0.5 mb-2">
                            <MapPin className="w-3 h-3" /> {store.district}
                          </p>
                        )}
                        <button className="w-full py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg transition-colors">
                          Ver Tienda
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
                <p className="text-gray-500 text-sm">No hay tiendas destacadas en {district} aún.</p>
                <button
                  onClick={() => setLocation('/create-store')}
                  className="mt-3 px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
                >
                  Registra tu tienda
                </button>
              </div>
            )}
          </section>

          {/* Ofertas Cercanas */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1E293B]">Ofertas Cercanas</h2>
              <Link href="/stores" className="text-[#2563EB] text-sm font-medium flex items-center gap-1 hover:underline">
                Ver más <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingOffers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-7 h-7 animate-spin text-[#2563EB]" />
              </div>
            ) : offers && offers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {offers.slice(0, 8).map((product) => (
                  <Link key={product.id} href={`/stores/${product.storeSlug}`}>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#2563EB]/40 transition-all group cursor-pointer">
                      <div className="relative h-36 bg-gray-100">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">
                            {product.category ? (CATEGORIES_WITH_ICONS[product.category.name] || "📦") : "📦"}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-[#EF4444] text-white text-xs font-bold px-2 py-0.5 rounded">
                          Oferta
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-[#1E293B] line-clamp-2 leading-tight mb-2">{product.name}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-[#16A34A]">{formatPrice(product.offerPrice)}</span>
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{product.storeName}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500 text-sm">No hay ofertas disponibles en {district} por ahora.</p>
              </div>
            )}
          </section>

          {/* Mapa Interactivo */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#1E293B]">Descubre Tiendas Cerca de Ti</h2>
              <p className="text-gray-500 text-sm mt-0.5">Encuentra comercios en tu distrito en el mapa interactivo</p>
            </div>
            <div className="relative h-72 bg-gray-100">
              <iframe
                title="Mapa de Chanchamayo"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-75.3900,-11.1600,-75.3000,-11.0800&layer=mapnik&marker=-11.1253,-75.3442"
                className="w-full h-full border-none"
                loading="lazy"
              />
              <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-4">
                <button
                  onClick={() => setLocation('/map')}
                  className="pointer-events-auto px-5 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-sm rounded-lg shadow-lg transition-colors flex items-center gap-2"
                >
                  Ver mapa completo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Banners Promocionales Dobles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
            <div className="bg-[#F97316] rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:brightness-105 transition-all shadow-sm">
              <div className="text-4xl shrink-0">🎁</div>
              <div>
                <p className="text-white font-bold text-base leading-tight">Promociones Especiales</p>
                <p className="text-white/80 text-sm mt-0.5">¡No te las pierdas!</p>
              </div>
            </div>
            <div className="bg-[#2563EB] rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:brightness-105 transition-all shadow-sm">
              <div className="text-4xl shrink-0">✅</div>
              <div>
                <p className="text-white font-bold text-base leading-tight">Compra Fácil y Seguro</p>
                <p className="text-white/80 text-sm mt-0.5">en tu Distrito</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
