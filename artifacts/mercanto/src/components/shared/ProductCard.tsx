import { ProductWithImages } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: ProductWithImages;
  storeWhatsapp?: string | null;
}

export function ProductCard({ product, storeWhatsapp }: ProductCardProps) {
  const mainImage = product.images?.[0]?.url;
  
  const handleWhatsApp = () => {
    if (!storeWhatsapp) return;
    const num = storeWhatsapp.replace(/\D/g, '');
    const finalNum = num.startsWith('51') ? num : `51${num}`;
    const message = encodeURIComponent(`Hola, me interesa el producto "${product.name}" que vi en Mercanto.`);
    window.open(`https://wa.me/${finalNum}?text=${message}`, '_blank');
  };

  const isOffer = !!product.offerPrice;

  return (
    <div className="group bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="aspect-square bg-secondary relative overflow-hidden">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-50 bg-gradient-to-br from-secondary to-muted">
            📦
          </div>
        )}
        {isOffer && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground shadow-md font-bold">
            ¡Oferta!
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h4 className="font-medium text-foreground line-clamp-1">{product.name}</h4>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        )}
        
        <div className="mt-3 flex items-end gap-2">
          {isOffer ? (
            <>
              <span className="font-bold text-lg text-primary">S/ {product.offerPrice}</span>
              <span className="text-sm text-muted-foreground line-through mb-0.5">S/ {product.price}</span>
            </>
          ) : (
            <span className="font-bold text-lg text-foreground">S/ {product.price}</span>
          )}
          {product.unit && (
            <span className="text-xs text-muted-foreground mb-1 ml-auto">por {product.unit}</span>
          )}
        </div>
        
        <button 
          onClick={handleWhatsApp}
          disabled={!storeWhatsapp}
          className="mt-4 w-full py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary hover:text-white transition-colors text-sm disabled:opacity-50"
        >
          Preguntar
        </button>
      </div>
    </div>
  );
}
