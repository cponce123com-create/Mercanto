import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

interface StoreMapItem {
  id: number;
  name: string;
  slug: string;
  lat: string | null;
  lng: string | null;
  district: string;
  category?: { name: string; icon?: string | null } | null;
  logoUrl?: string | null;
}

interface StoreMapProps {
  stores: StoreMapItem[];
  center?: [number, number];
  zoom?: number;
  highlightedStoreId?: number;
  onStoreClick?: (store: StoreMapItem) => void;
  className?: string;
}

const SAN_RAMON_CENTER: [number, number] = [-11.1297, -75.3500];

function buildMarkerHtml(store: StoreMapItem, isHighlighted: boolean): string {
  return `<div style="
    background: ${isHighlighted ? '#EF4444' : '#2563EB'};
    color: white;
    border-radius: 50% 50% 50% 0;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    cursor: pointer;
  ">
    <span style="transform: rotate(45deg); font-size: 14px;">
      ${store.category?.icon || '🏪'}
    </span>
  </div>`;
}

function buildPopupHtml(store: StoreMapItem): string {
  return `<div style="min-width: 160px; font-family: sans-serif;">
    <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #1e293b;">${store.name}</div>
    <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${store.category?.name || ''} · ${store.district}</div>
    <a href="/stores/${store.slug}"
       style="display: block; background: #2563EB; color: white; text-align: center; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none;">
      Ver tienda →
    </a>
  </div>`;
}

export function StoreMap({
  stores,
  center,
  zoom = 15,
  highlightedStoreId,
  onStoreClick,
  className = "w-full h-full",
}: StoreMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, LeafletMarker>>(new Map());
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const readyRef = useRef(false);

  // ── 1. Initialize map once ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const mapCenter = center || SAN_RAMON_CENTER;
      const map = L.map(containerRef.current!, {
        center: mapCenter,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      LRef.current = L;
      mapRef.current = map;
      readyRef.current = true;

      // Force Leaflet to recalculate size after layout settles (fixes blank map on mobile)
      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => {
        map.invalidateSize();
        renderMarkers(L, map, stores, highlightedStoreId, center);
      }, 150);
    };

    initMap();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
      readyRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Re-render markers whenever stores or highlighted store changes ──────
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !readyRef.current) return;
    renderMarkers(L, map, stores, highlightedStoreId, center);
  }, [stores, highlightedStoreId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Marker renderer (pure function, no hooks) ──────────────────────────────
  function renderMarkers(
    L: typeof import("leaflet"),
    map: LeafletMap,
    currentStores: StoreMapItem[],
    highlighted: number | undefined,
    mapCenter: [number, number] | undefined,
  ) {
    // Remove all existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const validStores = currentStores.filter(s => s.lat && s.lng);

    validStores.forEach(store => {
      const lat = parseFloat(store.lat!);
      const lng = parseFloat(store.lng!);
      if (isNaN(lat) || isNaN(lng)) return;

      const isHighlighted = store.id === highlighted;

      const icon = L.divIcon({
        html: buildMarkerHtml(store, isHighlighted),
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.bindPopup(buildPopupHtml(store), { maxWidth: 220 });

      if (isHighlighted) marker.openPopup();

      marker.on("click", () => { onStoreClick?.(store); });

      markersRef.current.set(store.id, marker);
    });

    // Fit bounds to visible markers
    if (validStores.length > 1) {
      const group = L.featureGroup(Array.from(markersRef.current.values()));
      if (group.getBounds().isValid()) {
        map.fitBounds(group.getBounds().pad(0.15));
      }
    } else if (validStores.length === 1) {
      const s = validStores[0];
      map.setView([parseFloat(s.lat!), parseFloat(s.lng!)], 16);
    } else if (!mapCenter) {
      map.setView(SAN_RAMON_CENTER, zoom);
    }

    // Center on highlighted store
    if (highlighted) {
      const hs = validStores.find(s => s.id === highlighted);
      if (hs?.lat && hs?.lng) {
        map.setView([parseFloat(hs.lat), parseFloat(hs.lng)], 17);
      }
    }
  }

  return (
    <div className="relative w-full h-full flex-1">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
