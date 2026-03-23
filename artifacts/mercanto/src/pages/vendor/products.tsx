import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetVendorProducts, useToggleProductStatus, useDeleteProduct, type CreateProductRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Power, Loader2, Image as ImageIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { getGetVendorProductsQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateProduct, useUpdateProduct, useListCategories } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const productSchema = z.object({
  name: z.string().min(2, "Requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "Requerido"),
  offerPrice: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  unit: z.string().optional(),
  status: z.string().default("active"),
});

export default function VendorProducts() {
  const { data: products, isLoading } = useGetVendorProducts();
  const queryClient = useQueryClient();
  const { data: categories } = useListCategories();
  
  const toggleMutation = useToggleProductStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVendorProductsQueryKey() });
        toast.success("Estado actualizado");
      }
    }
  });

  const deleteMutation = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVendorProductsQueryKey() });
        toast.success("Producto eliminado");
      }
    }
  });

  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVendorProductsQueryKey() });
        toast.success("Producto creado");
        setIsOpen(false);
      }
    }
  });

  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVendorProductsQueryKey() });
        toast.success("Producto actualizado");
        setIsOpen(false);
      }
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<CreateProductRequest>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", description: "", unit: "unidad", status: "active" }
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({ name: "", price: "", description: "", unit: "unidad", status: "active" });
    setIsOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      offerPrice: product.offerPrice || "",
      categoryId: product.categoryId || undefined,
      unit: product.unit || "unidad",
      status: product.status
    });
    setIsOpen(true);
  };

  const onSubmit = (data: CreateProductRequest) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const maxProducts = 30;
  const currentCount = products?.length || 0;
  const canCreate = currentCount < maxProducts;

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Catálogo de Productos</h1>
            <p className="text-muted-foreground mt-1">
              Has usado {currentCount} de {maxProducts} espacios disponibles.
            </p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button onClick={openCreate} disabled={!canCreate} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
            </Button>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({field}) => (
                      <FormItem className="col-span-2"><FormLabel>Nombre *</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="price" render={({field}) => (
                      <FormItem><FormLabel>Precio Regular (S/) *</FormLabel><FormControl><Input type="number" step="0.1" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="offerPrice" render={({field}) => (
                      <FormItem><FormLabel>Precio Oferta (S/)</FormLabel><FormControl><Input type="number" step="0.1" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="categoryId" render={({field}) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      <FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="unit" render={({field}) => (
                      <FormItem><FormLabel>Unidad de medida</FormLabel><FormControl><Input placeholder="ej. kg, docena, unidad" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({field}) => (
                    <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field}/></FormControl><FormMessage/></FormItem>
                  )} />
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2"/>}
                      Guardar
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : products && products.length > 0 ? (
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow>
                  <TableHead className="w-16">Foto</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center overflow-hidden border">
                        {p.images?.[0]?.url ? (
                          <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{p.name}</p>
                      {p.category && <p className="text-xs text-muted-foreground">{p.category.name}</p>}
                    </TableCell>
                    <TableCell>
                      {p.offerPrice ? (
                        <div>
                          <span className="font-bold text-primary">S/ {p.offerPrice}</span>
                          <span className="text-xs text-muted-foreground line-through ml-2">S/ {p.price}</span>
                        </div>
                      ) : (
                        <span className="font-medium">S/ {p.price}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.status === 'active' ? 'border-primary text-primary bg-primary/5' : 'border-muted text-muted-foreground'}>
                        {p.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => toggleMutation.mutate({ id: p.id })} title="Alternar Estado">
                          <Power className={`w-4 h-4 ${p.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                          if(confirm('¿Eliminar producto?')) deleteMutation.mutate({ id: p.id })
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-20 text-muted-foreground">
               No has agregado productos aún.
             </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
