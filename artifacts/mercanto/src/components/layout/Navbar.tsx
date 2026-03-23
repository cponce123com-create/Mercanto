import { Link, useLocation } from "wouter";
import { Store, Map, Search, Menu, User, LogOut, LayoutDashboard, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useDistrict } from "@/lib/contexts";
import { DISTRICTS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Input } from "@/components/ui/input";

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

  const NavLinks = () => (
    <>
      <Link href="/stores" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2">
        <Store className="w-4 h-4" /> Directorio
      </Link>
      <Link href="/map" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2">
        <Map className="w-4 h-4" /> Mapa
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-colored">
            <StoreIcon className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground hidden sm:inline-block">
            Mercanto
          </span>
        </Link>

        {/* Desktop Center: District & Search */}
        <div className="hidden md:flex flex-1 max-w-xl items-center gap-2">
          <div className="w-48">
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="border-0 bg-secondary/50 focus:ring-0">
                <SelectValue placeholder="Distrito" />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar tiendas o productos..." 
              className="pl-9 border-0 bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Desktop Right Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
          
          <div className="h-6 w-px bg-border mx-2"></div>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
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
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setLocation('/login')}>Ingresar</Button>
              <Button onClick={() => setLocation('/register')} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-colored">
                Crear Tienda
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 py-6">
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="Distrito" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <form onSubmit={handleSearch} className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>

                <nav className="flex flex-col gap-4">
                  <NavLinks />
                </nav>

                <div className="h-px bg-border w-full"></div>

                {isAuthenticated ? (
                  <div className="flex flex-col gap-4">
                    <p className="font-medium text-sm text-muted-foreground px-2">Mi Cuenta</p>
                    {user?.role === 'vendor' && (
                      <Link href="/vendor" className="text-sm font-medium flex items-center gap-2 px-2">
                        <StoreIcon className="w-4 h-4" /> Mi Tienda
                      </Link>
                    )}
                    <Link href="/profile" className="text-sm font-medium flex items-center gap-2 px-2">
                      <User className="w-4 h-4" /> Perfil
                    </Link>
                    <Button variant="ghost" onClick={logout} className="justify-start px-2 text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full" onClick={() => setLocation('/login')}>Ingresar</Button>
                    <Button className="w-full" onClick={() => setLocation('/register')}>Registrarse</Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
