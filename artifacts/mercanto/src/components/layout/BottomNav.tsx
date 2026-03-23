import { Link, useLocation } from "wouter";
import { Home, Store, Map, User } from "lucide-react";
import { useAuth } from "@/lib/contexts";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/stores", icon: Store, label: "Tiendas" },
  { href: "/map", icon: Map, label: "Mapa" },
  { href: "/login", icon: User, label: "Mi Cuenta", authHref: "/profile" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (href: string, authHref?: string) => {
    const target = isAuthenticated && authHref ? authHref : href;
    if (target === "/") return location === "/";
    return location.startsWith(target);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-stretch h-[60px]">
        {NAV_ITEMS.map(({ href, icon: Icon, label, authHref }) => {
          const target = isAuthenticated && authHref ? authHref : href;
          const active = isActive(href, authHref);
          return (
            <Link key={href} href={target} className="flex-1">
              <div className={`flex flex-col items-center justify-center h-full gap-1 transition-colors ${
                active ? "text-[#2563EB]" : "text-gray-400 hover:text-gray-600"
              }`}>
                <div className={`relative flex items-center justify-center w-8 h-6`}>
                  {active && (
                    <span className="absolute inset-x-0 -top-1 h-0.5 bg-[#2563EB] rounded-b-full" />
                  )}
                  <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                </div>
                <span className={`text-[10px] font-semibold leading-none ${active ? "text-[#2563EB]" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
