import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapPin } from "lucide-react";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface StoreMapItem {
  id: number;
  name: string;
  slug: string;
  lat: string | null;
  lng: string | null;
  district: string;
  category?: { name: string; icon?: string | null } | null;
  logoUrl?: string | null;
  whatsapp?: string | null;
}

interface StoreMapProps {
  stores: StoreMapItem[];
  center?: [number, number];
  zoom?: number;
  highlightedStoreId?: number;
  onStoreClick?: (store: StoreMapItem) => void;
  onMapReady?: (map: mapboxgl.Map) => void;
  className?: string;
}

const SAN_RAMON: [number, number] = [-75.3500, -11.1297]; // [lng, lat] — Mapbox format

function buildMarkerEl(store: StoreMapItem, isHighlighted: boolean): HTMLElement {
  const el = document.createElement("div");
  const color = isHighlighted ? "#EF4444" : "#2563EB";
  const icon = store.category?.icon || "🏪";

  if (store.logoUrl) {
    el.innerHTML = `
      <div style="
        width:40px;height:40px;border-radius:50%;
        border:3px solid ${color};
        box-shadow:0 2px 10px rgba(0,0,0,0.25);
        overflow:hidden;background:#fff;
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;
        transition:transform 0.15s ease;
      ">
        <img
          src="${store.logoUrl}"
          alt="${store.name}"
          style="width:100%;height:100%;object-fit:cover;"
          onerror="this.style.display='none';this.parentElement.innerHTML='<span style=\\"font-size:18px;line-height:40px\\">${icon}</span>'"
        />
      </div>`;
  } else {
    el.innerHTML = `
      <div style="
        background:${color};color:#fff;border-radius:50%;
        width:40px;height:40px;
        display:flex;align-items:center;justify-content:center;
        font-size:18px;
        box-shadow:0 2px 10px rgba(0,0,0,0.25);
        border:3px solid rgba(255,255,255,0.9);
        cursor:pointer;
        transition:transform 0.15s ease;
      ">${icon}</div>`;
  }

  el.style.cssText = "cursor:pointer;";
  el.addEventListener("mouseenter", () => {
    const inner = el.querySelector("div") as HTMLElement;
    if (inner) inner.style.transform = "scale(1.15)";
  });
  el.addEventListener("mouseleave", () => {
    const inner = el.querySelector("div") as HTMLElement;
    if (inner) inner.style.transform = "scale(1)";
  });

  return el;
}

function applyZoomScale(markers: Map<number, mapboxgl.Marker>, zoom: number) {
  markers.forEach(marker => {
    const el = marker.getElement();
    const inner = el.querySelector("div") as HTMLElement;
    if (!inner) return;
    if (zoom < 8) {
      el.style.display = "none";
    } else if (zoom < 11) {
      el.style.display = "";
      inner.style.transform = "scale(0.55)";
      inner.style.transformOrigin = "center center";
    } else if (zoom < 13) {
      el.style.display = "";
      inner.style.transform = "scale(0.8)";
      inner.style.transformOrigin = "center center";
    } else {
      el.style.display = "";
      inner.style.transform = "scale(1)";
    }
  });
}

export function StoreMap({
  stores,
  center,
  zoom = 13,
  highlightedStoreId,
  onStoreClick,
  onMapReady,
  className = "w-full h-full",
}: StoreMapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const [webGLError, setWebGLError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  /* ── Init map ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!mapboxgl.supported()) {
      setWebGLError(true);
      return;
    }

    // center prop is [lat, lng] (conventional), convert to Mapbox [lng, lat]
    const mapCenter: [number, number] = center
      ? [center[1], center[0]]
      : SAN_RAMON;

    const timer = setTimeout(() => {
      if (!containerRef.current || mapRef.current) return;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: mapCenter,
        zoom,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
          showUserHeading: false,
        }),
        "top-right",
      );

      map.on("zoom", () => {
        applyZoomScale(markersRef.current, map.getZoom());
      });

      map.once("load", () => {
        setMapReady(true);
        onMapReady?.(map);
      });

      mapRef.current = map;
    }, 100);

    return () => {
      clearTimeout(timer);
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Add / refresh markers whenever map is ready or stores change ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const validStores = stores.filter(s => {
      const lat = parseFloat(String(s.lat));
      const lng = parseFloat(String(s.lng));
      return !isNaN(lat) && !isNaN(lng);
    });

    validStores.forEach(store => {
      const lat = parseFloat(String(store.lat)); // Peru: -18 to 0
      const lng = parseFloat(String(store.lng)); // Peru: -81 to -68
      const isHighlighted = store.id === highlightedStoreId;

      const el = buildMarkerEl(store, isHighlighted);

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: "220px" })
        .setHTML(`
          <div style="font-family:sans-serif;padding:4px">
            <p style="font-weight:600;font-size:14px;margin:0 0 2px;color:#1e293b">${store.name}</p>
            <p style="font-size:12px;color:#64748b;margin:0 0 6px">${store.district}${store.category ? " · " + store.category.name : ""}</p>
            <div style="display:flex;gap:8px;align-items:center">
              <a href="/stores/${store.slug}" style="font-size:12px;color:#2563EB;text-decoration:none;font-weight:600">Ver tienda →</a>
              ${store.whatsapp ? `<a href="https://wa.me/${store.whatsapp.replace(/\D/g, "")}" target="_blank" style="font-size:12px;color:#16a34a;text-decoration:none;font-weight:600">WhatsApp</a>` : ""}
            </div>
          </div>
        `);

      // Mapbox always wants [lng, lat] — longitude first
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        onStoreClick?.(store);
      });

      if (isHighlighted) {
        marker.togglePopup();
      }

      markersRef.current.set(store.id, marker);
    });

    // Apply current zoom scale to newly added markers
    applyZoomScale(markersRef.current, map.getZoom());

    /* ── Fit bounds / fly to ── */
    if (highlightedStoreId) {
      const hs = validStores.find(s => s.id === highlightedStoreId);
      if (hs) {
        map.flyTo({ center: [parseFloat(String(hs.lng)), parseFloat(String(hs.lat))], zoom: 17 });
      }
    } else if (validStores.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      validStores.forEach(s => {
        // extend always takes [lng, lat]
        bounds.extend([parseFloat(String(s.lng)), parseFloat(String(s.lat))]);
      });
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    } else if (validStores.length === 1) {
      const s = validStores[0];
      map.flyTo({ center: [parseFloat(String(s.lng)), parseFloat(String(s.lat))], zoom: 15 });
    }
  }, [stores, highlightedStoreId, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fallback for browsers without WebGL ── */
  if (webGLError) {
    return (
      <div
        className={`${className} flex flex-col items-center justify-center gap-3 bg-gray-50 border border-gray-200 rounded-xl`}
        style={{ minHeight: "400px" }}
      >
        <MapPin className="w-10 h-10 text-gray-300" />
        <p className="text-sm text-gray-500 font-medium">El mapa no está disponible en este navegador</p>
        <p className="text-xs text-gray-400">Prueba con Chrome, Firefox o Safari actualizado</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: "400px", borderRadius: "12px", overflow: "hidden" }}
    />
  );
}
