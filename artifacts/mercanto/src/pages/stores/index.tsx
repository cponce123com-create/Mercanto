import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useListStores, useListCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useDistrict } from "@/lib/contexts";
import { StoreCard } from "@/components/shared/StoreCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";

export default function StoresDirectory() {
  const { district } = useDistrict();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialCategory = searchParams.get("category") || "all";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<"newest" | "name" | "visits">("newest");

  // Simple manual debounce for search
  useState(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  });

  const { data: categories } = useListCategories();
  
  const { data, isLoading } = useListStores({
    district: district !== 'all' ? district : undefined,
    category: category !== 'all' ? category : undefined,
    search: debouncedSearch || undefined,
    sort,
    limit: 20
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar tiendas..." 
                className="pl-9 bg-secondary/30 border-transparent focus-visible:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-1 md:pb-0">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px] bg-secondary/30 border-transparent shrink-0">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories?.map(c => (
                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                <SelectTrigger className="w-[160px] bg-secondary/30 border-transparent shrink-0">
                  <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="visits">Más populares</SelectItem>
                  <SelectItem value="name">Alfabético</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Directorio de Comercios</h1>
          <p className="text-muted-foreground mt-2">
            Mostrando resultados para <strong className="text-foreground">{district}</strong>
            {category !== 'all' && categories && ` en ${categories.find(c => c.slug === category)?.name}`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : data?.stores && data.stores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-medium mb-2">No se encontraron tiendas</h3>
            <p className="text-muted-foreground">Intenta ajustando los filtros de búsqueda o cambia de distrito.</p>
            <Button variant="outline" className="mt-6" onClick={() => { setSearch(''); setCategory('all'); }}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
