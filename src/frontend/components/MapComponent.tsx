"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToString } from "react-dom/server";
import { AlertTriangle, MapPin, ShieldAlert, Flame, Swords, Bomb, Zap, Factory, Plane, Anchor, Radiation, Rocket, Satellite, Landmark, Radio, Droplets, TrainFront, Building2 } from "lucide-react";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const FRONTLINE_GEOJSON_URL = "/api/map/frontline.json";

export interface UWMEvent {
  id: string;
  type: string;
  source: string;
  content: string;
  timestamp?: string;
  lat?: number;
  lon?: number;
  location_name?: string;
  geojson_url?: string;
  polygon?: any;
}

interface MapProps {
  activeLayers: string[];
  events: UWMEvent[];
  lang?: 'en' | 'ru' | 'ua';
}

export default function MapComponent({ activeLayers, events, lang = 'en' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).openSatView = (src: string) => {
        const largeSrc = src.replace('size=400,200', 'size=1200,800');
        setModalImage(largeSrc);
        window.dispatchEvent(new CustomEvent('uwm:sat-modal', { detail: { isOpen: true } }));
      };
    }
  }, []);

  const closeSatModal = () => {
    setModalImage(null);
    window.dispatchEvent(new CustomEvent('uwm:sat-modal', { detail: { isOpen: false } }));
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [34.0, 48.0],
      zoom: 6,
      attributionControl: false,
    });
    setMap(mapInstance);

    mapInstance.on("load", () => {
      mapInstance.addSource("frontline", {
        type: "geojson",
        data: FRONTLINE_GEOJSON_URL,
      });

      // Frontline Territories Layer
      mapInstance.addLayer({
        id: "frontline-fill",
        type: "fill",
        source: "frontline",
        paint: {
          "fill-color": [
            "case",
            ["==", ["to-string", ["get", "type"]], "3"], "#10b981", // Liberated (Green)
            ["==", ["to-string", ["get", "type"]], "2"], "#7c3aed", // Occupied 2014 (Deep Purple)
            ["==", ["to-string", ["get", "type"]], "1"], "#ef4444", // Occupied 2022 (Pure Red)
            ["==", ["to-string", ["get", "type"]], "4"], "#94a3b8", // Grey Zone (Grey)
            "rgba(0,0,0,0)" // Default to transparent
          ],
          "fill-opacity": 0.35,
        },
      });

      mapInstance.addLayer({
        id: "frontline-line",
        type: "line",
        source: "frontline",
        paint: {
          "line-color": "#475569",
          "line-width": 0.5,
          "line-opacity": 0.3
        },
      });

      mapInstance.on("click", "frontline-fill", (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as any;
        const rawName = (props.name || "").toLowerCase();
        const type = String(props.type || "");
        
        let displayName = "";
        if (rawName.includes("dismissed") || rawName.includes("liberated") || type === "3") {
          displayName = lang === 'ua' ? 'Звільнена територія' : lang === 'ru' ? 'Оסвобождено' : 'Liberated';
        } else if (rawName.includes("ordlo") || rawName.includes("crimea") || rawName.includes("крим") || type === "2") {
          displayName = lang === 'ua' ? 'Крим / ОРДЛО (2014)' : lang === 'ru' ? 'Крым / ОРДЛО (2014)' : 'Occupied (2014)';
        } else if (rawName.includes("occupied") || rawName.includes("окуποвано") || type === "1") {
          displayName = lang === 'ua' ? 'Окуποвана територія (2022)' : lang === 'ru' ? 'Оקקупировано (2022)' : 'Occupied (2022)';
        } else {
          displayName = lang === 'ua' ? 'Сіра зона' : lang === 'ru' ? 'Серая зона' : 'Contested / Grey Zone';
        }

        new maplibregl.Popup({ className: 'tactical-popup', closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="background: rgba(11, 13, 17, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(59, 130, 246, 0.5); border-radius: 6px; padding: 8px 12px; color: #f3f4f6; font-family: 'Inter', system-ui, sans-serif;">
            <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">Territory Status</div>
            <div style="font-size: 14px; font-weight: 700;">${displayName}</div>
          </div>`)
          .addTo(mapInstance);
      });
      
      mapInstance.on("mouseenter", "frontline-fill", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "frontline-fill", () => {
        mapInstance.getCanvas().style.cursor = "";
      });
    });

    return () => {
      if (mapInstance) mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const CITY_COORDS: { [key: string]: [number, number] } = {
       "kyiv": [30.5234, 50.4501], "kharkiv": [36.2304, 49.9935], "odessa": [30.7233, 46.4825],
       "dnipro": [35.0462, 48.4647], "donetsk": [37.8028, 48.0159], "zaporizhzhia": [35.1396, 47.8388],
       "lviv": [24.0297, 49.8397], "kherson": [32.6169, 46.6354], "mariupol": [37.5413, 47.0971],
       "bakhmut": [38.0161, 48.5946], "avdiivka": [37.7441, 48.1366]
    };

    events.forEach((ev) => {
      const isStrategicStrike = (ev as any).subtype === "strategic_neutralization";
      const isStrategic = ["energy_infrastructure", "air_base", "naval_base", "nuclear_site", "missile_infrastructure", "power_plant", "radar_station", "command_center", "factory"].includes(ev.type);
      
      if (ev.type === "economic" || ev.type === "news") return;

      if (activeLayers) {
        let category = "other";
        if (["air_alert", "strike", "bombing"].includes(ev.type)) category = "strikes";
        else if (ev.type === "combat") category = "units";
        else if (isStrategic) category = ev.type;
        else if (ev.type === "deployment") category = "intell";
        if (!activeLayers.includes(category)) return;
      }

      let lon = ev.lon;
      let lat = ev.lat;

      if (!lat || !lon) {
          const contentLower = ev.content.toLowerCase();
          for (const [city, coords] of Object.entries(CITY_COORDS)) {
            if (contentLower.includes(city)) {
              [lon, lat] = coords;
              break;
            }
          }
      }

      if (!lat || !lon) return;

      if (!markersRef.current[ev.id]) {
        const el = document.createElement("div");
        el.className = "marker-tactical";
        
        let color = "#3b82f6";
        let iconMarkup = renderToString(<MapPin size={12} color={color} />);
        
        if (ev.type === "combat") { color = "#ef4444"; iconMarkup = renderToString(<Swords size={12} color={color} />); }
        else if (ev.type === "strike") { color = "#ff9f1c"; iconMarkup = renderToString(<Bomb size={12} color={color} />); }
        else if (ev.type === "air_alert") { color = "#ff3b3b"; iconMarkup = renderToString(<AlertTriangle size={12} color={color} />); }
        else if (isStrategic) { 
           color = "#fbbf24"; 
           const strategicIcons: Record<string, any> = {
              "power_plant": <Zap size={12} color={color} />,
              "nuclear_site": <Radiation size={12} color={color} />,
              "air_base": <Plane size={12} color={color} />,
              "factory": <Building2 size={12} color={color} />,
              "missile_infrastructure": <Rocket size={12} color={color} />
           };
           iconMarkup = renderToString(strategicIcons[ev.type] || <ShieldAlert size={12} color={color} />);
        }

        const pulseClass = isStrategicStrike ? 'strategic-strike-pulse' : '';

        el.innerHTML = `
          <div class="${pulseClass}" style="position:relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); border: 1px solid ${color}; border-radius: 4px;">
             ${iconMarkup}
          </div>
        `;

        const latF = lat, lonF = lon; // Preserve for the closure
        const showSatellite = (isStrategic || ev.type === "strike") && latF && lonF;
        const satelliteHtml = showSatellite ? `
          <div 
            onclick="window.openSatView && window.openSatView(this.querySelector('img').src)"
            style="margin-top: 10px; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 4px; overflow: hidden; height: 120px; position: relative; background: #000; cursor: zoom-in;"
          >
            <div style="position: absolute; top: 0; left: 0; padding: 2px 4px; background: rgba(0,0,0,0.8); color: #38bdf8; font-size: 7px; font-family: monospace; z-index: 10;">SATLINK: ACTIVE</div>
            <img 
              src="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lonF - 0.01},${latF - 0.005},${lonF + 0.01},${latF + 0.005}&bboxSR=4326&imageSR=4326&size=400,200&format=jpg&f=image" 
              style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8) contrast(1.2) sepia(0.1);"
              alt="Satellite View"
            />
          </div>
        ` : '';

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lon, lat])
          .setPopup(new maplibregl.Popup({ className: 'tactical-popup', offset: 15, closeButton: false }).setHTML(`
            <div style="background: rgba(11, 13, 17, 0.95); backdrop-filter: blur(8px); border: 1px solid ${isStrategicStrike ? '#ef4444' : '#1f2937'}; border-radius: 6px; padding: 10px; color: #f3f4f6; max-width: 250px;">
              <div style="font-family: monospace; font-size: 9px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase;">
                ${ev.source} | ${ev.type.replace('_', ' ')}
              </div>
              <div style="font-size: 12px; line-height: 1.4;">${(ev as any)[`translation_${lang}`] || ev.content}</div>
              ${satelliteHtml}
            </div>
          `))
          .addTo(map);

        markersRef.current[ev.id] = marker;
      }
    });

    // Animate missiles for new strikes
    events.forEach(ev => {
       if (ev.type === "strike" && !markersRef.current[ev.id]) {
          const targetCoords: [number, number] = [ev.lon || 34, ev.lat || 48];
          animateMissileFlight(map, targetCoords, "strike");
       }
    });

  }, [map, events, lang, activeLayers]);

  return (
    <div ref={mapContainer} className="relative w-full h-full">
      <div className="absolute bottom-6 right-6 z-10 bg-[#0b0d11]/90 p-4 rounded-lg border border-[#1f2937] shadow-2xl backdrop-blur-md">
         <h4 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Tactical Legend</h4>
         <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#ef4444]/40 border border-[#ef4444]"></div>
              <span className="text-[10px] text-gray-200">Occupied Territory (2022)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#7c3aed]/40 border border-[#7c3aed]"></div>
              <span className="text-[10px] text-gray-200">Occupied (2014) / Crimea</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#10b981]/40 border border-[#10b981]"></div>
              <span className="text-[10px] text-gray-200">Liberated Territory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#94a3b8]/40 border border-[#94a3b8]"></div>
              <span className="text-[10px] text-gray-200">Contested Zone</span>
            </div>
         </div>
      </div>

      {modalImage && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 animate-in fade-in transition-all" onClick={closeSatModal}>
          <div className="relative max-w-5xl w-full glass-panel border border-blue-500/30 overflow-hidden" onClick={e => e.stopPropagation()}>
             <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/40">
                <span className="mono text-[10px] text-blue-400 font-bold uppercase tracking-widest">Target Analysis Satellite Link</span>
                <button onClick={closeSatModal} className="text-gray-400 hover:text-white mono text-[10px] border border-white/10 px-2 py-1 rounded bg-white/5">CLOSE [ESC]</button>
             </div>
             <img src={modalImage} className="w-full object-contain filter contrast-[1.2] brightness-[1.1]" alt="Satellite Analysis" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── MISSILE UTILITIES ──

const LAUNCH_SITES: [number, number][] = [
  [36.58, 50.59], // Belgorod
  [38.97, 45.03], // Krasnodar
  [33.52, 44.61], // Sevastopol
];

function animateMissileFlight(map: maplibregl.Map, end: [number, number], type: string) {
  const start = LAUNCH_SITES[Math.floor(Math.random() * LAUNCH_SITES.length)];
  const id = `missile-${Math.random()}`;
  const steps = 120;
  let counter = 0;

  map.addSource(id, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
  map.addLayer({ id, type: 'line', source: id, paint: { 'line-color': '#ff4d4d', 'line-width': 1.5, 'line-dasharray': [2, 2], 'line-opacity': 0.8 } });

  function step() {
     if (counter >= steps) { 
        setTimeout(() => { if (map.getLayer(id)) map.removeLayer(id); if (map.getSource(id)) map.removeSource(id); }, 2000);
        return; 
     }
     const t = counter / steps;
     const lng = start[0] * (1 - t) + end[0] * t;
     const lat = start[1] * (1 - t) + end[1] * t + Math.sin(Math.PI * t) * 0.5;
     const coords = [...(map.getSource(id) as any)._data.geometry.coordinates, [lng, lat]];
     (map.getSource(id) as any).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} });
     counter++;
     requestAnimationFrame(step);
  }
  step();
}
