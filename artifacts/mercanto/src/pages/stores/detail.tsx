import { useRoute } from "wouter";
import { useGetStoreBySlug, useIncrementStoreVisit } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useEffect } from "react";
import { MapPin, Phone, Globe, Instagram, Facebook, Store as StoreIcon, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shared/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StoreDetail() {
  const [, params] = useRoute("/stores/:slug");
  const slug = params?.slug || "";
  
  const { data: store, isLoading } = useGetStoreBySlug(slug, {
    query: { enabled: !!slug, retry: false }
  });
  
  const visitMutation = useIncrementStoreVisit();

  useEffect(() => {
    if (slug) {
      visitMutation.mutate({ slug });
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
          <StoreIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
          <h1 className="text-2xl font-bold mb-2">Comercio no encontrado</h1>
          <p className="text-muted-foreground">La tienda que buscas no existe o fue removida.</p>
        </div>
      </div>
    );
  }

  const handleWhatsApp = () => {
    if (!store.whatsapp) return;
    const num = store.whatsapp.replace(/\D/g, '');
    const finalNum = num.startsWith('51') ? num : `51${num}`;
    window.open(`https://wa.me/${finalNum}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pb-20">
        {/* Banner */}
        <div className="h-48 md:h-80 w-full bg-secondary relative">
          {store.bannerUrl ? (
            <img src={store.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="container mx-auto px-4 -mt-16 md:-mt-24 relative z-10">
          <div className="bg-white rounded-3xl shadow-lg border border-border/50 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start">
            
            {/* Logo */}
            <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-2xl border-4 border-white bg-secondary shadow-md overflow-hidden flex items-center justify-center -mt-12 md:-mt-16 relative z-20">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon className="w-12 h-12 text-muted-foreground opacity-50" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">{store.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground mb-4">
                    {store.category && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        {store.category.name}
                      </Badge>
                    )}
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {store.district}</span>
                    {store.averageRating ? (
                      <span className="flex items-center gap-1 text-accent"><Star className="w-4 h-4 fill-current" /> {Number(store.averageRating).toFixed(1)}</span>
                    ) : null}
                  </div>
                  <p className="text-foreground leading-relaxed max-w-2xl">{store.description}</p>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                  <Button size="lg" className="bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-colored h-14 rounded-xl text-base w-full md:w-auto" onClick={handleWhatsApp} disabled={!store.whatsapp}>
                    <Phone className="w-5 h-5 mr-2" /> Contactar por WhatsApp
                  </Button>
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t">
                {store.location && <span className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {store.location}</span>}
                {store.instagram && <a href={store.instagram} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5"><Instagram className="w-4 h-4" /> Instagram</a>}
                {store.facebook && <a href={store.facebook} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5"><Facebook className="w-4 h-4" /> Facebook</a>}
                {store.website && <a href={store.website} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5"><Globe className="w-4 h-4" /> Sitio Web</a>}
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="products">
              <TabsList className="bg-white border w-full justify-start rounded-xl p-1 h-auto mb-8">
                <TabsTrigger value="products" className="rounded-lg px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Productos ({store.products?.length || 0})</TabsTrigger>
                <TabsTrigger value="about" className="rounded-lg px-6 py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sobre Nosotros</TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                {store.products && store.products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {store.products.map(p => (
                      <ProductCard key={p.id} product={p} storeWhatsapp={store.whatsapp} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
                    <p className="text-muted-foreground">Esta tienda aún no ha agregado productos.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="about">
                <div className="bg-white rounded-2xl p-8 border">
                  <h3 className="font-display text-xl font-bold mb-4">Información de la Tienda</h3>
                  <div className="prose max-w-none text-muted-foreground">
                    <p>{store.description || "Sin descripción detallada."}</p>
                    {store.location && (
                      <p><strong>Dirección:</strong> {store.location}, {store.district}</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
