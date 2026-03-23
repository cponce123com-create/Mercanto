import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/contexts";
import {
  Store, Package, LayoutDashboard, Settings, LogOut,
  Users, Tag, Image as ImageIcon, Loader2, ShieldAlert,
  ShieldCheck, ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'vendor' | 'admin';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLocation(`/login?redirect=${encodeURIComponent(location)}`);
      return;
    }
    if (role === 'admin' && user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, isLoading, role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (role === 'admin' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-destructive opacity-50" />
          <p className="font-semibold">Acceso restringido</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const isAdmin = user.role === 'admin';

  const vendorLinks = [
    { href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vendor/products", label: "Mis Productos", icon: Package },
    { href: "/vendor/store", label: "Ajustes de Tienda", icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin", label: "Resumen", icon: LayoutDashboard },
    { href: "/admin/stores", label: "Tiendas", icon: Store },
    { href: "/admin/users", label: "Usuarios", icon: Users },
    { href: "/admin/categories", label: "Categorías", icon: Tag },
    { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  ];

  const links = role === 'admin' ? adminLinks : vendorLinks;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r flex flex-col h-auto md:h-screen md:sticky md:top-0">
        {/* Logo + mode badge */}
        <div className="p-5 border-b">
          <Link href="/" className="flex items-center gap-2 group mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${role === 'admin' ? 'bg-purple-600' : 'bg-primary'}`}>
              {role === 'admin'
                ? <ShieldCheck className="w-5 h-5" />
                : <Store className="w-5 h-5" />
              }
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              {role === 'admin' ? 'Admin' : 'Vendedor'}
            </span>
          </Link>

          {/* View switcher — only shown to admins */}
          {isAdmin && (
            <button
              onClick={() => setLocation(role === 'admin' ? '/vendor' : '/admin')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border
                ${role === 'admin'
                  ? 'border-blue-200 bg-blue-50 text-[#2563EB] hover:bg-blue-100'
                  : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span>
                {role === 'admin' ? 'Cambiar a Mi Tienda' : 'Cambiar a Panel Admin'}
              </span>
            </button>
          )}
        </div>

        {/* Nav links */}
        <div className="p-4 flex-1 overflow-y-auto flex gap-2 md:flex-col overflow-x-auto md:overflow-x-hidden">
          {links.map((link) => {
            const Icon = link.icon;
            const basePath = role === 'admin' ? '/admin' : '/vendor';
            const isActive = location === link.href ||
              (link.href !== basePath && location.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap md:whitespace-normal font-medium text-sm
                  ${isActive
                    ? role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {link.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* User info + logout */}
        <div className="p-4 border-t hidden md:block">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${isAdmin ? 'bg-purple-600' : 'bg-primary'}`}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold truncate">{user?.name}</p>
                {isAdmin && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold leading-none shrink-0">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
