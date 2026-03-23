import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md bg-white rounded-3xl shadow-xl border">
        <h1 className="text-8xl font-display font-black text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Página no encontrada</h2>
        <p className="text-muted-foreground mb-8">
          Parece que te has perdido en la selva. La ruta que buscas no existe o ha sido movida.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </div>
    </div>
  );
}
