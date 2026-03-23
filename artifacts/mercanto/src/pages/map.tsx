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

  const categories = useMemo(() => {
    const seen = new Map<string, { name: string; icon: string | undefined }>();
    for (const s of validStores) {
      if (s.category?.name && !seen.has(s.category.name)) {
        seen.set(s.category.name, { name: s.category.name, icon: s.category.icon ?? undefined });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [validStores]);

  const filteredStores = useMemo(() => {
    if (!selectedCategory) return validStores;
    return validStores.filter(s => s.category?.name === selectedCategory);
  }, [validStores, selectedCategory]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <div className="w-full md:w-80 bg-white border-r flex flex-col h-[40vh] md:h-full z-10 shadow-xl md:shadow-none shrink-0">

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

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {selectedCategory ? (
                  <>
                    <p className="font-semibold text-base mb-1">Sin resultados</p>
                    <p>No hay tiendas de <strong>{selectedCategory}</strong> en este distrito.</p>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="mt-3 text-sm text-primary font-semibold hover:underline"
                    >
                      Ver todas
                    </button>
                  </>
                ) : (
                  "No hay tiendas con ubicación registrada."
                )}
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

        {/* ── Map area + Category ribbon ────────────────────────────── */}
        <div className="flex-1 relative h-[60vh] md:h-full flex flex-col">

          {/* Category ribbon — floating above map */}
          {!isLoading && categories.length > 0 && (
            <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none">
              <div
                className="flex gap-2 overflow-x-auto pointer-events-auto no-scrollbar"
              >
                {/* Todas */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 shadow-lg transition-all duration-200 border backdrop-blur-sm ${
                    selectedCategory === null
                      ? "bg-[#2563EB] text-white border-[#2563EB] scale-105 shadow-blue-400/40"
                      : "bg-white/90 text-gray-700 border-white hover:bg-white hover:shadow-xl hover:scale-105"
                  }`}
                >
                  🏪 <span>Todas</span>
                </button>

                {categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 shadow-lg transition-all duration-200 border backdrop-blur-sm ${
                      selectedCategory === cat.name
                        ? "bg-[#2563EB] text-white border-[#2563EB] scale-105 shadow-blue-400/40"
                        : "bg-white/90 text-gray-700 border-white hover:bg-white hover:shadow-xl hover:scale-105"
                    }`}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/30">
              <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando mapa...</p>
              </div>
            </div>
          ) : filteredStores.length === 0 && validStores.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
              <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm">
                <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Sin tiendas en el mapa</h3>
                <p className="text-muted-foreground text-sm">
                  No hay tiendas con ubicación registrada en este distrito.
                </p>
              </div>
            </div>
          ) : (
            <StoreMap
              stores={filteredStores.length > 0 ? filteredStores : validStores}
              highlightedStoreId={selectedStore ?? highlightedId}
              onStoreClick={(s) => setSelectedStore(s.id)}
              className="w-full h-full flex-1"
            />
          )}

          {/* No results overlay when filter is active but map still shows */}
          {!isLoading && filteredStores.length === 0 && validStores.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-2xl p-6 shadow-xl text-center max-w-xs pointer-events-auto">
                <p className="font-bold text-base mb-1">Sin resultados</p>
                <p className="text-sm text-muted-foreground mb-3">
                  No hay tiendas de <strong>{selectedCategory}</strong> en este distrito.
                </p>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  Ver todas las categorías
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
