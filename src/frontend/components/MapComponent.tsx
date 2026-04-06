"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToString } from "react-dom/server";
import { AlertTriangle, MapPin, ShieldAlert, Flame, Swords, Bomb, Zap, Factory, Plane, Anchor, Radiation, Rocket, Satellite, Landmark, Radio, Droplets, TrainFront, Building2 } from "lucide-react";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Use the backend proxy to get rich DeepState metadata
const FRONTLINE_GEOJSON_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/map/frontline.json`
  : "http://localhost:8000/api/map/frontline.json";

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

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [34.0, 48.0],
      zoom: 6,
      attributionControl: false,
    });
    setMap(map);

    map.on("load", () => {
      map.addSource("frontline", {
        type: "geojson",
        data: FRONTLINE_GEOJSON_URL,
      });

      // Frontline Territories (Advanced Multi-Vector Matching)
      map.addLayer({
        id: "frontline-fill",
        type: "fill",
        source: "frontline",
        paint: {
          "fill-color": [
            "case",
            // 0. The "Silver Bullet" Whitelist: Only color if it belongs to the Ukrainian front or specific UA regions
            ["!", ["any", 
              ["in", "geoJSON.status.", ["to-string", ["get", "name"]]],
              ["in", "geoJSON.territories.crimea", ["to-string", ["get", "name"]]],
              ["in", "geoJSON.territories.ordlo", ["to-string", ["get", "name"]]],
              ["in", "geoJSON.territories.kyiv", ["to-string", ["get", "name"]]],
              ["in", "geoJSON.zmiinyi_island", ["to-string", ["get", "name"]]]
            ]], "rgba(0,0,0,0)",

            // 1. Liberated (Green)
            ["any", 
              ["in", "Звільнена", ["to-string", ["get", "name"]]],
              ["in", "Liberated", ["to-string", ["get", "name"]]],
              ["in", "status.dismissed", ["to-string", ["get", "name"]]],
              ["==", ["to-string", ["get", "type"]], "3"]
            ], "#10b981",
            
            // 2. Occupied 2014 (Deep Purple)
            ["any", 
              ["in", "Крим", ["to-string", ["get", "name"]]],
              ["in", "Crimea", ["to-string", ["get", "name"]]],
              ["in", "АРК", ["to-string", ["get", "name"]]],
              ["in", "ОРДЛО", ["to-string", ["get", "name"]]],
              ["in", "ORDLO", ["to-string", ["get", "name"]]],
              ["in", "territories.crimea", ["to-string", ["get", "name"]]],
              ["in", "territories.ordlo", ["to-string", ["get", "name"]]],
              ["==", ["to-string", ["get", "type"]], "2"]
            ], "#7c3aed",

            // 3. Occupied 2022 (Pure Red)
            ["any", 
              ["in", "Окупована", ["to-string", ["get", "name"]]],
              ["in", "Occupied", ["to-string", ["get", "name"]]],
              ["in", "status.occupied", ["to-string", ["get", "name"]]],
              ["==", ["to-string", ["get", "type"]], "1"]
            ], "#ef4444",

            // 4. Grey Zone (Grey)
            ["any", 
              ["in", "Сіרה", ["to-string", ["get", "name"]]],
              ["in", "Grey", ["to-string", ["get", "name"]]],
              ["in", "status.unknown", ["to-string", ["get", "name"]]],
              ["==", ["to-string", ["get", "type"]], "4"]
            ], "#94a3b8",

            "rgba(0,0,0,0)" // Default to transparent
          ],
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "frontline-line",
        type: "line",
        source: "frontline",
        paint: {
          "line-color": "#475569",
          "line-width": 0.5,
          "line-opacity": 0.3
        },
      });

      // Add click listener to inspect properties (Debugging & Interaction)
      map.on("click", "frontline-fill", (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties;
        const rawName = (props.name || "").toLowerCase();
        const type = String(props.type || "");
        
        let displayName = "";
        
        // Match category for simplified display
        if (rawName.includes("dismissed") || rawName.includes("liberated") || type === "3") {
          displayName = lang === 'ua' ? 'Звільнена територія' : lang === 'ru' ? 'Освобождено' : 'Liberated';
        } else if (rawName.includes("ordlo") || rawName.includes("crimea") || rawName.includes("крим") || rawName.includes("cadr") || rawName.includes("calr") || type === "2") {
          displayName = lang === 'ua' ? 'Крим / ОРДЛО (2014)' : lang === 'ru' ? 'Крым / ОРДЛО (2014)' : 'Occupied (2014)';
        } else if (rawName.includes("occupied") || rawName.includes("окуповано") || type === "1") {
          displayName = lang === 'ua' ? 'Окупована територія (2022)' : lang === 'ru' ? 'Оккупировано (2022)' : 'Occupied (2022)';
        } else {
          displayName = lang === 'ua' ? 'Сіра зона' : lang === 'ru' ? 'Серая зона' : 'Contested / Grey Zone';
        }

        new maplibregl.Popup({ className: 'tactical-popup', closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="
            background: rgba(11, 13, 17, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(59, 130, 246, 0.5);
            border-radius: 6px;
            padding: 8px 12px;
            color: #f3f4f6;
            font-family: 'Inter', system-ui, sans-serif;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
            min-width: 180px;
          ">
            <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px; font-weight: 600;">
              ${lang === 'ua' ? 'Статус території' : lang === 'ru' ? 'Статус территории' : 'Territorial Status'}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #fff; line-height: 1.4; margin-bottom: 8px;">
              ${displayName}
            </div>
            <div style="height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 6px;"></div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <div style="width: 4px; height: 4px; border-radius: 50%; background: #3b82f6;"></div>
              <span style="color: #3b82f6; font-size: 9px; font-weight: 600; font-family: monospace;">SRC_DEEPSTATE_TACTICAL</span>
            </div>
          </div>`)
          .addTo(map);
      });
      
      map.on("mouseenter", "frontline-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "frontline-fill", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      if (map) map.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    
    // Clear all existing markers when language or events change to force fresh popups
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const CITY_COORDS: { [key: string]: [number, number] } = {
      "kyiv": [30.5234, 50.4501], "київ": [30.5234, 50.4501], "киев": [30.5234, 50.4501],
      "kharkiv": [36.2304, 49.9935], "харків": [36.2304, 49.9935], "харьков": [36.2304, 49.9935],
      "odessa": [30.7233, 46.4825], "odesa": [30.7233, 46.4825], "одеса": [30.7233, 46.4825], "одесса": [30.7233, 46.4825],
      "dnipro": [35.0462, 48.4647], "дніпро": [35.0462, 48.4647], "днепр": [35.0462, 48.4647],
      "donetsk": [37.8028, 48.0159], "донецьк": [37.8028, 48.0159], "донецк": [37.8028, 48.0159],
      "zaporizhzhia": [35.1396, 47.8388], "запоріжжя": [35.1396, 47.8388], "запорожье": [35.1396, 47.8388],
      "lviv": [24.0297, 49.8397], "львів": [24.0297, 49.8397], "львов": [24.0297, 49.8397],
      "kherson": [32.6169, 46.6354], "херсон": [32.6169, 46.6354],
      "mariupol": [37.5413, 47.0971], "маріуполь": [37.5413, 47.0971], "мариуполь": [37.5413, 47.0971],
      "luhansk": [39.3078, 48.5740], "луганськ": [39.3078, 48.5740], "луганск": [39.3078, 48.5740],
      "sevastopol": [33.5224, 44.6167], "севастополь": [33.5224, 44.6167],
      "crimea": [34.1003, 45.3453], "крим": [34.1003, 45.3453], "крым": [34.1003, 45.3453],
      "bakhmut": [38.0161, 48.5946], "бахмут": [38.0161, 48.5946],
      "avdiivka": [37.7441, 48.1366], "авдіївка": [37.7441, 48.1366], "авдеевка": [37.7441, 48.1366],
      "sumy": [34.7981, 50.9077], "суми": [34.7981, 50.9077], "сумы": [34.7981, 50.9077],
      "chernihiv": [31.2858, 51.4982], "чернігів": [31.2858, 51.4982], "чернигов": [31.2858, 51.4982],
    };

    events.forEach((ev) => {
      const isStrategicStrike = (ev as any).subtype === "strategic_neutralization";
      const isStrategic = ["energy_infrastructure", "air_base", "naval_base", "nuclear_site", "missile_infrastructure", "power_plant", "radar_station", "command_center", "factory"].includes(ev.type);
      
      if (ev.type === "economic" || ev.type === "news") return;

      if (activeLayers) {
        let category = "other";
        
        if (["air_alert", "strike", "bombing"].includes(ev.type)) category = "strikes";
        else if (ev.type === "combat") category = "units";
        else if (ev.type === "deployment") {
           const infraType = (ev as any).infra_type;
           const content = ev.content.toLowerCase();
           if (infraType === "logistics" || content.includes("rail")) category = "rail";
           else if (content.includes("logist") || content.includes("port") || content.includes("hub") || content.includes("base")) category = "logist";
           else category = "intell";
        }
        else if (isStrategic) {
          category = ev.type;
        }

        const isVisible = activeLayers.includes(category);
        
        if (!isVisible) {
          // REMOVE marker if it exists and shouldn't be visible
          if (markersRef.current[ev.id]) {
            markersRef.current[ev.id].remove();
            delete markersRef.current[ev.id];
          }
          return;
        }
      }

      let lon = ev.lon;
      let lat = ev.lat;
      let isPrecise = true;

      const pulseClass = isStrategicStrike ? 'strategic-strike-pulse' : '';

      if (!lat || !lon) {
        if (Array.isArray(ev.polygon) && ev.polygon.length === 2) {
           [lon, lat] = ev.polygon;
        } else if (Array.isArray((ev as any).location) && (ev as any).location.length === 2) {
           [lon, lat] = (ev as any).location;
        }
        if (!lat || !lon) {
          isPrecise = false;
          const contentLower = ev.content.toLowerCase();
          for (const [city, coords] of Object.entries(CITY_COORDS)) {
            if (contentLower.includes(city)) {
              [lon, lat] = coords;
              lon += (Math.random() - 0.5) * 0.05;
              lat += (Math.random() - 0.5) * 0.05;
              break;
            }
          }
        }
      }

      if (!lat || !lon) return;

      if (!markersRef.current[ev.id]) {
        const el = document.createElement("div");
        el.className = "marker-tactical";
        
        let color = "#3b82f6";
        let icon = <MapPin size={12} color={color} />;
        
        if (ev.type === "combat") {
          color = "#ef4444";
          icon = <Swords size={12} color={color} />;
        } else if (ev.type === "strike" || ev.type === "bombing") {
          color = "#ff9f1c";
          icon = <Bomb size={12} color={color} />;
        } else if (ev.type === "air_alert") {
          color = "#ff3b3b";
          icon = <AlertTriangle size={12} color={color} />;
        } else if (ev.type === "deployment") {
          color = "#8b5cf6";
          const infraType = (ev as any).infra_type;
          const content = ev.content.toLowerCase();
          if (infraType === "logistics" || content.includes("rail")) {
            icon = <TrainFront size={12} color={color} />;
          } else {
            icon = <ShieldAlert size={12} color={color} />;
          }
        } else if (ev.type === "energy_infrastructure") {
          color = "#fbbf24";
          const infraType = (ev as any).infra_type;
          if (infraType === "refinery") {
            icon = <Factory size={12} color={color} />;
          } else if (infraType === "terminal") {
            icon = <Droplets size={12} color={color} />;
          } else {
            icon = <Flame size={12} color={color} />;
          }
        } else if (ev.type === "air_base") {
          color = "#38bdf8";
          icon = <Plane size={12} color={color} />;
        } else if (ev.type === "naval_base") {
          color = "#3b82f6";
          icon = <Anchor size={12} color={color} />;
        } else if (ev.type === "nuclear_site") {
          color = "#fbbf24";
          icon = <Radiation size={12} color={color} />;
        } else if (ev.type === "missile_infrastructure") {
          color = "#fb7185";
          icon = <Rocket size={12} color={color} />;
        } else if (ev.type === "power_plant") {
          color = "#facc15";
          icon = <Zap size={12} color={color} />;
        } else if (ev.type === "radar_station") {
          color = "#6366f1";
          icon = <Radio size={12} color={color} />;
        } else if (ev.type === "factory") {
          color = "#94a3b8";
          icon = <Building2 size={12} color={color} />;
        } else if (ev.type === "command_center") {
          color = "#991b1b";
          icon = <Landmark size={12} color={color} />;
        }

        el.innerHTML = `
          <div class="${pulseClass}" style="position:relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); border: 1px solid ${color}; border-radius: 4px; box-shadow: 0 0 10px ${color}44;">
             <div style="position:absolute; width:100%; height:100%; border: 1px solid ${color}; opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; border-radius: 4px;"></div>
             ${renderToString(icon)}
          </div>
        `;

        const isStrategic = ["energy_infrastructure", "air_base", "naval_base", "nuclear_site", "missile_infrastructure", "power_plant", "radar_station", "command_center", "factory"].includes(ev.type);
        const showSatellite = (isStrategic || ev.type === "strike" || ev.type === "bombing") && isPrecise && lat && lon;
        
        const satelliteHtml = showSatellite ? `
          <div 
            onclick="window.openSatView && window.openSatView(this.querySelector('img').src)"
            style="margin-top: 10px; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 4px; overflow: hidden; height: 120px; position: relative; background: #000; cursor: zoom-in;"
          >
            <div style="position: absolute; top: 0; left: 0; padding: 3px 6px; background: rgba(0,0,0,0.8); color: #38bdf8; font-size: 8px; font-family: monospace; z-index: 10; border-bottom-right-radius: 4px;">
              SATCOM LINK ACTIVE // [${lat.toFixed(4)}, ${lon.toFixed(4)}]
            </div>
            <div style="position: absolute; bottom: 0; right: 0; padding: 3px 6px; background: rgba(0,0,0,0.8); color: #38bdf8; font-size: 7px; font-family: monospace; z-index: 10; border-top-left-radius: 4px; opacity: 0.7;">
              CLICK TO ENLARGE
            </div>
            <img 
              src="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lon - 0.01},${lat - 0.005},${lon + 0.01},${lat + 0.005}&bboxSR=4326&imageSR=4326&size=400,200&format=jpg&f=image" 
              style="width: 100%; height: 100%; object-fit: cover; filter: sepia(0.2) hue-rotate(180deg) saturate(1.5) brightness(0.8);"
              alt="Satellite View"
              onload="this.style.filter='brightness(0.9) contrast(1.2)'"
            />
          </div>
        ` : '';

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lon, lat])
          .setPopup(
            new maplibregl.Popup({ className: 'tactical-popup', offset: 15, closeButton: false }).setHTML(`
              <div style="
                background: rgba(11, 13, 17, 0.95);
                backdrop-filter: blur(8px);
                border: 1px solid ${isStrategicStrike ? '#ef4444' : '#1f2937'};
                border-radius: 6px;
                padding: 10px;
                color: #f3f4f6;
                font-family: 'Inter', sans-serif;
                max-width: 280px;
                min-width: 200px;
              ">
                <div style="font-family: 'Roboto Mono', monospace; font-size: 10px; color: ${isStrategicStrike ? '#ef4444' : '#94a3b8'}; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; text-transform: uppercase;">
                  ${ev.source.substring(0,20)} <span style="color:#ef4444">|</span> ${isStrategicStrike ? 'STRATEGIC HIT' : ev.type.replace('_', ' ')}
                </div>
                <div style="font-size: 12px; font-weight: ${isStrategicStrike ? 'bold' : 'normal'}; color: #f3f4f6; line-height: 1.5; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                  ${(ev as any)[`translation_${lang}`] || ev.content}
                </div>
                ${satelliteHtml}
              </div>
            `)
          )
          .addTo(map);

        markersRef.current[ev.id] = marker;
      } else {
        // Update existing marker pulse class in real-time
        const m = markersRef.current[ev.id];
        const innerDiv = m.getElement().querySelector('div');
        if (innerDiv) {
          if (pulseClass) innerDiv.classList.add('strategic-strike-pulse');
          else innerDiv.classList.remove('strategic-strike-pulse');
        }
      }
    });

    const currentIds = new Set(events.map(e => e.id));
    
    if (map) {
      events.forEach(ev => {
        if (ev.type === "frontline_update" && map.getSource("frontline")) {
           (map.getSource("frontline") as maplibregl.GeoJSONSource).setData(FRONTLINE_GEOJSON_URL);
        }

        if ((ev.type === "air_alert" || ev.type === "strike") && !markersRef.current[ev.id]) {
           const isRecent = ev.timestamp ? (Date.now() - new Date(ev.timestamp).getTime()) < 30000 : true;
           if (isRecent) {
             let targetLon = ev.lon;
             let targetLat = ev.lat;

             if (!targetLat || !targetLon) {
               const contentLower = ev.content.toLowerCase();
               for (const [city, coords] of Object.entries(CITY_COORDS)) {
                 if (contentLower.includes(city)) {
                   [targetLon, targetLat] = coords as [number, number];
                   break;
                 }
               }
             }

             if (targetLat && targetLon) {
               animateMissileFlight(map, [targetLon, targetLat], ev.type);
             }
           }
        }
      });
    }

    Object.keys(markersRef.current).forEach(id => {
       if(!currentIds.has(id)) {
           markersRef.current[id].remove();
           delete markersRef.current[id];
       }
    });
  }, [map, events, lang, activeLayers]);

  return (
    <div ref={mapContainer} className="relative w-full h-full">
      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 z-10 bg-[#0b0d11]/80 backdrop-blur-md border border-[#1f2937] p-3 rounded-lg shadow-xl pointer-events-none">
        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
          {lang === 'ua' ? 'Територіальний статус' : lang === 'ru' ? 'Территориальный статус' : 'Territorial Status'}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#10b981] border border-[#059669]"></div>
            <span className="text-[10px] text-gray-200">
              {lang === 'ua' ? 'Звільнена територія' : lang === 'ru' ? 'Освобожденная территория' : 'Liberated Territory'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#ef4444] border border-[#dc2626]"></div>
            <span className="text-[10px] text-gray-200">
              {lang === 'ua' ? 'Окупована (2022)' : lang === 'ru' ? 'Оккупирована (2022)' : 'Occupied (2022)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#7c3aed] border border-[#6d28d9]"></div>
            <span className="text-[10px] text-gray-200">
              {lang === 'ua' ? 'Крим / ОРДЛО (2014)' : lang === 'ru' ? 'Крым / ОРДЛО (2014)' : 'Occupied (2014)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#94a3b8] border border-[#64748b]"></div>
            <span className="text-[10px] text-gray-200">
              {lang === 'ua' ? 'Сіра зона' : lang === 'ru' ? 'Серая зона' : 'Contested / Grey Zone'}
            </span>
          </div>
        </div>
      </div>

      {/* Satellite Fullscreen Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={closeSatModal}
        >
          <div className="relative max-w-6xl w-full h-full glass-panel overflow-hidden flex flex-col border border-blue-500/30" onClick={e => e.stopPropagation()}>
             <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/40">
                <span className="mono text-xs text-blue-400 font-bold tracking-widest uppercase flex items-center gap-2">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]" />
                   High-Resolution Strategic Asset Analysis // SAT_LINK_9
                </span>
                <button onClick={closeSatModal} className="text-gray-500 hover:text-white mono text-[10px] border border-white/10 px-2 py-1 rounded bg-white/5 uppercase">Close [ESC]</button>
             </div>
             <div className="flex-1 overflow-hidden bg-[#050505] flex items-center justify-center relative">
                <img 
                  src={modalImage} 
                  className="max-w-full max-h-full object-contain filter contrast-[1.1] brightness-[1.1]"
                  alt="High Resolution Satellite view"
                />
                
                {/* Tactical HUD Overlays for the modal */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-blue-500/40 opacity-50" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-blue-500/40 opacity-50" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-blue-500/40 opacity-50" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-blue-500/40 opacity-50" />
                
                <div className="absolute bottom-8 left-8 p-3 bg-black/80 border border-blue-500/20 rounded mono text-[9px] text-blue-300 flex flex-col gap-1 backdrop-blur-md">
                   <div className="flex justify-between gap-8"><span>SOURCE:</span> <span className="text-white">ARCGIS_HIGH_RES</span></div>
                   <div className="flex justify-between gap-8"><span>ZOOM_LEVEL:</span> <span className="text-white">18.2-Z</span></div>
                   <div className="flex justify-between gap-8"><span>PROC_MODE:</span> <span className="text-white">TACTICAL_DARK</span></div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── UTILITIES ────────────────────────────────────────────────────────────────

const LAUNCH_SITES: [number, number][] = [
  [36.58, 50.59], // Belgorod
  [36.19, 51.73], // Kursk
  [39.20, 51.67], // Voronezh
  [38.97, 45.03], // Krasnodar
  [33.52, 44.61], // Sevastopol (Launch proxy)
];

function animateMissileFlight(map: maplibregl.Map, end: [number, number], type: string) {
  const start = LAUNCH_SITES[Math.floor(Math.random() * LAUNCH_SITES.length)];
  const routeId = `route-${Math.random()}`;
  const pointId = `point-${Math.random()}`;
  
  // Calculate arc
  const steps = 100;
  const arc: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lng = start[0] * (1 - t) + end[0] * t;
    const lat = start[1] * (1 - t) + end[1] * t;
    // Add a slight arc height
    const offset = Math.sin(Math.PI * t) * (Math.abs(start[0] - end[0]) * 0.2);
    arc.push([lng, lat + offset]);
  }

  // Add source and layer for the path
  map.addSource(routeId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [] }
    }
  });

  map.addLayer({
    id: routeId,
    type: 'line',
    source: routeId,
    paint: {
      'line-color': type === 'strike' ? '#f59e0b' : '#ef4444',
      'line-width': 1,
      'line-dasharray': [2, 2],
      'line-opacity': 0.6
    }
  });

  // Add the moving point
  map.addSource(pointId, {
    type: 'geojson',
    data: {
      type: 'Point',
      coordinates: start
    }
  });

  map.addLayer({
    id: pointId,
    type: 'circle',
    source: pointId,
    paint: {
      'circle-radius': 4,
      'circle-color': type === 'strike' ? '#f59e0b' : '#ef4444',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  });

  let counter = 0;
  function animate() {
    if (counter >= steps) {
      // Clean up after 2 seconds at the destination
      setTimeout(() => {
        if (map.getLayer(routeId)) map.removeLayer(routeId);
        if (map.getSource(routeId)) map.removeSource(routeId);
        if (map.getLayer(pointId)) map.removeLayer(pointId);
        if (map.getSource(pointId)) map.removeSource(pointId);
      }, 2000);
      return;
    }

    const currentLine = arc.slice(0, counter);
    (map.getSource(routeId) as any).setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: currentLine }
    });

    (map.getSource(pointId) as any).setData({
      type: 'Point',
      coordinates: arc[counter]
    });

    counter++;
    requestAnimationFrame(animate);
  }

  animate();
}
