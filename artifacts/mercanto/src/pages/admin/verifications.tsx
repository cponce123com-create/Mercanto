import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Eye, ShieldCheck, ShieldX, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface VerificationUser {
  id: number;
  name: string;
  email: string;
  dniNumber: string | null;
  dniFrontUrl: string | null;
  dniBackUrl: string | null;
  identityVerified: boolean | null;
  identityRejectedReason: string | null;
  createdAt: string;
}

function RejectModal({ user, onClose, onConfirm }: { user: VerificationUser; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldX className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-lg">Rechazar verificación</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Estás rechazando la verificación de <strong>{user.name}</strong>. El usuario recibirá un email con el motivo.
        </p>
        <textarea
          className="w-full border rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-300"
          placeholder="Motivo del rechazo (ej: Foto borrosa, DNI ilegible, foto no corresponde...)"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1 bg-red-500 hover:bg-red-600"
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
          >
            Rechazar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImageViewer({ url, label }: { url: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="relative cursor-pointer rounded-xl overflow-hidden border hover:opacity-90 transition-opacity group"
        onClick={() => setOpen(true)}
      >
        <img src={url} alt={label} className="w-full h-28 object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-xs text-center py-1 bg-white border-t font-medium text-muted-foreground">{label}</p>
      </div>
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <img src={url} alt={label} className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </>
  );
}

export default function AdminVerifications() {
  const queryClient = useQueryClient();
  const [rejectUser, setRejectUser] = useState<VerificationUser | null>(null);

  const { data: users = [], isLoading } = useQuery<VerificationUser[]>({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL;
      const res = await fetch(`${base}api/admin/verifications`, { credentials: "include" });
      if (!res.ok) throw new Error("Error cargando verificaciones");
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ userId, action, reason }: { userId: number; action: "approve" | "reject"; reason?: string }) => {
      const base = import.meta.env.BASE_URL;
      const res = await fetch(`${base}api/admin/verifications/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error procesando verificación");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      toast.success(variables.action === "approve" ? "Identidad aprobada ✓" : "Verificación rechazada");
      setRejectUser(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Error procesando acción");
    },
  });

  const handleApprove = (user: VerificationUser) => {
    actionMutation.mutate({ userId: user.id, action: "approve" });
  };

  const handleReject = (user: VerificationUser, reason: string) => {
    actionMutation.mutate({ userId: user.id, action: "reject", reason });
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Verificaciones de Identidad</h1>
        </div>
        <p className="text-muted-foreground">Revisa y aprueba los DNIs subidos por los usuarios que quieren crear tiendas.</p>
      </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay verificaciones pendientes</h3>
              <p className="text-muted-foreground">¡Todo está al día! Vuelve más tarde.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span><strong>{users.length}</strong> verificación{users.length !== 1 ? "es" : ""} pendiente{users.length !== 1 ? "s" : ""}.</span>
              </p>

              {users.map(user => (
                <div key={user.id} className="bg-white border rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">{user.name}</h3>
                        <Badge variant="outline" className="text-xs">{user.email}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">DNI: <span className="font-mono font-medium text-foreground">{user.dniNumber || "—"}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Registrado: {new Date(user.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      {user.identityRejectedReason && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 mt-2">
                          Rechazo previo: {user.identityRejectedReason}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => handleApprove(user)}
                        disabled={actionMutation.isPending}
                      >
                        {actionMutation.isPending && actionMutation.variables?.userId === user.id && actionMutation.variables?.action === "approve"
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CheckCircle2 className="w-4 h-4" />}
                        <span className="ml-1.5">Aprobar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400 text-red-500 hover:bg-red-50"
                        onClick={() => setRejectUser(user)}
                        disabled={actionMutation.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="ml-1.5">Rechazar</span>
                      </Button>
                    </div>
                  </div>

                  {(user.dniFrontUrl || user.dniBackUrl) && (
                    <div className="mt-4 grid grid-cols-2 gap-3 max-w-xs">
                      {user.dniFrontUrl && <ImageViewer url={user.dniFrontUrl} label="DNI Frontal" />}
                      {user.dniBackUrl && <ImageViewer url={user.dniBackUrl} label="DNI Trasero" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      {rejectUser && (
        <RejectModal
          user={rejectUser}
          onClose={() => setRejectUser(null)}
          onConfirm={(reason) => handleReject(rejectUser, reason)}
        />
      )}
    </DashboardLayout>
  );
}
