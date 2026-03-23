import { Link, useLocation } from "wouter";
import { Search, Menu, User, LogOut, LayoutDashboard, Store as StoreIcon, Heart, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useDistrict } from "@/lib/contexts";
import { DISTRICTS } from "@/lib/constants";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useRef, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalSearch } from "@workspace/api-client-react";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatPrice(price: string | null | undefined): string {
  if (!price) return "";
  return `S/ ${parseFloat(price).toFixed(2)}`;
}

export function Navbar() {
  const [, setLocation] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { district, setDistrict } = useDistrict();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: searchResults } = useGlobalSearch(
    { q: debouncedQuery, type: "all" },
    { query: { enabled: debouncedQuery.length >= 2 } as any }
  );

  const stores = searchResults?.stores?.slice(0, 5) ?? [];
  const products = searchResults?.products?.slice(0, 6) ?? [];
  const hasResults = stores.length > 0 || products.length > 0;
  const showDropdown = isFocused && debouncedQuery.length >= 2;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsFocused(false);
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSelect = useCallback((url: string) => {
    setSearchQuery("");
    setIsFocused(false);
    setLocation(url);
  }, [setLocation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
        <div ref={wrapperRef} className="flex-1 max-w-2xl relative">
          <form onSubmit={handleSearch} className="flex">
            <input
              ref={inputRef}
              type="text"
              placeholder="¿Qué estás buscando?"
              className="flex-1 h-10 px-4 text-sm border border-gray-300 border-r-0 rounded-l-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 bg-white transition-shadow"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
                className="h-10 px-2 border border-gray-300 border-r-0 bg-white text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="h-10 px-4 md:px-5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-r-xl flex items-center justify-center transition-colors shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden max-h-[480px] overflow-y-auto">
              {!hasResults && debouncedQuery.length >= 2 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Sin resultados para "<strong>{debouncedQuery}</strong>"
                </div>
              ) : (
                <>
                  {/* Stores section */}
                  {stores.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                          <StoreIcon className="w-3 h-3" /> Tiendas
                        </span>
                      </div>
                      {stores.map((store: any) => (
                        <button
                          key={store.id}
                          type="button"
                          onMouseDown={() => handleSelect(`/stores/${store.slug}`)}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base shrink-0">
                            {store.category?.icon || '🏪'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight text-gray-900 truncate group-hover:text-primary">{store.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {store.category?.name && <span>{store.category.name} · </span>}
                              {store.district}
                            </p>
                          </div>
                          <span className="text-xs text-primary font-medium shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Products section */}
                  {products.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b border-t">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                          <Package className="w-3 h-3" /> Productos
                        </span>
                      </div>
                      {products.map((product: any) => {
                        const img = product.images?.[0]?.url;
                        const storeSlug = product.store?.slug;
                        const hasOffer = product.offerPrice && parseFloat(product.offerPrice) < parseFloat(product.price);
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onMouseDown={() => handleSelect(`/stores/${storeSlug}`)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left group"
                          >
                            {img ? (
                              <img src={img} alt={product.name} className="w-9 h-9 rounded-lg object-cover shrink-0 border" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold leading-tight text-gray-900 truncate group-hover:text-primary">{product.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {product.store?.name && <span className="font-medium">{product.store.name}</span>}
                                {product.store?.district && <span> · {product.store.district}</span>}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {hasOffer ? (
                                <>
                                  <p className="text-sm font-bold text-[#16A34A]">{formatPrice(product.offerPrice)}</p>
                                  <p className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</p>
                                </>
                              ) : (
                                <p className="text-sm font-bold text-gray-800">{formatPrice(product.price)}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer: see all results */}
                  <div className="border-t">
                    <button
                      type="button"
                      onMouseDown={() => handleSelect(`/search?q=${encodeURIComponent(debouncedQuery)}`)}
                      className="w-full px-4 py-2.5 text-sm text-center text-[#2563EB] font-semibold hover:bg-blue-50 transition-colors"
                    >
                      Ver todos los resultados de "{debouncedQuery}" →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

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
