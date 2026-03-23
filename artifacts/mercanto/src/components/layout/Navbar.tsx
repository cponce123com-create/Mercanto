import { Link, useLocation } from "wouter";
import { Search, Menu, User, LogOut, LayoutDashboard, Store as StoreIcon, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useDistrict } from "@/lib/contexts";
import { DISTRICTS } from "@/lib/constants";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center gap-3 md:gap-5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EF4444] shadow-sm">
            <span className="text-white font-black text-xl" style={{ fontFamily: "'Inter', sans-serif" }}>m</span>
          </div>
          <span className="font-black text-xl text-[#1E293B] hidden sm:block tracking-tight">
            Mercanto
          </span>
        </Link>

        {/* Search — center, takes remaining space */}
        <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl">
          <input
            type="text"
            placeholder="¿Qué estás buscando?"
            className="flex-1 h-10 px-4 text-sm border border-gray-300 border-r-0 rounded-l-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 bg-white transition-shadow"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="h-10 px-4 md:px-5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-r-xl flex items-center justify-center transition-colors shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Right — desktop */}
        <nav className="hidden md:flex items-center gap-5 shrink-0">
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="flex flex-col items-center gap-0.5 text-[#1E293B] hover:text-[#2563EB] transition-colors cursor-pointer">
                <Heart className="w-5 h-5" />
                <span className="text-[10px] font-semibold leading-none mt-0.5">Favoritos</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center gap-0.5 text-[#1E293B] hover:text-[#2563EB] transition-colors outline-none">
                    <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-[10px] font-black">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-semibold leading-none mt-0.5">Mi Cuenta</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
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
              <button onClick={() => setLocation('/login')}
                className="flex flex-col items-center gap-0.5 text-[#1E293B] hover:text-[#2563EB] transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-[10px] font-semibold leading-none mt-0.5">Favoritos</span>
              </button>
              <button onClick={() => setLocation('/login')}
                className="flex flex-col items-center gap-0.5 text-[#1E293B] hover:text-[#2563EB] transition-colors">
                <User className="w-5 h-5" />
                <span className="text-[10px] font-semibold leading-none mt-0.5">Mi Cuenta</span>
              </button>
            </>
          )}
        </nav>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center shrink-0 ml-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-5 pt-6">
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar distrito" /></SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <nav className="flex flex-col gap-2 text-sm font-medium border-t pt-4">
                  <Link href="/" className="py-2 hover:text-[#2563EB]">Inicio</Link>
                  <Link href="/stores" className="py-2 hover:text-[#2563EB]">Directorio</Link>
                  <Link href="/map" className="py-2 hover:text-[#2563EB]">Mapa</Link>
                </nav>

                <div className="border-t pt-4">
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold text-sm">{user?.name}</p>
                      {user?.role === 'vendor' && (
                        <Link href="/vendor" className="text-sm py-1 hover:text-[#2563EB] flex items-center gap-2">
                          <StoreIcon className="w-4 h-4" /> Mi Tienda
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link href="/admin" className="text-sm py-1 hover:text-[#2563EB] flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4" /> Admin
                        </Link>
                      )}
                      <button onClick={logout} className="text-sm py-1 text-red-500 text-left flex items-center gap-2">
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
