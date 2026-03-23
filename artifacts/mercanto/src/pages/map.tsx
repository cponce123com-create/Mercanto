import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useListStoresForMap } from "@workspace/api-client-react";
import { useDistrict } from "@/lib/contexts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DISTRICTS } from "@/lib/constants";
import { Link } from "wouter";
import { Store, MapPin } from "lucide-react";

export default function MapPage() {
  const { district, setDistrict } = useDistrict();
  const { data: stores } = useListStoresForMap({ district });

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar List */}
        <div className="w-full md:w-96 bg-white border-r flex flex-col h-[50vh] md:h-full z-10 shadow-xl md:shadow-none">
          <div className="p-4 border-b bg-background/50">
            <h2 className="font-bold text-lg mb-3">Filtrar Mapa</h2>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los distritos</SelectItem>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {stores?.length || 0} tiendas encontradas
            </p>
            {stores?.map(store => (
              <Link key={store.id} href={`/stores/${store.slug}`}>
                <div className="p-4 rounded-xl border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card group">
                  <h3 className="font-bold group-hover:text-primary transition-colors">{store.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {store.district}
                  </p>
                  <div className="mt-2 text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-1 rounded-md">
                    {store.category?.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Map Area (Placeholder logic for decorative map) */}
        <div className="flex-1 bg-secondary relative h-[50vh] md:h-full">
          {/* Decorative Map Background */}
          <div className="absolute inset-0">
             <img src={`${import.meta.env.BASE_URL}images/map-placeholder.png`} className="w-full h-full object-cover opacity-50" alt="Map" />
          </div>
          
          {/* Overlay text since we don't have real map embed */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border max-w-sm text-center">
              <Store className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">Mapa Interactivo</h2>
              <p className="text-muted-foreground text-sm">
                En un entorno de producción, aquí se integra Google Maps o Mapbox con los pines de cada tienda ubicada en {district}.
              </p>
            </div>
          </div>

          {/* Fake Pins for demonstration */}
          {stores?.slice(0, 5).map((store, i) => (
             <div 
               key={store.id} 
               className="absolute z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500"
               style={{ 
                 top: `${20 + (i * 15)}%`, 
                 left: `${30 + (i * 12 + (i%2*20))}%` 
               }}
             >
               <div className="bg-primary text-white p-2 rounded-full shadow-lg">
                 <Store className="w-4 h-4" />
               </div>
               <div className="mt-1 bg-white px-2 py-1 rounded shadow text-xs font-bold whitespace-nowrap">
                 {store.name}
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
