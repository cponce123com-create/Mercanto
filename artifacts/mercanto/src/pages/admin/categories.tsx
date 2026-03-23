import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useAdminListCategories, useAdminCreateCategory, useAdminUpdateCategory,
  getAdminListCategoriesQueryKey, type Category,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Tag, Pencil, Check, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface CategoryForm {
  name: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function emptyForm(): CategoryForm {
  return { name: "", slug: "", icon: "🛍️", description: "", isActive: true, sortOrder: 0 };
}

function CategoryFormFields({ form, setForm }: { form: CategoryForm; setForm: (f: CategoryForm) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Ícono (emoji)</Label>
          <Input
            value={form.icon}
            onChange={e => setForm({ ...form, icon: e.target.value })}
            placeholder="🛍️"
            className="text-2xl text-center"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Orden</Label>
          <Input
            type="number"
            value={form.sortOrder}
            onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
            min={0}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Nombre</Label>
        <Input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
          placeholder="Electrónica, Ropa, Alimentos..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Slug (URL)</Label>
        <Input
          value={form.slug}
          onChange={e => setForm({ ...form, slug: e.target.value })}
          placeholder="electronica"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Descripción (opcional)</Label>
        <Input
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción de la categoría"
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={form.isActive}
          onCheckedChange={v => setForm({ ...form, isActive: v })}
        />
        <Label>Activa (visible en la tienda)</Label>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryForm>(emptyForm());
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>(emptyForm());

  const { data: categories, isLoading } = useAdminListCategories();

  const createMutation = useAdminCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() });
        setCreateOpen(false);
        setCreateForm(emptyForm());
        toast.success("Categoría creada");
      },
      onError: (e: any) => toast.error(e.message || "Error al crear categoría"),
    },
  });

  const updateMutation = useAdminUpdateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() });
        setEditId(null);
        toast.success("Categoría actualizada");
      },
      onError: (e: any) => toast.error(e.message || "Error al actualizar"),
    },
  });

  const startEdit = (c: Category) => {
    setEditId(c.id);
    setEditForm({
      name: c.name,
      slug: c.slug,
      icon: c.icon || "🛍️",
      description: c.description || "",
      isActive: c.isActive ?? true,
      sortOrder: c.sortOrder ?? 0,
    });
  };

  const saveEdit = () => {
    if (!editId) return;
    updateMutation.mutate({ id: editId, data: { ...editForm } });
  };

  const toggleActive = (c: Category) => {
    updateMutation.mutate({
      id: c.id,
      data: {
        name: c.name,
        slug: c.slug,
        isActive: !c.isActive,
      },
    });
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-display font-bold">Categorías</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {(categories || []).length} categorías en el marketplace
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Categoría</DialogTitle>
              </DialogHeader>
              <CategoryFormFields form={createForm} setForm={setCreateForm} />
              <Button
                className="w-full mt-2"
                disabled={!createForm.name || !createForm.slug || createMutation.isPending}
                onClick={() => createMutation.mutate({ data: { ...createForm } })}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Crear Categoría
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories grid */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {(categories || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map(cat => (
              <div
                key={cat.id}
                className={`bg-white border rounded-xl overflow-hidden transition-all ${editId === cat.id ? "border-primary shadow-md" : "border-gray-100 hover:border-gray-200"}`}
              >
                {editId === cat.id ? (
                  <div className="p-5 space-y-4">
                    <CategoryFormFields form={editForm} setForm={setEditForm} />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditId(null)}
                        disabled={updateMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending
                          ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          : <Check className="w-4 h-4 mr-1" />}
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center text-2xl shrink-0">
                      {cat.icon || <Tag className="w-5 h-5 text-primary/50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold">{cat.name}</span>
                        {!cat.isActive && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Inactiva</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-2 flex-wrap">
                        <span className="font-mono">/{cat.slug}</span>
                        {cat.description && <span>· {cat.description}</span>}
                        <span>· Orden: {cat.sortOrder ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={cat.isActive ?? true}
                        onCheckedChange={() => toggleActive(cat)}
                        disabled={updateMutation.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => startEdit(cat)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {(categories || []).length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Tag className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No hay categorías creadas aún.</p>
                <p className="text-sm">Crea la primera categoría con el botón de arriba.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
