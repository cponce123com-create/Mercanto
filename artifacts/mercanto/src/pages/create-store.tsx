import { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateStore, useListCategories, useAuthUpdateProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { DISTRICTS } from "@/lib/constants";
import { Store, MapPin, MessageCircle, CheckCircle2, Loader2, LocateFixed, Navigation, ShieldCheck, Tractor, ShoppingBag, CreditCard, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyStoreQueryKey, getAuthMeQueryKey } from "@workspace/api-client-react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/contexts";

const step3Schema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  categoryId: z.coerce.number().min(1, "Selecciona categoría"),
  description: z.string().min(10, "Breve descripción requerida"),
});

const step4Schema = z.object({
  district: z.string().min(1, "Selecciona distrito"),
  location: z.string().min(5, "Dirección requerida"),
});

const step5Schema = z.object({
  whatsapp: z.string().min(9, "Ingresa número válido"),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
});

const formSchema = step3Schema.merge(step4Schema).merge(step5Schema);
type FormData = z.infer<typeof formSchema>;

const SAN_RAMON_CENTER = { lat: -11.1297, lng: -75.3500 };

export default function CreateStore() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const hasDni = !!(user as any)?.dniFrontUrl && !!(user as any)?.dniBackUrl;

  // Steps: 1=type, 2=DNI(optional), 3=info, 4=location, 5=contact, 6=success
  const [step, setStep] = useState(1);
  const [storeType, setStoreType] = useState<"local" | "producer">("local");

  // DNI state
  const [dniNumber, setDniNumber] = useState("");
  const [dniFront, setDniFront] = useState<{ url: string; publicId: string } | null>(null);
  const [dniBack, setDniBack] = useState<{ url: string; publicId: string } | null>(null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  // Map state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<any>(null);
  const miniMarkerRef = useRef<any>(null);

  const { data: categories } = useListCategories();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", district: "San Ramón", location: "", whatsapp: "" },
    mode: "onChange",
  });

  const updateProfileMutation = useAuthUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAuthMeQueryKey() });
      },
    },
  });

  const createMutation = useCreateStore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyStoreQueryKey() });
        setStep(6);
      },
      onError: (e: any) => {
        toast.error(e?.response?.data?.message || e.message || "Error al crear tienda");
      },
    },
  });

  const uploadDniImage = async (file: File, side: "front" | "back") => {
    const setUploading = side === "front" ? setUploadingFront : setUploadingBack;
    setUploading(true);
    try {
      const base = import.meta.env.BASE_URL;
      const signRes = await fetch(`${base}api/upload/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ folder: "users/dni", resourceType: "image" }),
      });
      if (!signRes.ok) throw new Error("No se pudo firmar la subida");
      const { signature, timestamp, cloud_name, api_key, folder, upload_preset } = await signRes.json();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("signature", signature);
      fd.append("timestamp", timestamp.toString());
      fd.append("api_key", api_key);
      fd.append("folder", folder);
      if (upload_preset) fd.append("upload_preset", upload_preset);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
        method: "POST",
        body: fd,
      });
      if (!uploadRes.ok) throw new Error("Error al subir imagen");
      const data = await uploadRes.json();
      if (side === "front") {
        setDniFront({ url: data.secure_url, publicId: data.public_id });
      } else {
        setDniBack({ url: data.secure_url, publicId: data.public_id });
      }
      toast.success(`Foto ${side === "front" ? "delantera" : "trasera"} del DNI subida`);
    } catch (err: any) {
      toast.error(err.message || "Error subiendo imagen");
    } finally {
      setUploading(false);
    }
  };

  const saveDni = async () => {
    if (!dniNumber.trim() || dniNumber.length < 8) {
      toast.error("Ingresa un número de DNI válido (8 dígitos)");
      return;
    }
    if (!dniFront) {
      toast.error("Sube la foto delantera del DNI");
      return;
    }
    if (!dniBack) {
      toast.error("Sube la foto trasera del DNI");
      return;
    }
    try {
      await updateProfileMutation.mutateAsync({
        data: {
          dniNumber,
          dniFrontUrl: dniFront.url,
          dniFrontPublicId: dniFront.publicId,
          dniBackUrl: dniBack.url,
          dniBackPublicId: dniBack.publicId,
        } as any,
      });
      toast.success("Documentos guardados. Continúa con tu tienda.");
      setStep(3);
    } catch {
      toast.error("Error guardando documentos. Intenta de nuevo.");
    }
  };

  const initMiniMap = (lat: number, lng: number) => {
    if (!miniMapRef.current) return;

    if (miniMapInstanceRef.current) {
      miniMapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 16 });
      miniMarkerRef.current?.setLngLat([lng, lat]);
      return;
    }

    const map = new mapboxgl.Map({
      container: miniMapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 16,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const marker = new mapboxgl.Marker({ draggable: true, color: "#f97316" })
      .setLngLat([lng, lat])
      .addTo(map);

    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      setCoords({ lat: lngLat.lat, lng: lngLat.lng });
    });

    map.on("click", (e: mapboxgl.MapMouseEvent) => {
      marker.setLngLat(e.lngLat);
      setCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    miniMapInstanceRef.current = map;
    miniMarkerRef.current = marker;
  };

  useEffect(() => {
    if (!coords || !miniMapInstanceRef.current || !miniMarkerRef.current) return;
    miniMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    miniMapInstanceRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 16 });
  }, [coords]);

  const requestGPS = () => {
    if (!navigator.geolocation) { toast.error("Tu navegador no soporta geolocalización"); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        setGpsStatus("success");
        toast.success("Ubicación capturada correctamente");
        initMiniMap(lat, lng);
      },
      () => {
        setGpsStatus("error");
        setCoords(SAN_RAMON_CENTER);
        toast.warning("No se pudo obtener GPS. Se usó la ubicación del distrito.");
        initMiniMap(SAN_RAMON_CENTER.lat, SAN_RAMON_CENTER.lng);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  const nextStep = async () => {
    if (step === 3) {
      const valid = await form.trigger(["name", "categoryId", "description"]);
      if (valid) setStep(4);
    } else if (step === 4) {
      const valid = await form.trigger(["district", "location"]);
      if (valid) {
        if (!coords) setCoords(SAN_RAMON_CENTER);
        setStep(5);
      }
    }
  };

  const onSubmit = (data: FormData) => {
    const finalCoords = coords || SAN_RAMON_CENTER;
    createMutation.mutate({
      data: {
        ...data,
        storeType,
        lat: finalCoords.lat.toString(),
        lng: finalCoords.lng.toString(),
        district: storeType === "producer" ? data.district || "" : data.district,
      } as any,
    });
  };

  const totalSteps = hasDni ? 4 : 5;
  const currentDisplayStep = hasDni
    ? step === 1 ? 1 : step - 1
    : step;

  const StepIndicator = ({ num, label, icon: Icon }: any) => {
    const displayStep = hasDni ? currentDisplayStep : step;
    return (
      <div className={`flex flex-col items-center gap-2 ${displayStep >= num ? "text-primary" : "text-muted-foreground opacity-50"}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${displayStep >= num ? "bg-primary/10 border-primary" : "border-muted-foreground"}`}>
          {displayStep > num ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </div>
        <span className="text-xs font-medium hidden sm:block">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        {step < 6 && (
          <div className="mb-12">
            <h1 className="text-3xl font-display font-bold text-center mb-8">Configura tu Perfil Comercial</h1>
            <div className="flex justify-between items-center relative max-w-2xl mx-auto">
              <div className="absolute top-5 left-0 w-full h-0.5 bg-border -z-10" />
              <div className="absolute top-5 left-0 h-0.5 bg-primary -z-10 transition-all duration-500"
                style={{ width: `${((currentDisplayStep - 1) / (totalSteps - 1)) * 100}%` }} />
              <StepIndicator num={1} label="Tipo" icon={ShoppingBag} />
              {!hasDni && <StepIndicator num={2} label="Identidad" icon={CreditCard} />}
              <StepIndicator num={hasDni ? 2 : 3} label="Información" icon={Store} />
              <StepIndicator num={hasDni ? 3 : 4} label="Ubicación" icon={MapPin} />
              <StepIndicator num={hasDni ? 4 : 5} label="Contacto" icon={MessageCircle} />
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border p-6 md:p-10">

          {/* Step 1: Store Type */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-bold mb-2">¿Qué tipo de tienda quieres registrar?</h3>
              <p className="text-muted-foreground text-sm mb-8">Elige el modelo que mejor describe tu negocio. Esto define cómo los clientes te encontrarán.</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <button
                  type="button"
                  onClick={() => setStoreType("local")}
                  className={`rounded-2xl border-2 p-6 text-left transition-all ${storeType === "local" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40"}`}
                >
                  <ShoppingBag className={`w-8 h-8 mb-3 ${storeType === "local" ? "text-primary" : "text-muted-foreground"}`} />
                  <h4 className="font-bold text-base mb-1">Tienda Local</h4>
                  <p className="text-sm text-muted-foreground">Tiendas de barrio, bodegas, ferreterías, ropa, servicios. Presencia física en un distrito de Chanchamayo.</p>
                  {storeType === "local" && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                      <CheckCircle2 className="w-4 h-4" /> Seleccionado
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStoreType("producer")}
                  className={`rounded-2xl border-2 p-6 text-left transition-all ${storeType === "producer" ? "border-green-600 bg-green-50 shadow-md" : "border-border hover:border-green-400"}`}
                >
                  <Tractor className={`w-8 h-8 mb-3 ${storeType === "producer" ? "text-green-600" : "text-muted-foreground"}`} />
                  <h4 className="font-bold text-base mb-1">Compra al Productor</h4>
                  <p className="text-sm text-muted-foreground">Agricultores, ganaderos y artesanos que venden directo al consumidor. Café, cacao, miel, frutas, artesanía.</p>
                  {storeType === "producer" && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-green-600">
                      <CheckCircle2 className="w-4 h-4" /> Seleccionado
                    </div>
                  )}
                </button>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="button"
                  onClick={() => setStep(hasDni ? 3 : 2)}
                  className={storeType === "producer" ? "bg-green-600 hover:bg-green-700" : "bg-primary"}
                >
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: DNI Verification */}
          {step === 2 && !hasDni && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Verificación de Identidad</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-6">Para garantizar la seguridad de la plataforma, necesitamos verificar tu identidad con tu DNI. Tus documentos son privados y solo los revisa nuestro equipo.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Número de DNI</label>
                  <Input
                    placeholder="12345678"
                    maxLength={8}
                    value={dniNumber}
                    onChange={e => setDniNumber(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="max-w-xs"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Front */}
                  <div className="border-2 border-dashed rounded-2xl p-4 text-center hover:border-primary/60 transition-colors">
                    {dniFront ? (
                      <div className="space-y-2">
                        <img src={dniFront.url} alt="DNI Frontal" className="w-full h-32 object-cover rounded-lg" />
                        <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Foto delantera subida</p>
                        <button type="button" onClick={() => setDniFront(null)} className="text-xs text-red-500 underline">Cambiar</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && uploadDniImage(e.target.files[0], "front")}
                          disabled={uploadingFront}
                        />
                        {uploadingFront ? (
                          <div className="py-6"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                        ) : (
                          <div className="py-6">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Foto delantera del DNI</p>
                            <p className="text-xs text-muted-foreground mt-1">Toca para subir imagen</p>
                          </div>
                        )}
                      </label>
                    )}
                  </div>

                  {/* Back */}
                  <div className="border-2 border-dashed rounded-2xl p-4 text-center hover:border-primary/60 transition-colors">
                    {dniBack ? (
                      <div className="space-y-2">
                        <img src={dniBack.url} alt="DNI Trasero" className="w-full h-32 object-cover rounded-lg" />
                        <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Foto trasera subida</p>
                        <button type="button" onClick={() => setDniBack(null)} className="text-xs text-red-500 underline">Cambiar</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && uploadDniImage(e.target.files[0], "back")}
                          disabled={uploadingBack}
                        />
                        {uploadingBack ? (
                          <div className="py-6"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                        ) : (
                          <div className="py-6">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Foto trasera del DNI</p>
                            <p className="text-xs text-muted-foreground mt-1">Toca para subir imagen</p>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                  <strong>¿Por qué pedimos tu DNI?</strong> Verificamos la identidad de cada vendedor para evitar fraudes y garantizar un marketplace confiable. Tus datos no se compartirán con terceros.
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Atrás</Button>
                <Button
                  type="button"
                  onClick={saveDni}
                  disabled={updateProfileMutation.isPending || !dniFront || !dniBack || dniNumber.length < 8}
                  className="bg-primary"
                >
                  {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Guardar y continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Steps 3-5+6: Store form */}
          {step >= 3 && step < 6 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Step 3: Basic Info */}
                <div className={step === 3 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}>
                  <div className="flex items-center gap-2 mb-1">
                    {storeType === "producer" && <Tractor className="w-4 h-4 text-green-600" />}
                    <h3 className="text-xl font-bold">Información Básica</h3>
                  </div>
                  {storeType === "producer" && (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">Estás registrando una tienda de productor. Tu perfil aparecerá en la sección "Compra al Productor".</p>
                  )}
                  <div className="space-y-4 mt-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nombre de la tienda / productora</FormLabel><FormControl><Input placeholder={storeType === "producer" ? "Finca San Carlos - Café Orgánico" : "Bodega Don Pepe"} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="categoryId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría Principal</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl><Textarea placeholder={storeType === "producer" ? "¿Qué produces? ¿Qué hace especial tu producto? ¿Haces delivery o venta en chacra?" : "¿Qué vendes? ¿Por qué los clientes deberían elegirte?"} className="resize-none h-24" {...field} /></FormControl>
                        <FormDescription>Esta información será visible en tu perfil público.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Step 4: Location */}
                <div className={step === 4 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}>
                  <h3 className="text-xl font-bold mb-6">Ubicación</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="district" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distrito</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección o Referencia</FormLabel>
                        <FormControl><Input placeholder={storeType === "producer" ? "Sector Bajo Pichanaqui, a 2 km del puente" : "Av. Principal 123, frente a la plaza"} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="border rounded-2xl p-4 bg-secondary/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">Ubicación en el mapa</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Permite que los clientes te encuentren fácilmente.</p>
                        </div>
                        <Button type="button" variant={gpsStatus === "success" ? "outline" : "default"} size="sm" onClick={requestGPS} disabled={gpsStatus === "loading"} className={gpsStatus === "success" ? "border-green-500 text-green-700 hover:bg-green-50" : ""}>
                          {gpsStatus === "loading" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Obteniendo...</> : gpsStatus === "success" ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Capturada</> : <><LocateFixed className="w-4 h-4 mr-2" /> Usar mi GPS</>}
                        </Button>
                      </div>
                      {coords && (
                        <div className="space-y-2">
                          <div ref={miniMapRef} className="w-full h-48 rounded-xl overflow-hidden border border-primary/20" />
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Navigation className="w-3 h-3" />{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} — Arrastra el marcador para ajustar.</p>
                        </div>
                      )}
                      {gpsStatus === "error" && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No se pudo acceder al GPS. Se usará la ubicación central del distrito.</div>}
                    </div>
                  </div>
                </div>

                {/* Step 5: Contact */}
                <div className={step === 5 ? "block animate-in fade-in slide-in-from-right-4" : "hidden"}>
                  <h3 className="text-xl font-bold mb-6">Redes y Contacto</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="whatsapp" render={({ field }) => (
                      <FormItem><FormLabel>WhatsApp (Obligatorio)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+51</span>
                            <Input placeholder="987654321" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>{storeType === "producer" ? "Los compradores usarán este número para coordinar pedidos y entregas." : "Los clientes usarán este número para hacerte pedidos."}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="instagram" render={({ field }) => (
                      <FormItem><FormLabel>Instagram (Opcional)</FormLabel><FormControl><Input placeholder="https://instagram.com/tutienda" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="facebook" render={({ field }) => (
                      <FormItem><FormLabel>Facebook (Opcional)</FormLabel><FormControl><Input placeholder="https://facebook.com/tutienda" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t mt-8">
                  {step > 3 ? (
                    <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>Atrás</Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setStep(hasDni ? 1 : 2)}>Atrás</Button>
                  )}
                  {step < 5 ? (
                    <Button type="button" onClick={nextStep} className={storeType === "producer" ? "bg-green-600 hover:bg-green-700" : "bg-primary"}>
                      Continuar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={createMutation.isPending} className={storeType === "producer" ? "bg-green-600 hover:bg-green-700 shadow-colored" : "bg-primary shadow-colored"}>
                      {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Finalizar y Crear
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}

          {/* Step 6: Success */}
          {step === 6 && (
            <div className="text-center py-10">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${storeType === "producer" ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
                {storeType === "producer" ? <Tractor className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">¡Tienda Creada!</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {storeType === "producer"
                  ? "Tu productora ha sido registrada y está pendiente de aprobación. Nuestro equipo la revisará pronto."
                  : "Tu información ha sido guardada y está pendiente de aprobación. Ya puedes ir a tu panel para agregar productos."}
              </p>
              <Button size="lg" onClick={() => setLocation("/vendor")} className={`rounded-xl px-8 h-12 text-base ${storeType === "producer" ? "bg-green-600 hover:bg-green-700" : ""}`}>
                Ir a mi Dashboard
              </Button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
