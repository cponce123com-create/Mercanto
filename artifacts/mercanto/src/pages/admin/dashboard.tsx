import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminGetStats } from "@workspace/api-client-react";
import { Loader2, Users, Store, Package, Star, Tag, Image as ImageIcon, AlertTriangle, MessageSquare, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "wouter";

function StatCard({
  label, value, sub, icon: Icon, color = "text-foreground", bg = "bg-white", border = "border-gray-100",
}: {
  label: string; value: number | string; sub?: string;
  icon: React.FC<{ className?: string }>;
  color?: string; bg?: string; border?: string;
}) {
  return (
    <div className={`${bg} border ${border} rounded-2xl p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className={`w-5 h-5 ${color} opacity-70`} />
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function QuickLink({
  href, icon: Icon, label, desc, color
}: {
  href: string; icon: React.FC<{ className?: string }>;
  label: string; desc: string; color: string;
}) {
  return (
    <Link href={href}>
      <div className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminGetStats();

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Buenos días" : now.getHours() < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting} 👋</p>
            <h1 className="text-3xl font-display font-bold">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Mercanto · Chanchamayo, Perú
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-white border border-gray-100 rounded-xl px-4 py-2.5">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Marketplace activo
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Usuarios Registrados"
            value={stats?.totalUsers || 0}
            icon={Users}
            color="text-[#2563EB]"
          />
          <StatCard
            label="Tiendas Activas"
            value={stats?.activeStores || 0}
            sub={`de ${stats?.totalStores || 0} registradas`}
            icon={Store}
            color="text-[#16A34A]"
          />
          <StatCard
            label="Pendientes de Revisión"
            value={stats?.pendingStores || 0}
            sub="requieren atención"
            icon={AlertTriangle}
            color="text-amber-600"
            bg="bg-amber-50/50"
            border={stats?.pendingStores ? "border-amber-200" : "border-gray-100"}
          />
          <StatCard
            label="Total Productos"
            value={stats?.totalProducts || 0}
            sub={`${stats?.totalReviews || 0} reseñas`}
            icon={Package}
            color="text-[#F97316]"
          />
        </div>

        {/* Pending alert */}
        {(stats?.pendingStores || 0) > 0 && (
          <Link href="/admin/stores?status=pending">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-amber-100/60 transition-colors">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800">
                  {stats!.pendingStores} {stats!.pendingStores === 1 ? "tienda pendiente" : "tiendas pendientes"} de aprobación
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Revísalas y actívalas o recházalas</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600" />
            </div>
          </Link>
        )}

        {/* Quick access */}
        <div>
          <h2 className="text-lg font-display font-bold mb-4">Acceso Rápido</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickLink
              href="/admin/stores"
              icon={Store}
              label="Gestión de Tiendas"
              desc={`${stats?.totalStores || 0} tiendas — activar, suspender, auditar`}
              color="bg-[#2563EB]/10 text-[#2563EB]"
            />
            <QuickLink
              href="/admin/users"
              icon={Users}
              label="Gestión de Usuarios"
              desc={`${stats?.totalUsers || 0} usuarios — roles y bloqueos`}
              color="bg-purple-100 text-purple-700"
            />
            <QuickLink
              href="/admin/categories"
              icon={Tag}
              label="Categorías"
              desc="Administrar categorías del marketplace"
              color="bg-[#16A34A]/10 text-[#16A34A]"
            />
            <QuickLink
              href="/admin/banners"
              icon={ImageIcon}
              label="Banners y Portadas"
              desc="Carrusel de la página principal"
              color="bg-[#F97316]/10 text-[#F97316]"
            />
          </div>
        </div>

        {/* Stats secondary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-sm">Productos</span>
            </div>
            <div className="text-4xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">publicados en el marketplace</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-sm">Reseñas</span>
            </div>
            <div className="text-4xl font-bold">{stats?.totalReviews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">calificaciones de clientes</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
