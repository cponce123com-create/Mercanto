import { Link, useLocation } from "wouter";
import { Search, Menu, User, LogOut, LayoutDashboard, Store as StoreIcon, Heart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useDistrict } from "@/lib/contexts";
import { DISTRICTS } from "@/lib/constants";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Navbar() {
  const [, setLocation] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { district, setDistrict } = useDistrict();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#EF4444] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <span className="font-bold text-xl text-[#1E293B] hidden sm:inline-block tracking-tight">
            Mercanto
          </span>
        </Link>

        {/* Search Bar - Center */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:flex items-center gap-0">
          <input
            type="text"
            placeholder="¿Qué estás buscando?"
            className="flex-1 h-10 px-4 border border-gray-300 rounded-l-lg text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="h-10 px-5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-r-lg flex items-center justify-center transition-colors shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Right side */}
        <div className="ml-auto hidden md:flex items-center gap-5">
          <Link href="/stores" className="flex flex-col items-center gap-0.5 text-[#1E293B] hover:text-[#2563EB] transition-colors">
            <StoreIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Directorio</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/profile" className="flex flex-col items-center gap-0.5 text-[#1E293B] hover:text-[#2563EB] transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-xs font-medium">Favoritos</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center gap-0.5 text-[#1E293B] hover:text-[#2563EB] transition-colors outline-none">
                    <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium">Mi Cuenta</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setLocation('/admin')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'vendor' ? (
                    <DropdownMenuItem onClick={() => setLocation('/vendor')}>
                      <StoreIcon className="mr-2 h-4 w-4" /> Mi Tienda
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setLocation('/create-store')}>
                      <StoreIcon className="mr-2 h-4 w-4" /> Crear Tienda
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setLocation('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <button
                onClick={() => setLocation('/profile')}
                className="flex flex-col items-center gap-0.5 text-[#1E293B] hover:text-[#2563EB] transition-colors"
              >
                <Heart className="w-5 h-5" />
                <span className="text-xs font-medium">Favoritos</span>
              </button>
              <button
                onClick={() => setLocation('/login')}
                className="flex flex-col items-center gap-0.5 text-[#1E293B] hover:text-[#2563EB] transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-xs font-medium">Mi Cuenta</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2 ml-auto">
          <button onClick={() => setLocation('/search')} className="p-2 text-[#1E293B]">
            <Search className="w-5 h-5" />
          </button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-5 py-6">
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar distrito" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <form onSubmit={handleSearch} className="flex gap-0">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="flex-1 h-10 px-3 border border-gray-300 rounded-l-lg text-sm outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="h-10 px-4 bg-[#2563EB] text-white rounded-r-lg">
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                <nav className="flex flex-col gap-3 border-t pt-4">
                  <Link href="/stores" className="text-sm font-medium flex items-center gap-2 py-2">
                    <StoreIcon className="w-4 h-4" /> Directorio de Tiendas
                  </Link>
                  <Link href="/map" className="text-sm font-medium flex items-center gap-2 py-2">
                    Mapa Interactivo
                  </Link>
                </nav>

                <div className="border-t pt-4">
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-3">
                      <p className="font-semibold text-sm">{user?.name}</p>
                      {user?.role === 'vendor' && (
                        <Link href="/vendor" className="text-sm flex items-center gap-2 py-1">
                          <StoreIcon className="w-4 h-4" /> Mi Tienda
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link href="/admin" className="text-sm flex items-center gap-2 py-1">
                          <LayoutDashboard className="w-4 h-4" /> Admin
                        </Link>
                      )}
                      <Link href="/profile" className="text-sm flex items-center gap-2 py-1">
                        <User className="w-4 h-4" /> Mi Perfil
                      </Link>
                      <button onClick={logout} className="text-sm flex items-center gap-2 py-1 text-red-500">
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button className="w-full bg-[#2563EB] hover:bg-[#1d4ed8]" onClick={() => setLocation('/login')}>Ingresar</Button>
                      <Button variant="outline" className="w-full" onClick={() => setLocation('/register')}>Registrarse</Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
