import { Link } from "wouter";
import { Store as StoreType } from "@workspace/api-client-react";
import { MapPin, MessageCircle } from "lucide-react";

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

interface StoreCardProps {
  store: StoreType;
}

export function StoreCard({ store }: StoreCardProps) {
  const categoryIcon = store.category ? CATEGORIES_WITH_ICONS[store.category.name] || "📦" : "📦";

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!store.whatsapp) return;
    const num = store.whatsapp.replace(/\D/g, '');
    const finalNum = num.startsWith('51') ? num : `51${num}`;
    window.open(`https://wa.me/${finalNum}`, '_blank');
  };

  return (
    <Link href={`/stores/${store.slug}`}>
      <div className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer">

        {/* Banner */}
        <div className="h-32 w-full bg-blue-50 relative overflow-hidden">
          {store.bannerUrl ? (
            <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-blue-50 to-indigo-100">
              {categoryIcon}
            </div>
          )}
          {store.isFeatured && (
            <div className="absolute top-2 right-2 bg-[#F97316] text-white text-xs font-bold px-2 py-0.5 rounded">
              Destacado
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start gap-3 mb-2">
            {/* Logo */}
            <div className="w-12 h-12 rounded-xl border-2 border-gray-100 bg-white shadow-sm flex items-center justify-center shrink-0 -mt-8 overflow-hidden">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{categoryIcon}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-semibold text-sm text-[#1E293B] line-clamp-1 group-hover:text-[#2563EB] transition-colors">
                {store.name}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {store.category && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {categoryIcon} {store.category.name}
                  </span>
                )}
                {store.district && (
                  <span className="text-xs text-gray-500 flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" /> {store.district}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 mt-1">
            {store.description || "Sin descripción disponible."}
          </p>

          <button
            onClick={handleWhatsApp}
            disabled={!store.whatsapp}
            className="mt-3 w-full py-2 rounded-lg bg-[#25D366]/10 text-[#128C7E] text-sm font-semibold hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-4 h-4" />
            {store.whatsapp ? "Contactar" : "Sin WhatsApp"}
          </button>
        </div>
      </div>
    </Link>
  );
}
