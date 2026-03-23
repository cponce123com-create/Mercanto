import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminListStores, useAdminUpdateStoreStatus, useAdminToggleStoreFeatured } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListStoresQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Check, X, Star, ExternalLink, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Link } from "wouter";

export default function AdminStores() {
  const [status, setStatus] = useState<string>("all");
  const { data, isLoading } = useAdminListStores({ status: status !== 'all' ? status : undefined });
  const queryClient = useQueryClient();

  const statusMutation = useAdminUpdateStoreStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
        toast.success("Estado de tienda actualizado");
      }
    }
  });

  const featuredMutation = useAdminToggleStoreFeatured({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListStoresQueryKey() });
      }
    }
  });

  const stores = data?.stores || [];

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-display font-bold">Gestión de Tiendas</h1>
          
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
             <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Destacado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map(store => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <p className="font-bold">{store.name}</p>
                      <p className="text-xs text-muted-foreground">{store.category?.name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{store.district}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        store.status === 'active' ? 'border-primary text-primary bg-primary/5' : 
                        store.status === 'pending' ? 'border-amber-500 text-amber-600 bg-amber-50' : 
                        'border-destructive text-destructive'
                      }>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={store.isFeatured ? "text-accent" : "text-muted"}
                        onClick={() => featuredMutation.mutate({ id: store.id })}
                        disabled={store.status !== 'active'}
                      >
                        <Star className={store.isFeatured ? "fill-current w-5 h-5" : "w-5 h-5"} />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10 gap-1" asChild title="Auditar tienda">
                          <Link href={`/admin/stores/${store.id}`}><Search className="w-3.5 h-3.5" /> Auditar</Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Ver público">
                          <Link href={`/stores/${store.slug}`}><ExternalLink className="w-4 h-4 text-muted-foreground" /></Link>
                        </Button>
                        {store.status !== 'active' && (
                          <Button variant="outline" size="sm" className="text-green-700 border-green-200 hover:bg-green-50" 
                            onClick={() => statusMutation.mutate({ id: store.id, data: { status: "active" } })}>
                            <Check className="w-4 h-4 mr-1" /> Activar
                          </Button>
                        )}
                        {store.status === 'active' && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10"
                            onClick={() => statusMutation.mutate({ id: store.id, data: { status: "rejected" } })}>
                            <X className="w-4 h-4 mr-1" /> Suspender
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {stores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay tiendas en este estado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
