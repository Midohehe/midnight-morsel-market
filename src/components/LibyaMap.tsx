import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ME } from "@/lib/store";

type Pin = { id: string; lat: number; lng: number; avatar: string; dist: number; is_open: boolean; label: string };

/** Real OpenStreetMap of Tripoli, Libya. Leaflet is loaded only in the browser. */
export function LibyaMap({ kitchens, youLabel }: { kitchens: Pin[]; youLabel: string }) {
  const el = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const key = kitchens.map((k) => k.id).join(",");

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([ME.lat, ME.lng], 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: "© OpenStreetMap contributors",
      , className: "nb-tiles" }).addTo(map);
      L.marker([ME.lat, ME.lng], { icon: L.divIcon({ className: "", html: `<div class="nb-me"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] }) })
        .addTo(map).bindTooltip(youLabel);
      const pts: [number, number][] = [[ME.lat, ME.lng]];
      kitchens.forEach((k) => {
        pts.push([k.lat, k.lng]);
        L.marker([k.lat, k.lng], {
          icon: L.divIcon({ className: "", html: `<div class="nb-pin ${k.is_open ? "" : "nb-pin-off"}">${k.avatar} ${k.dist} km</div>`, iconSize: [80, 28], iconAnchor: [40, 28] }),
        }).addTo(map!).bindTooltip(k.label).on("click", () => navigate({ to: "/kitchen/$id", params: { id: k.id } }));
      });
      if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40] });
    });
    return () => { cancelled = true; map?.remove(); };
  }, [key]);

  return <div ref={el} className="h-72 overflow-hidden rounded-3xl border" dir="ltr" />;
}
