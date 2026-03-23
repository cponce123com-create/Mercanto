import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useListStoresForMap } from "@workspace/api-client-react";
import { useDistrict } from "@/lib/contexts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DISTRICTS } from "@/lib/constants";
import { Link, useSearch } from "wouter";
import { MapPin, Store, Loader2 } from "lucide-react";
import { StoreMap } from "@/components/shared/StoreMap";
import { Badge } from "@/components/ui/badge";

export default function MapPage() {
  const { district: ctxDistrict, setDistrict } = useDistrict();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const highlightedId = params.get("storeId") ? parseInt(params.get("storeId")!) : undefined;
  const urlDistrict = params.get("district");

  const district = urlDistrict || ctxDistrict;
  const [selectedStore, setSelectedStore] = useState<number | null>(highlightedId ?? null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: stores, isLoading } = useListStoresForMap({
    district: district !== 'all' ? district : undefined,
  });

  const validStores = useMemo(() => (stores ?? []).filter(s => s.lat && s.lng), [stores]);

  // Extract unique categories from loaded stores
  const categories = useMemo(() => {
    const seen = new Map<string, { id: number; name: string; icon: string | undefined }>();
    for (const s of validStores) {
      if (s.category?.name && !seen.has(s.category.name)) {
        seen.set(s.category.name, {
          id: s.category.id ?? 0,
          name: s.category.name,
          icon: s.category.icon ?? undefined,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [validStores]);

  // Filter stores by selected category
  const filteredStores = useMemo(() => {
    if (!selectedCategory) return validStores;
    return validStores.filter(s => s.category?.name === selectedCategory);
  }, [validStores, selectedCategory]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-full md:w-96 bg-white border-r flex flex-col h-[45vh] md:h-full z-10 shadow-xl md:shadow-none">

          {/* District selector */}
          <div className="p-4 border-b bg-background/50 shrink-0">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Mapa de Tiendas
            </h2>
            <Select value={district} onValueChange={(v) => { setDistrict(v); setSelectedCategory(null); }}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Seleccionar distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los distritos</SelectItem>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {isLoading
                ? "Cargando..."
                : `${filteredStores.length}${selectedCategory ? ` de ${validStores.length}` : ""} tiendas en el mapa`}
            </p>
          </div>

          {/* Category filter pills */}
          {!isLoading && categories.length > 0 && (
            <div className="border-b bg-white shrink-0">
              <div className="flex gap-2 overflow-x-auto px-3 py-2.5 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                {/* "Todas" pill */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${
                    selectedCategory === null
                      ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#2563EB]/50 hover:text-[#2563EB]"
                  }`}
                >
                  🏪 Todas
                </button>

                {categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${
                      selectedCategory === cat.name
                        ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#2563EB]/50 hover:text-[#2563EB]"
                    }`}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Store list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {selectedCategory
                  ? <><p className="font-semibold text-base mb-1">Sin resultados</p><p>No hay tiendas de <strong>{selectedCategory}</strong> en este distrito.</p></>
                  : "No hay tiendas con ubicación registrada."}
              </div>
            ) : (
              filteredStores.map(store => (
                <div
                  key={store.id}
                  onClick={() => setSelectedStore(store.id === selectedStore ? null : store.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedStore === store.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base shrink-0">
                      {store.category?.icon || '🏪'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight truncate">{store.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{store.district}</p>
                      {store.category?.name && (
                        <Badge variant="secondary" className="mt-1 text-xs py-0">
                          {store.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedStore === store.id && (
                    <Link href={`/stores/${store.slug}`}>
                      <div className="mt-2 w-full text-center bg-primary text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                        Ver tienda →
                      </div>
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative h-[55vh] md:h-full">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/30">
              <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando mapa...</p>
              </div>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
              <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm">
                <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Sin tiendas en el mapa</h3>
                <p className="text-muted-foreground text-sm">
                  {selectedCategory
                    ? `No hay tiendas de "${selectedCategory}" en este distrito.`
                    : "No hay tiendas con ubicación registrada en este distrito."}
                </p>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="mt-3 text-sm text-primary font-semibold hover:underline"
                  >
                    Ver todas las categorías
                  </button>
                )}
              </div>
            </div>
          ) : (
            <StoreMap
              stores={filteredStores}
              highlightedStoreId={selectedStore ?? highlightedId}
              onStoreClick={(s) => setSelectedStore(s.id)}
              className="w-full h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
