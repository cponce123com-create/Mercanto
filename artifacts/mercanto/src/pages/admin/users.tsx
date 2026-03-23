import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useAdminListUsers, useAdminUpdateUserRole, useAdminToggleUserBlock,
  getAdminListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, ShieldCheck, ShieldX, UserCog, Users, Store, User } from "lucide-react";

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    admin:  { label: "Admin",   icon: <ShieldCheck className="w-3 h-3" />, cls: "bg-purple-100 text-purple-700 border-purple-200" },
    vendor: { label: "Vendor",  icon: <Store className="w-3 h-3" />,       cls: "bg-blue-100 text-[#2563EB] border-blue-200" },
    user:   { label: "Usuario", icon: <User className="w-3 h-3" />,        cls: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const c = cfg[role] || cfg.user;
  return (
    <Badge variant="outline" className={`flex items-center gap-1 w-fit font-semibold text-xs ${c.cls}`}>
      {c.icon} {c.label}
    </Badge>
  );
}

function timeAgo(date?: string | null) {
  if (!date) return "—";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`;
  return `hace ${Math.floor(diff / 2592000)} meses`;
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useAdminListUsers({ page });

  const roleMutation = useAdminUpdateUserRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast.success("Rol actualizado");
      },
      onError: () => toast.error("Error al actualizar rol"),
    },
  });

  const blockMutation = useAdminToggleUserBlock({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast.success(data.isBlocked ? "Usuario bloqueado" : "Usuario desbloqueado");
      },
      onError: () => toast.error("Error al cambiar estado"),
    },
  });

  const users = (data?.users || []).filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  const roleCounts = (data?.users || []).reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Gestión de Usuarios</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data?.total || 0} usuarios registrados en total
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Admins", count: roleCounts.admin || 0, icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
            { label: "Vendedores", count: roleCounts.vendor || 0, icon: Store, color: "text-[#2563EB]", bg: "bg-blue-50 border-blue-100" },
            { label: "Usuarios", count: roleCounts.user || 0, icon: Users, color: "text-gray-600", bg: "bg-gray-50 border-gray-100" },
          ].map(({ label, count, icon: Icon, color, bg }) => (
            <div key={label} className={`border rounded-xl p-4 ${bg}`}>
              <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${color}`}>
                <Icon className="w-4 h-4" /> {label}
              </div>
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Distrito</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Cambiar Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} className={u.isBlocked ? "opacity-50 bg-red-50/30" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 flex items-center justify-center font-bold text-[#2563EB] text-sm shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight">{u.name}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{u.district || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{timeAgo(u.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      {u.isBlocked
                        ? <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                        : <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">Activo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={u.role}
                          onValueChange={(role) => roleMutation.mutate({ id: u.id, data: { role: role as "user" | "vendor" | "admin" } })}
                          disabled={roleMutation.isPending || u.role === 'admin'}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 text-xs gap-1 ${u.isBlocked
                            ? "text-green-700 border-green-200 hover:bg-green-50"
                            : "text-red-600 border-red-200 hover:bg-red-50"}`}
                          onClick={() => blockMutation.mutate({ id: u.id })}
                          disabled={blockMutation.isPending || u.role === 'admin'}
                        >
                          {u.isBlocked ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldX className="w-3.5 h-3.5" />}
                          {u.isBlocked ? "Desbloquear" : "Bloquear"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      {search ? "No se encontraron usuarios con esa búsqueda." : "No hay usuarios registrados."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              ← Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {data.totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
              Siguiente →
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
