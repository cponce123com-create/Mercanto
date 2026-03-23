import { Heart, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#1E293B] text-gray-400 pt-12 pb-6 mt-4">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 inline-flex">
              <div className="w-9 h-9 rounded-lg bg-[#EF4444] flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="font-bold text-xl text-white">Mercanto</span>
            </Link>
            <p className="text-sm leading-relaxed">
              El mercado vecinal digital de Chanchamayo. Conectando productores locales, artesanos y emprendedores con la comunidad.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white text-sm">Descubrir</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link href="/stores" className="hover:text-white transition-colors">Tiendas</Link></li>
              <li><Link href="/map" className="hover:text-white transition-colors">Mapa</Link></li>
              <li><Link href="/search" className="hover:text-white transition-colors">Búsqueda</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white text-sm">Para Vendedores</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/create-store" className="hover:text-white transition-colors">Crear mi tienda</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Acceso a vendedores</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Registrarse</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white text-sm">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#2563EB] shrink-0" /> San Ramón, Chanchamayo, Junín</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#2563EB] shrink-0" /> hola@mercanto.pe</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#2563EB] shrink-0" /> +51 987 654 321</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <p>© {new Date().getFullYear()} Mercanto — San Ramón, Chanchamayo, Junín</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="w-3.5 h-3.5 text-[#EF4444] fill-current mx-1" /> en la Selva Central
          </p>
        </div>
      </div>
    </footer>
  );
}
