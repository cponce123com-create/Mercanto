import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthLogin, type LoginRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useLocation } from "wouter";
import { Store, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthMeQueryKey } from "@workspace/api-client-react";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const form = useForm<LoginRequest>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useAuthLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getAuthMeQueryKey(), data.user);
        toast.success("¡Bienvenido de vuelta!");
        setLocation(data.user.role === 'vendor' ? '/vendor' : (data.user.role === 'admin' ? '/admin' : '/'));
      },
      onError: (err: any) => {
        toast.error(err.message || "Error al iniciar sesión");
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-colored">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold">Ingresar a Mercanto</h1>
          <p className="text-muted-foreground mt-2">Gestiona tu tienda y conecta con clientes</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => loginMutation.mutate({ data: d }))} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full h-12 text-base rounded-xl mt-6" disabled={loginMutation.isPending}>
              {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Crea tu tienda
          </Link>
        </div>
        <div className="mt-4 text-center">
           <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
