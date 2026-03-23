import { useSearch, useLocation } from "wouter";
import { useGlobalSearch } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { StoreCard } from "@/components/shared/StoreCard";
import { ProductCard } from "@/components/shared/ProductCard";

export default function SearchPage() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialQ = searchParams.get("q") || "";
  const district = searchParams.get("district") || undefined;
  
  const [, setLocation] = useLocation();
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      if (q !== initialQ) {
        setLocation(`/search?q=${encodeURIComponent(q)}${district ? `&district=${encodeURIComponent(district)}` : ''}`, { replace: true });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [q, initialQ, district, setLocation]);

  const { data, isLoading } = useGlobalSearch(
    { q: debouncedQ, district: district !== 'all' ? district : undefined, type: "all" },
    { query: { enabled: debouncedQ.length > 1 } }
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl font-display font-bold text-center mb-6">Búsqueda Global</h1>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              autoFocus
              className="pl-12 h-14 rounded-2xl text-lg shadow-sm border-border/50 bg-white"
              placeholder="Buscar comercios o productos..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {isLoading && debouncedQ.length > 1 && (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        )}

        {!isLoading && data && debouncedQ.length > 1 && (
          <div className="space-y-12">
            {/* Stores Results */}
            {data.stores.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  Tiendas <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{data.stores.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {data.stores.map(store => <StoreCard key={store.id} store={store} />)}
                </div>
              </section>
            )}

            {/* Products Results */}
            {data.products.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  Productos <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{data.products.length}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {data.products.map(product => <ProductCard key={product.id} product={product} />)}
                </div>
              </section>
            )}

            {data.stores.length === 0 && data.products.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border">
                <p className="text-lg text-muted-foreground">No encontramos resultados para "{debouncedQ}"</p>
              </div>
            )}
          </div>
        )}
        
        {debouncedQ.length <= 1 && (
          <div className="text-center py-20 text-muted-foreground">
            Escribe al menos 2 caracteres para buscar.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
