import { Heart, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer
      className="site-footer pt-12 pb-[76px] md:pb-6 mt-4"
      style={{ backgroundColor: "#1E293B", color: "#cbd5e1" }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 inline-flex">
              <div className="w-9 h-9 rounded-lg bg-[#EF4444] flex items-center justify-center font-bold text-lg" style={{ color: "#ffffff" }}>
                M
              </div>
              <span className="font-bold text-xl" style={{ color: "#ffffff" }}>Mercanto</span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
              El mercado vecinal digital de Chanchamayo. Conectando productores locales, artesanos y emprendedores con la comunidad.
            </p>
          </div>

          {/* Descubrir */}
          <div>
            <h4 className="font-bold mb-4 text-sm" style={{ color: "#ffffff" }}>Descubrir</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="footer-link" style={{ color: "#cbd5e1" }}>Inicio</Link></li>
              <li><Link href="/stores" style={{ color: "#cbd5e1" }}>Tiendas</Link></li>
              <li><Link href="/map" style={{ color: "#cbd5e1" }}>Mapa</Link></li>
              <li><Link href="/search" style={{ color: "#cbd5e1" }}>Búsqueda</Link></li>
            </ul>
          </div>

          {/* Para Vendedores */}
          <div>
            <h4 className="font-bold mb-4 text-sm" style={{ color: "#ffffff" }}>Para Vendedores</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/create-store" style={{ color: "#cbd5e1" }}>Crear mi tienda</Link></li>
              <li><Link href="/login" style={{ color: "#cbd5e1" }}>Acceso a vendedores</Link></li>
              <li><Link href="/register" style={{ color: "#cbd5e1" }}>Registrarse</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-bold mb-4 text-sm" style={{ color: "#ffffff" }}>Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2" style={{ color: "#cbd5e1" }}>
                <MapPin className="w-4 h-4 shrink-0" style={{ color: "#2563EB" }} />
                San Ramón, Chanchamayo, Junín
              </li>
              <li className="flex items-center gap-2" style={{ color: "#cbd5e1" }}>
                <Mail className="w-4 h-4 shrink-0" style={{ color: "#2563EB" }} />
                hola@mercanto.pe
              </li>
              <li className="flex items-center gap-2" style={{ color: "#cbd5e1" }}>
                <Phone className="w-4 h-4 shrink-0" style={{ color: "#2563EB" }} />
                +51 987 654 321
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm" style={{ color: "#94a3b8" }}>
          <p>© {new Date().getFullYear()} Mercanto — San Ramón, Chanchamayo, Junín</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="w-3.5 h-3.5 fill-current mx-1" style={{ color: "#EF4444" }} /> en la Selva Central
          </p>
        </div>
      </div>
    </footer>
  );
}
