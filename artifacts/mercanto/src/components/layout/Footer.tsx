import { Store, Heart, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group inline-flex">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Mercanto
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              El mercado vecinal digital de Chanchamayo. Conectando productores locales, artesanos y emprendedores con la comunidad.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 font-display">Descubrir</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/stores" className="hover:text-primary transition-colors">Directorio de tiendas</Link></li>
              <li><Link href="/map" className="hover:text-primary transition-colors">Mapa interactivo</Link></li>
              <li><Link href="/search" className="hover:text-primary transition-colors">Búsqueda de productos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 font-display">Para Emprendedores</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/create-store" className="hover:text-primary transition-colors">Crear mi tienda</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Acceso a vendedores</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Guía de ventas</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 font-display">Contacto</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Chanchamayo, Junín</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> hola@mercanto.pe</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> +51 987 654 321</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Mercanto. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="w-4 h-4 text-destructive fill-current" /> en la Selva Central
          </p>
        </div>
      </div>
    </footer>
  );
}
