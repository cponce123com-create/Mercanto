import { Link, useLocation } from "wouter";
import { useListStores, useListCategories } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useDistrict } from "@/lib/contexts";
import { StoreCard } from "@/components/shared/StoreCard";
import { Button } from "@/components/ui/button";
import { Search, Map as MapIcon, ArrowRight, Store, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";
import { CATEGORIES_WITH_ICONS } from "@/lib/constants";

export default function Home() {
  const { district } = useDistrict();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: featuredStores, isLoading: loadingFeatured } = useListStores({
    query: { queryKey: ["/api/stores", { featured: true, limit: 3, district }] }
  }, { query: { queryKey: ["/api/stores", { featured: true, limit: 3, district }] } }); // Quick fix for orval typings
  // Actually the orval hook is used like this: useListStores({ district, featured: true, limit: 3 })
  const { data: featured, isLoading: isLoadingFeatured } = useListStores({ district, featured: true, limit: 4 });
  const { data: newest, isLoading: isLoadingNewest } = useListStores({ district, sort: "newest", limit: 4 });
  const { data: categories } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/search?q=${encodeURIComponent(search)}&district=${encodeURIComponent(district)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-marketplace.png`}
              alt="Mercado Tropical" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20 backdrop-blur-md">
                  <MapIcon className="w-4 h-4" />
                  <span>Actualmente en <strong>{district}</strong></span>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-display font-extrabold text-foreground leading-[1.1] mb-6">
                  Descubre los <span className="text-gradient">mejores comercios</span> de tu zona
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                  Mercanto conecta a los vecinos con productores, artesanos y emprendedores locales en la Selva Central. 
                  Apoya lo nuestro.
                </p>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      placeholder="¿Qué estás buscando hoy?" 
                      className="pl-12 h-14 rounded-2xl text-base bg-white/90 backdrop-blur-sm border-white/50 shadow-lg focus-visible:ring-primary"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-14 rounded-2xl px-8 bg-primary hover:bg-primary/90 shadow-colored text-base">
                    Buscar
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold">Categorías</h2>
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link href="/stores">Ver todas <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(categories || []).slice(0, 12).map((cat, i) => (
                <Link key={cat.id} href={`/stores?category=${cat.slug}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl bg-secondary/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all cursor-pointer group text-center h-full"
                  >
                    <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {CATEGORIES_WITH_ICONS[cat.name] || "📦"}
                    </span>
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Stores */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-display font-bold text-foreground">Comercios Destacados</h2>
                <p className="text-muted-foreground mt-2">En {district}</p>
              </div>
            </div>

            {isLoadingFeatured ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : featured?.stores && featured.stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featured.stores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed">
                <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-medium text-lg">Aún no hay comercios destacados</h3>
                <p className="text-muted-foreground">Sé el primero en abrir tu tienda en {district}</p>
                <Button className="mt-4" onClick={() => setLocation('/create-store')}>Crear Tienda</Button>
              </div>
            )}
          </div>
        </section>

        {/* Newest Stores */}
        <section className="py-16 bg-white border-t border-b">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-foreground mb-8">Nuevos en Mercanto</h2>
            
            {isLoadingNewest ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : newest?.stores && newest.stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {newest.stores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay comercios nuevos recientes.</p>
            )}
          </div>
        </section>

        {/* CTA Map */}
        <section className="py-24 bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay">
             <img src={`${import.meta.env.BASE_URL}images/map-placeholder.png`} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
            <h2 className="text-4xl font-display font-bold mb-6">Encuentra todo cerca de ti</h2>
            <p className="text-primary-foreground/80 text-lg mb-10">
              Explora el mapa interactivo y descubre los negocios que están a la vuelta de la esquina.
            </p>
            <Button size="lg" variant="secondary" className="rounded-2xl px-8 h-14 text-base" onClick={() => setLocation('/map')}>
              <MapIcon className="mr-2 w-5 h-5" /> Abrir Mapa
            </Button>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
