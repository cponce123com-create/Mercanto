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

  const validStores = stores.filter(s => s.lat && s.lng);
  const mapCenter = center || SAN_RAMON_CENTER;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let L: typeof import("leaflet");

    const initMap = async () => {
      L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icon paths for bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

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

      mapRef.current = map;

      // Add markers
      validStores.forEach(store => {
        const lat = parseFloat(store.lat!);
        const lng = parseFloat(store.lng!);
        if (isNaN(lat) || isNaN(lng)) return;

        const isHighlighted = store.id === highlightedStoreId;

        const markerHtml = `
          <div style="
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

        const icon = L.divIcon({
          html: markerHtml,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -36],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);

        const popupContent = `
          <div style="min-width: 160px; font-family: sans-serif;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #1e293b;">${store.name}</div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${store.category?.name || ''} · ${store.district}</div>
            <a href="/stores/${store.slug}" 
               style="display: block; background: #2563EB; color: white; text-align: center; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none;">
              Ver tienda →
            </a>
          </div>`;

        marker.bindPopup(popupContent, { maxWidth: 220 });

        if (isHighlighted) {
          marker.openPopup();
        }

        marker.on("click", () => {
          onStoreClick?.(store);
        });

        markersRef.current.set(store.id, marker);
      });

      // Fit to store bounds if there are multiple stores and no specific center
      if (!center && validStores.length > 1) {
        const group = L.featureGroup(Array.from(markersRef.current.values()));
        map.fitBounds(group.getBounds().pad(0.15));
      }

      // Center on highlighted store
      if (highlightedStoreId) {
        const hs = validStores.find(s => s.id === highlightedStoreId);
        if (hs?.lat && hs?.lng) {
          map.setView([parseFloat(hs.lat), parseFloat(hs.lng)], 17);
        }
      }
    };

    initMap();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  return (
    <div ref={containerRef} className={className} />
  );
}
