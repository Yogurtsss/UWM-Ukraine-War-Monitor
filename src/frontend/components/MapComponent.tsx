"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToString } from "react-dom/server";
import { Zap, ShieldAlert, Crosshair, Plane, Anchor, Radiation, Building2, Droplets, Rocket, Radio, Landmark, Flame } from "lucide-react";

const TYPE_TRANSLATIONS: Record<string, any> = {
  strike_or_fire: { en: "Thermal Anomaly / Fire", ru: "Тепловая аномалия / Пожар", ua: "Теплова аномалія / Пожежа" },
  air_alert: { en: "Air Alert", ru: "Воздушная тревога", ua: "Повітряна тривога" },
  strike: { en: "Tactical Strike", ru: "Тактический удар", ua: "Тактичний удар" },
  combat: { en: "Active Combat", ru: "Боевые действия", ua: "Бойові дії" },
  deployment: { en: "Military Deployment", ru: "Развертывание сил", ua: "Розгортання сил" }
};

const FRONTLINE_GEOJSON_URL = "/api/map/frontline.json";

export interface UWMEvent {
  id: string;
  type: "air_alert" | "strike" | "combat" | "deployment" | "news" | "social_post" | "bombing" | "frontline_update" | string;
  lat: number;
  lon: number;
  content: string;
  timestamp: string;
  source: string;
  is_strategic?: boolean;
}

interface MapProps {
  activeLayers: string[];
  events: UWMEvent[];
  lang?: 'en' | 'ru' | 'ua';
}

const CITY_COORDS: Record<string, [number, number]> = {
  kyiv: [30.5234, 50.4501], kharkiv: [36.2304, 49.9935], odesa: [30.7233, 46.4825],
  dnipro: [35.0462, 48.4647], lviv: [24.0297, 49.8397], zaporizhzhia: [35.1396, 47.8388],
  mykolaiv: [31.9946, 46.9750], kherson: [32.6169, 46.6354], mariupol: [37.5494, 47.0951],
  sumy: [34.7981, 50.9077], chernihiv: [31.2858, 51.4982], poltava: [34.5514, 49.5883]
};

const LAUNCH_SITES: [number, number][] = [
  [39.0, 45.0], [42.0, 48.0], [38.0, 52.0], [33.0, 55.0], [30.0, 44.0], [34.0, 45.0]
];

export default function MapComponent({ activeLayers, events, lang = 'en' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [31.1656, 48.3794],
      zoom: 5.5,
      pitch: 45,
      antialias: true
    });

    mapRef.current = map;

    map.on("load", () => {
      // FRONT LINE LAYER
      map.addSource("frontline", {
        type: "geojson",
        data: FRONTLINE_GEOJSON_URL
      });

      map.addLayer({
        id: "frontline-fill",
        type: "fill",
        source: "frontline",
        paint: {
          "fill-color": [
            "case",
            // 1. Occupied in 2014 (Crimea/ORDLO)
            ["any", 
              [">=", ["index-of", "geoJSON.territories.crimea", ["get", "name"]], 0],
              [">=", ["index-of", "geoJSON.territories.ordlo", ["get", "name"]], 0]
            ], "#880e4f", // Dark Red/Bordeaux (DeepState original for 2014)
            
            // 2. Occupied in 2022 (Main Front)
            [">=", ["index-of", "geoJSON.status.occupied", ["get", "name"]], 0], "#a52714", // Tactical Red
            
            // 3. Liberated by Ukraine (User wants Blue/Cyan)
            ["any", 
              [">=", ["index-of", "geoJSON.status.dismissed", ["get", "name"]], 0],
              [">=", ["index-of", "geoJSON.status.dismissed_at", ["get", "name"]], 0]
            ], "#3b82f6", // Tactical Blue/Cyan
            
            // Fallback to official DeepState color if properties exist, else gray
            ["has", "fill"], ["get", "fill"],
            "#4b5563" // Default Contested/Unknown
          ],
          "fill-opacity": 0.45
        }
      });

      // 106-118: Click handler with lang support
      map.on("click", "frontline-fill", (e) => {
        if (!e.features?.length) return;
        const feat = e.features[0];
        const props = feat.properties || {};
        const nameStr = props.name || "";
        const cl = langRef.current;
        
        // Parse DeepState name (Format: UA /// EN /// geoJSON.id)
        const nameParts = nameStr.split(" /// ");
        let displayName = nameStr;
        if (nameParts.length >= 2) {
          if (cl === 'ua') displayName = nameParts[0];
          else if (cl === 'en') displayName = nameParts[1];
          else if (cl === 'ru') displayName = nameParts[0]; // Fallback to UA for RU if not provided
        } else if (nameStr.includes("///")) {
           // Handle cases with different spacing
           const altParts = nameStr.split("///").map((p: string) => p.trim());
           if (altParts.length >= 2) {
             if (cl === 'ua') displayName = altParts[0];
             else if (cl === 'en') displayName = altParts[1];
             else if (cl === 'ru') displayName = altParts[0];
           }
        }

        const typeDesc = nameStr.includes("geoJSON.territories.crimea") || nameStr.includes("geoJSON.territories.ordlo") 
                         ? (lang === 'ua' ? "Окуповано (2014)" : lang === 'ru' ? "Оккупировано (2014)" : "Occupied (2014)") : 
                         nameStr.includes("geoJSON.status.occupied") 
                         ? (lang === 'ua' ? "Окуповано (2022)" : lang === 'ru' ? "Оккупировано (2022)" : "Occupied (2022)") :
                         nameStr.includes("geoJSON.status.dismissed") || nameStr.includes("geoJSON.status.dismissed_at") 
                        ? (lang === 'ua' ? "Звільнена територія" : lang === 'ru' ? "Освобожденная территория" : "Liberated territory") :
                        (lang === 'ua' ? "Бойова зона" : lang === 'ru' ? "Боевая зона" : "Live Tactical Zone");

        new maplibregl.Popup({ className: 'tactical-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="
              background: rgba(11, 13, 17, 0.95);
              backdrop-filter: blur(8px);
              border: 1px solid #3b82f6;
              border-radius: 6px;
              padding: 10px;
              color: #f3f4f6;
              font-family: 'Inter', system-ui, sans-serif;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
              min-width: 180px;
            ">
              <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px; font-weight: 600;">
                ${lang === 'ua' ? 'Статус території' : lang === 'ru' ? 'Статус территории' : 'Territorial Status'}
              </div>
              <div style="font-size: 14px; font-weight: 700; color: #fff; line-height: 1.4; margin-bottom: 4px;">
                ${displayName}
              </div>
              <div style="font-size: 10px; color: #3b82f6; font-weight: 500; margin-bottom: 8px;">
                ${typeDesc}
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
    const map = mapRef.current;
    if (!map) return;

    // Load from local storage initially to prevent flicker/empty state on Vercel
    const stored = typeof window !== 'undefined' ? localStorage.getItem('uwm_event_cache') : null;
    let initialEvents = events;
    if (stored && events.length === 0) {
      try { initialEvents = JSON.parse(stored); } catch(e) {}
    }

    // Remove stale markers
    const currentIds = new Set(initialEvents.map((e) => e.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add/Update markers
    initialEvents.forEach((ev) => {
      const lat = Number(ev.lat);
      const lon = Number(ev.lon);
      if (isNaN(lat) || isNaN(lon)) return;

      // Handle flight animations for air alerts
      if (ev.type === "air_alert" && !markersRef.current[ev.id]) {
        animateMissileFlight(map, [lon, lat], "air_alert");
      }

      const isStrategicStrike = ev.is_strategic || ["energy_infrastructure", "air_base", "naval_base", "nuclear_site", "missile_infrastructure", "power_plant", "radar_station", "command_center", "factory"].includes(ev.type);
      const pulseClass = isStrategicStrike ? 'strategic-strike-pulse' : (ev.type === "strike" || ev.type === "bombing" || ev.type === "strike_or_fire" ? "strike-pulse" : "");
      
      const isVisible = ev.type === "strike_or_fire"
        ? activeLayers.includes("strike_or_fire")
        : (activeLayers.includes(ev.type) || (ev.is_strategic && activeLayers.includes("strikes")) || (["strike", "bombing"].includes(ev.type) && activeLayers.includes("strikes")));
      
      if (!markersRef.current[ev.id]) {
        const el = document.createElement("div");
        el.className = "uwm-marker-container";
        
        let color = "#ef4444";
        let icon = <ShieldAlert size={12} color={color} />;
        const isPrecise = (lat !== 0 && lon !== 0);

        if (ev.type === "air_alert") {
          color = "#ff9f1c";
          icon = <ShieldAlert size={12} color={color} />;
        } else if (ev.type === "combat") {
          color = "#ffffff";
          icon = <Crosshair size={12} color={color} />;
        } else if (ev.type === "strike_or_fire") {
          color = "#f97316"; // Orange-Red for fire
          icon = <Flame size={20} color={color} />;
        } else if (ev.type === "air_base") {
          color = "#38bdf8";
          icon = <Plane size={12} color={color} />;
        } else if (ev.type === "naval_base") {
          color = "#3b82f6";
          icon = <Anchor size={12} color={color} />;
        } else if (ev.type === "nuclear_site") {
          color = "#fbbf24";
          icon = <Radiation size={12} color={color} />;
        } else if (ev.type === "energy_infrastructure") {
          color = "#f59e0b";
          icon = <Droplets size={12} color={color} />;
        } else if (ev.type === "missile_infrastructure") {
          color = "#f43f5e";
          icon = <Rocket size={12} color={color} />;
        } else if (ev.type === "power_plant") {
          color = "#eab308";
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
                  ${(ev as any)[`translation_${lang}`] || (TYPE_TRANSLATIONS[ev.type] ? TYPE_TRANSLATIONS[ev.type][lang] : null) || ev.content}
                </div>
                ${satelliteHtml}
              </div>
            `)
          )
          .addTo(map);

        markersRef.current[ev.id] = marker;
      } else {
        // Update existing marker pulse class and visibility in real-time
        const m = markersRef.current[ev.id];
        const innerDiv = m.getElement().querySelector('div');
        if (innerDiv) {
          if (pulseClass) innerDiv.classList.add('strategic-strike-pulse');
          else innerDiv.classList.remove('strategic-strike-pulse');
        }
      }

      // Final visibility filter
      if (markersRef.current[ev.id]) {
        markersRef.current[ev.id].getElement().style.display = isVisible ? "block" : "none";
      }
    });

    if (map) {
      if (map.getLayer("frontline-fill")) {
        map.setLayoutProperty("frontline-fill", "visibility", activeLayers.includes("frontline") ? "visible" : "none");
      }
    }
  }, [events, lang, activeLayers]);

  // 3. Data Sync Logic (Global Events)
  useEffect(() => {
    if (events && events.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('uwm_event_cache', JSON.stringify(events));
      }
    }
  }, [events]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 z-10 bg-[#0b0d11]/80 backdrop-blur-md border border-[#1f2937] p-3 rounded-lg shadow-xl pointer-events-none">
        <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
          {lang === 'ua' ? 'Територіальний статус' : lang === 'ru' ? 'Территориальный статус' : 'Territorial Status'}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#3b82f6] opacity-80 rounded-sm"></div>
            <span className="text-[10px] text-gray-200">
              {lang === 'ua' ? 'Звільнена територія' : lang === 'ru' ? 'Освобожденная территория' : 'Liberated Territory'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#a52714] opacity-80 rounded-sm"></div>
            <span className="text-[10px] text-gray-200">
              {lang === 'ua' ? 'Окупована (2022)' : lang === 'ru' ? 'Оккупирована (2022)' : 'Occupied (2022)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#880e4f] opacity-80 rounded-sm"></div>
            <span className="text-[10px] text-gray-200">
              {lang === 'ua' ? 'Крим / ОРДЛО (2014)' : lang === 'ru' ? 'Крым / ОРДЛО (2014)' : 'Occupied (2014)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#4b5563] opacity-80 rounded-sm"></div>
            <span className="text-[10px] text-gray-200">
              {lang === 'ua' ? 'Сіра зона' : lang === 'ru' ? 'Серая зона' : 'Contested / Grey Zone'}
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .tactical-popup .maplibregl-popup-content {
          background: none;
          padding: 0;
          box-shadow: none;
          border: none;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .strike-pulse {
          animation: pulse-red 2s infinite;
        }
        .strategic-strike-pulse {
          animation: pulse-strategic 1.5s infinite ease-in-out;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes pulse-strategic {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); border-color: #ef4444; }
          50% { transform: scale(1.1); box-shadow: 0 0 20px 10px rgba(239, 68, 68, 0); border-color: #ffffff; }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: #ef4444; }
        }
      `}</style>
    </div>
  );
}

function animateMissileFlight(map: maplibregl.Map, end: [number, number], type: string) {
  const start = LAUNCH_SITES[Math.floor(Math.random() * LAUNCH_SITES.length)];
  const routeId = `route-${Math.random()}`;
  const pointId = `point-${Math.random()}`;
  
  // Calculate arc
  const steps = 300; // Smoother and slower for 15 min logic
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const currLon = start[0] + (end[0] - start[0]) * t;
    const currLat = start[1] + (end[1] - start[1]) * t;
    coordinates.push([currLon, currLat]);
  }

  const routeGeojson: any = {
    type: "Feature",
    geometry: { type: "LineString", coordinates: [] }
  };

  const pointGeojson: any = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: { type: "Point", coordinates: start }
    }]
  };

  map.addSource(routeId, { type: "geojson", data: routeGeojson });
  map.addLayer({
    id: routeId,
    type: "line",
    source: routeId,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ef4444", "line-width": 2, "line-opacity": 0.4, "line-dasharray": [2, 2] }
  });

  map.addSource(pointId, { type: "geojson", data: pointGeojson });
  map.addLayer({
    id: pointId,
    type: "symbol",
    source: pointId,
    layout: {
      "icon-image": "rocket", // Assuming a rocket icon exists or using fallback circle below
      "icon-size": 1.5,
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
      "text-field": "🚀",
      "text-size": 16
    },
    paint: { "text-color": "#ff0000" }
  });

  let step = 0;
  function animate() {
    if (step >= coordinates.length) {
      setTimeout(() => {
        if (map.getLayer(routeId)) map.removeLayer(routeId);
        if (map.getSource(routeId)) map.removeSource(routeId);
        if (map.getLayer(pointId)) map.removeLayer(pointId);
        if (map.getSource(pointId)) map.removeSource(pointId);
      }, 5000);
      return;
    }

    routeGeojson.geometry.coordinates.push(coordinates[step]);
    pointGeojson.features[0].geometry.coordinates = coordinates[step];
    
    if (map.getSource(routeId)) (map.getSource(routeId) as any).setData(routeGeojson);
    if (map.getSource(pointId)) (map.getSource(pointId) as any).setData(pointGeojson);
    
    step++;
    requestAnimationFrame(animate);
  }
  animate();
}
