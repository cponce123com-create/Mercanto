import { Link } from "wouter";
import { Store as StoreType } from "@workspace/api-client-react";
import { CATEGORIES_WITH_ICONS } from "@/lib/constants";
import { MapPin, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
        
        {/* Banner Area */}
        <div className="h-32 w-full bg-secondary relative overflow-hidden">
          {store.bannerUrl ? (
            <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
          {store.isFeatured && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-accent text-accent-foreground border-none font-bold shadow-md">Destacado</Badge>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 pt-0 flex-1 flex flex-col relative">
          {/* Logo */}
          <div className="w-16 h-16 rounded-xl border-4 border-card bg-white shadow-md absolute -top-8 overflow-hidden flex items-center justify-center">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{categoryIcon}</span>
            )}
          </div>

          <div className="mt-10 flex-1">
            <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {store.name}
            </h3>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
              {store.category && (
                <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                  {categoryIcon} {store.category.name}
                </span>
              )}
              {store.district && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {store.district}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {store.description || "Sin descripción disponible."}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-border/50">
            <button 
              onClick={handleWhatsApp}
              disabled={!store.whatsapp}
              className="w-full py-2.5 rounded-xl bg-[#25D366]/10 text-[#128C7E] font-medium hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" />
              {store.whatsapp ? "Contactar" : "Sin WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
