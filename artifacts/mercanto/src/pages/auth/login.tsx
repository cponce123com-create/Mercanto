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
  const redirectTo = new URLSearchParams(window.location.search).get("redirect");
  
  const form = useForm<LoginRequest>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useAuthLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getAuthMeQueryKey(), data.user);
        toast.success("¡Bienvenido de vuelta!");
        const dest = redirectTo || (data.user.role === 'vendor' ? '/vendor' : (data.user.role === 'admin' ? '/admin' : '/'));
        setLocation(dest);
      },
      onError: (err: any) => {
        toast.error(err.message || "Error al iniciar sesión");
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "#F8FAFC" }}>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/30 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#EF4444] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-md">
            <span className="font-black text-2xl" style={{ fontFamily: "Inter, sans-serif" }}>m</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Ingresar a Mercanto</h1>
          <p className="text-gray-500 mt-1 text-sm">Gestiona tu tienda y conecta con clientes</p>
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
            
            <Button type="submit" className="w-full h-11 text-base rounded-xl mt-6 bg-[#2563EB] hover:bg-[#1d4ed8]" disabled={loginMutation.isPending}>
              {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-gray-500">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-[#2563EB] font-bold hover:underline">
            Crea tu tienda
          </Link>
        </div>
        <div className="mt-3 text-center">
           <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
