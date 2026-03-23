import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetVendorProducts, useToggleProductStatus, useDeleteProduct, type CreateProductRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Power, Loader2, Image as ImageIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { getGetVendorProductsQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateProduct, useUpdateProduct, useListCategories } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiImageUpload } from "@/components/shared/ImageUpload";

const productSchema = z.object({
  name: z.string().min(2, "Requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "Requerido"),
  offerPrice: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  unit: z.string().optional(),
  status: z.string().default("active"),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function VendorProducts() {
  const { data: products, isLoading } = useGetVendorProducts();
  const queryClient = useQueryClient();
  const { data: categories } = useListCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetVendorProductsQueryKey() });

  const toggleMutation = useToggleProductStatus({ mutation: { onSuccess: () => { invalidate(); toast.success("Estado actualizado"); } } });
  const deleteMutation = useDeleteProduct({ mutation: { onSuccess: () => { invalidate(); toast.success("Producto eliminado"); } } });
  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => { invalidate(); toast.success("Producto creado"); setIsOpen(false); }
    }
  });
  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => { invalidate(); toast.success("Producto actualizado"); setIsOpen(false); }
    }
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", description: "", unit: "unidad", status: "active" }
  });

  const openCreate = () => {
    setEditingId(null);
    setProductImages([]);
    form.reset({ name: "", price: "", description: "", unit: "unidad", status: "active" });
    setIsOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setProductImages(product.images?.map((img: any) => img.url) || []);
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

  const onSubmit = (data: ProductFormData) => {
    const payload = { ...data, images: productImages.map((url, i) => ({ url, sortOrder: i })) };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const maxProducts = 30;
  const currentCount = products?.length || 0;
  const canCreate = currentCount < maxProducts;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout role="vendor">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Catálogo de Productos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {currentCount} de {maxProducts} espacios usados
            </p>
          </div>

          <Button
            onClick={openCreate}
            disabled={!canCreate}
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
          </Button>
        </div>

        {/* Product Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">

                {/* Imágenes */}
                <MultiImageUpload
                  folder="products"
                  values={productImages}
                  onChange={setProductImages}
                  max={5}
                  label="Fotos del producto (máx. 5)"
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl><Input placeholder="Ej: Café Molido 500g" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Regular (S/) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">S/</span>
                          <Input type="number" step="0.10" min="0" className="pl-8" placeholder="0.00" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="offerPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Oferta (S/)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#EF4444] text-sm font-medium">S/</span>
                          <Input type="number" step="0.10" min="0" className="pl-8 border-red-200 focus-visible:ring-red-300" placeholder="Opcional" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="categoryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="unit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad</FormLabel>
                      <FormControl><Input placeholder="ej: kg, docena, unidad" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl><Textarea rows={3} placeholder="Describe tu producto..." className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <DialogFooter>
                  <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isPending} className="bg-[#2563EB] hover:bg-[#1d4ed8]">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {editingId ? "Guardar Cambios" : "Crear Producto"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Products table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-[#2563EB]" /></div>
          ) : products && products.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50">
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
                  <TableRow key={p.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        {p.images?.[0]?.url ? (
                          <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm text-[#1E293B]">{p.name}</p>
                      {p.category && <p className="text-xs text-gray-400">{p.category.name}</p>}
                    </TableCell>
                    <TableCell>
                      {p.offerPrice ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-[#16A34A] text-sm">S/ {p.offerPrice}</span>
                          <span className="text-xs text-gray-400 line-through">S/ {p.price}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-sm">S/ {p.price}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={p.status === "active"
                          ? "border-green-300 text-green-700 bg-green-50"
                          : "border-gray-300 text-gray-500 bg-gray-50"}
                      >
                        {p.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleMutation.mutate({ id: p.id })} title="Activar/Desactivar">
                          <Power className={`w-4 h-4 ${p.status === "active" ? "text-green-600" : "text-gray-400"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Edit2 className="w-4 h-4 text-[#2563EB]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => { if (confirm("¿Eliminar producto?")) deleteMutation.mutate({ id: p.id }); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aún no has agregado productos.</p>
              <p className="text-sm mt-1">Haz click en "Nuevo Producto" para empezar.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
