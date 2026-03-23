import { Link } from "wouter";
import { Store as StoreType, StoreDetail } from "@workspace/api-client-react";
import { MapPin, MessageCircle, Star } from "lucide-react";

type StoreCardStore = StoreType & Partial<Pick<StoreDetail, "averageRating" | "reviewCount">>;

const CATEGORIES_WITH_ICONS: Record<string, string> = {
  "Abarrotes y Bodega": "🛒",
  "Frutas y Verduras": "🍎",
  "Carnes y Pescados": "🥩",
  "Panadería y Pasteles": "🥐",
  "Bebidas y Jugos": "🧃",
  "Café y Cacao": "☕",
  "Miel y Apicultura": "🍯",
  "Plantas y Hierbas": "🌿",
  "Ropa y Calzado": "👗",
  "Artesanía": "🧶",
  "Hogar y Muebles": "🏠",
  "Electrónica y Tecnología": "📱",
  "Belleza y Cuidado Personal": "💄",
  "Farmacia y Salud": "💊",
  "Ferretería y Construcción": "🔧",
  "Mascotas": "🐾",
  "Turismo y Hospedaje": "🏕️",
  "Agricultura e Insumos": "🌾",
  "Servicios Técnicos": "🛠️",
  "Otros": "📦",
};

interface StoreCardProps {
  store: StoreCardStore;
}

export function StoreCard({ store }: StoreCardProps) {
  const categoryIcon = store.category ? CATEGORIES_WITH_ICONS[store.category.name] || "📦" : "📦";
  const avg = store.averageRating ? Number(store.averageRating) : null;
  const reviewCount = store.reviewCount || 0;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!store.whatsapp) return;
    const num = store.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${num.startsWith("51") ? num : `51${num}`}`, "_blank");
  };

  return (
    <Link href={`/stores/${store.slug}`}>
      <div className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer">

        {/* Banner */}
        <div className="h-20 sm:h-32 w-full bg-blue-50 relative overflow-hidden">
          {store.bannerUrl ? (
            <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl sm:text-5xl bg-gradient-to-br from-blue-50 to-indigo-100">
              {categoryIcon}
            </div>
          )}
          {store.isFeatured && (
            <div className="absolute top-2 right-2 bg-[#F97316] text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded">
              Destacado
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
          <div className="flex items-start gap-2 sm:gap-3 mb-1.5 sm:mb-2">
            {/* Logo */}
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-2 border-gray-100 bg-white shadow-sm flex items-center justify-center shrink-0 -mt-6 sm:-mt-8 overflow-hidden">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base sm:text-xl">{categoryIcon}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
              <h3 className="font-semibold text-xs sm:text-sm text-[#1E293B] line-clamp-2 sm:line-clamp-1 group-hover:text-[#2563EB] transition-colors leading-tight">
                {store.name}
              </h3>
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {store.category && (
                  <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded leading-tight">
                    {categoryIcon} <span className="hidden sm:inline">{store.category.name}</span>
                  </span>
                )}
                {store.district && (
                  <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="truncate max-w-[60px] sm:max-w-none">{store.district}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="hidden sm:block text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 mt-1">
            {store.description || "Sin descripción disponible."}
          </p>

          {/* Rating */}
          <div className="mt-1.5 sm:mt-2 mb-1">
            {avg !== null ? (
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star
                      key={n}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${n <= Math.round(avg) ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-gray-200 text-gray-200"}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-[#F59E0B]">{avg.toFixed(1)}</span>
                <span className="hidden sm:inline text-xs text-gray-400">({reviewCount})</span>
              </div>
            ) : (
              <span className="text-[10px] sm:text-xs text-gray-400">Sin reseñas</span>
            )}
          </div>

          <button
            onClick={handleWhatsApp}
            disabled={!store.whatsapp}
            className="mt-1.5 sm:mt-2 w-full py-1.5 sm:py-2 rounded-lg bg-[#25D366]/10 text-[#128C7E] text-xs sm:text-sm font-semibold hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{store.whatsapp ? "Contactar" : "Sin WhatsApp"}</span>
            <span className="sm:hidden">{store.whatsapp ? "WhatsApp" : "—"}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
