import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/contexts";
import { Store, Package, LayoutDashboard, Settings, LogOut, Users, Tag, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'vendor' | 'admin';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

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
        <div className="p-6 border-b flex items-center justify-between md:block">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Mercanto {role === 'admin' ? 'Admin' : 'Vendor'}
            </span>
          </Link>
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex gap-2 md:flex-col overflow-x-auto md:overflow-x-hidden">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href || (link.href !== `/${role}` && location.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap md:whitespace-normal font-medium text-sm
                  ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {link.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t hidden md:block">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Salir
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
