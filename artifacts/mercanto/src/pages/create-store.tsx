import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateStore, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { DISTRICTS } from "@/lib/constants";
import { Store, MapPin, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyStoreQueryKey } from "@workspace/api-client-react";

const step1Schema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  categoryId: z.coerce.number().min(1, "Selecciona categoría"),
  description: z.string().min(10, "Breve descripción requerida"),
});

const step2Schema = z.object({
  district: z.string().min(1, "Selecciona distrito"),
  location: z.string().min(5, "Dirección requerida"),
});

const step3Schema = z.object({
  whatsapp: z.string().min(9, "Ingresa número válido"),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
});

const formSchema = step1Schema.merge(step2Schema).merge(step3Schema);
type FormData = z.infer<typeof formSchema>;

export default function CreateStore() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const { data: categories } = useListCategories();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", district: "San Ramón", location: "", whatsapp: "" },
    mode: "onChange"
  });

  const createMutation = useCreateStore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyStoreQueryKey() });
        setStep(4); // Success step
      },
      onError: (e: any) => {
        toast.error(e.message || "Error al crear tienda");
      }
    }
  });

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await form.trigger(["name", "categoryId", "description"]);
    if (step === 2) isValid = await form.trigger(["district", "location"]);
    if (isValid) setStep(s => s + 1);
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      data: {
        ...data,
        lat: "-11.1297", // Default placeholder
        lng: "-75.3500", // Default placeholder
      }
    });
  };

  const StepIndicator = ({ num, label, icon: Icon }: any) => (
    <div className={`flex flex-col items-center gap-2 ${step >= num ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= num ? 'bg-primary/10 border-primary' : 'border-muted-foreground'}`}>
        {step > num ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
      </div>
      <span className="text-xs font-medium hidden sm:block">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        {step < 4 && (
          <div className="mb-12">
            <h1 className="text-3xl font-display font-bold text-center mb-8">Configura tu Perfil Comercial</h1>
            <div className="flex justify-between items-center relative max-w-lg mx-auto">
              <div className="absolute top-5 left-0 w-full h-0.5 bg-border -z-10" />
              <div className={`absolute top-5 left-0 h-0.5 bg-primary -z-10 transition-all duration-500`} style={{ width: `${((step - 1) / 2) * 100}%` }} />
              
              <StepIndicator num={1} label="Información" icon={Store} />
              <StepIndicator num={2} label="Ubicación" icon={MapPin} />
              <StepIndicator num={3} label="Contacto" icon={MessageCircle} />
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border p-6 md:p-10">
          {step === 4 ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">¡Tienda Creada!</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Tu información ha sido guardada y está pendiente de aprobación. Ya puedes ir a tu panel para empezar a agregar productos.
              </p>
              <Button size="lg" onClick={() => setLocation('/vendor')} className="rounded-xl px-8 h-12 text-base">
                Ir a mi Dashboard
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className={step === 1 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}>
                  <h3 className="text-xl font-bold mb-6">Información Básica</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="name" render={({field}) => (
                      <FormItem><FormLabel>Nombre de la tienda</FormLabel><FormControl><Input placeholder="Bodega Don Pepe" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="categoryId" render={({field}) => (
                      <FormItem>
                        <FormLabel>Categoría Principal</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      <FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({field}) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl><Textarea placeholder="¿Qué vendes? ¿Por qué los clientes deberían elegirte?" className="resize-none h-24" {...field}/></FormControl>
                        <FormDescription>Esta información será visible en tu perfil público.</FormDescription>
                        <FormMessage/>
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className={step === 2 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}>
                  <h3 className="text-xl font-bold mb-6">Ubicación</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="district" render={({field}) => (
                      <FormItem>
                        <FormLabel>Distrito</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                          <SelectContent>
                            {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      <FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({field}) => (
                      <FormItem><FormLabel>Dirección Exacta o Referencia</FormLabel><FormControl><Input placeholder="Av. Principal 123, frente a la plaza" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                  </div>
                </div>

                <div className={step === 3 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}>
                  <h3 className="text-xl font-bold mb-6">Redes y Contacto</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="whatsapp" render={({field}) => (
                      <FormItem><FormLabel>WhatsApp (Obligatorio)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+51</span>
                            <Input placeholder="987654321" className="pl-10" {...field}/>
                          </div>
                        </FormControl>
                        <FormDescription>Los clientes usarán este número para hacerte pedidos.</FormDescription>
                      <FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="instagram" render={({field}) => (
                      <FormItem><FormLabel>Instagram (Opcional)</FormLabel><FormControl><Input placeholder="https://instagram.com/tutienda" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                    <FormField control={form.control} name="facebook" render={({field}) => (
                      <FormItem><FormLabel>Facebook (Opcional)</FormLabel><FormControl><Input placeholder="https://facebook.com/tutienda" {...field}/></FormControl><FormMessage/></FormItem>
                    )} />
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t mt-8">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>Atrás</Button>
                  ) : <div></div>}
                  
                  {step < 3 ? (
                    <Button type="button" onClick={nextStep} className="bg-primary">Continuar <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  ) : (
                    <Button type="submit" disabled={createMutation.isPending} className="bg-primary shadow-colored">
                      {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Finalizar y Crear
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </div>
      </main>
    </div>
  );
}

// Just importing ArrowRight to make it compile
import { ArrowRight } from "lucide-react";
