import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetMyStore, useGetVendorProducts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Eye, Store, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function VendorDashboard() {
  const { data: store, isLoading: storeLoading } = useGetMyStore();
  const { data: products, isLoading: productsLoading } = useGetVendorProducts();

  if (storeLoading || productsLoading) return <DashboardLayout role="vendor"><div className="p-8">Cargando...</div></DashboardLayout>;

  if (!store) {
    return (
      <DashboardLayout role="vendor">
        <div className="max-w-md mx-auto text-center mt-20 p-8 bg-white rounded-2xl border">
          <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Aún no tienes una tienda</h2>
          <p className="text-muted-foreground mb-6">Crea tu perfil de comercio para empezar a vender.</p>
          <Button asChild><Link href="/create-store">Crear Tienda</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  const activeProducts = products?.filter(p => p.status === 'active').length || 0;

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">¡Hola, {store.name}!</h1>
          <p className="text-muted-foreground mt-1">Resumen de tu comercio en Mercanto.</p>
        </div>

        {store.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3 items-start mb-8">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">Tienda en revisión</h3>
              <p className="text-sm mt-1">Tu tienda ha sido creada y está pendiente de aprobación por un administrador. Pronto estará visible al público.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Productos Totales</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{activeProducts} activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Visitas al Perfil</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{store.totalVisits || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Visitas acumuladas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
              <Store className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold capitalize">{store.status === 'active' ? 'Activa' : store.status}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {store.status === 'active' ? 'Visible en el directorio' : 'No visible'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border flex flex-col items-center text-center justify-center h-64 hover:border-primary transition-colors group">
             <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <Package className="w-8 h-8" />
             </div>
             <h3 className="font-bold text-lg mb-2">Gestionar Productos</h3>
             <p className="text-sm text-muted-foreground mb-4">Añade o edita los productos de tu catálogo.</p>
             <Button asChild variant="outline"><Link href="/vendor/products">Ir a Productos</Link></Button>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border flex flex-col items-center text-center justify-center h-64 hover:border-primary transition-colors group">
             <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <Store className="w-8 h-8" />
             </div>
             <h3 className="font-bold text-lg mb-2">Editar Perfil</h3>
             <p className="text-sm text-muted-foreground mb-4">Actualiza tu información de contacto y descripción.</p>
             <Button asChild variant="outline"><Link href="/vendor/store">Ir a Ajustes</Link></Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
