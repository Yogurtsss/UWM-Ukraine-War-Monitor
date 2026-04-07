"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { ShieldAlert, Crosshair, AlertTriangle, Info, Clock, Activity, Settings2, Zap, Plane, Anchor, Radiation, Building2, Droplets, Rocket, Radio, Landmark, TrainFront, Flame } from "lucide-react";
import { GaugeWidget } from "@/components/GaugeWidget";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';
import type { UWMEvent } from "@/components/MapComponent";
import { formatDistanceToNow } from "date-fns";

const safeTimeAgo = (ts: string | undefined | null): string => {
  if (!ts) return "Recent";
  if (/^(Active|Now|Current|Recent)$/i.test(ts)) return ts;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return ts;
  }
};

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

const WS_URL = "/ws";
const MAX_EVENTS = 1000;

export default function Home() {
  const [events, setEvents] = useState<UWMEvent[]>([]);
  const [wsStatus, setWsStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [threatScore, setThreatScore] = useState(0);
  const [missileStats, setMissileStats] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [currTime, setCurrTime] = useState(new Date());
  const [lang, setLang] = useState<'en' | 'ru' | 'ua'>('en');
  const [activeLayers, setActiveLayers] = useState<string[]>([
    "frontline", "strikes", "strike_or_fire",
    "air_base", "naval_base", "power_plant", "nuclear_site", "factory", 
    "energy_infrastructure", "missile_infrastructure", "radar_station", "command_center", "rail"
  ]);
  const [showUtc, setShowUtc] = useState(false);
  const [isSatModalOpen, setIsSatModalOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => 
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    );
  };

  useEffect(() => {
    const handleSatModal = (e: any) => {
      setIsSatModalOpen(e.detail.isOpen);
    };
    window.addEventListener('uwm:sat-modal' as any, handleSatModal);
    return () => window.removeEventListener('uwm:sat-modal' as any, handleSatModal);
  }, []);

  const UI_STRINGS = {
    en: {
      threat: "THREAT LEVEL", threat_stable: "STABLE", threat_elevated: "ELEVATED", threat_critical: "CRITICAL",
      news: "NEWS FEED", social: "SOCIAL MONITOR", missile: "MISSILE / ATTACK COUNTS",
      utc: "UTC", ukr: "UKR", suggest: "Suggest Source", legend: "LEGEND",
      alerts_count: "ALERTS", strikes_count: "STRIKES", total_since: "TOTAL SINCE",
      active_alert: "Active Alert", strike_warning: "Strike Warning", frontline_shift: "Frontline Shift", threats_icon: "Missile/Drone",
      live_alert: "Live Alert Stream", active: "ACTIVE", total_strikes: "TOTAL STRIKES", ai_digest: "AI DIGEST", unverified: "UNVERIFIED",
      waiting_signals: "Waiting for signals...", bandwidth: "Bandwidth", latency: "Latency", deploy_assets: "DEPLOY ASSETS", system_offline: "SYSTEM_OFFLINE", live_system: "LIVE_SYSTEM_ACTIVE"
    },
    ru: {
      threat: "УРОВЕНЬ УГРОЗЫ", threat_stable: "СТАБИЛЬНО", threat_elevated: "ПОВЫШЕН", threat_critical: "КРИТИЧЕСКИЙ",
      news: "НОВОСТИ", social: "СОЦМОНИТОРИНГ", missile: "СТАТИСТИКА АТАК",
      utc: "UTC", ukr: "УКР", suggest: "Предложить источник", legend: "ЛЕГЕНДА",
      alerts_count: "ТРЕВОГ", strikes_count: "УДАРОВ", total_since: "ВСЕГО С",
      active_alert: "Воздушная тревога", strike_warning: "Угроза удара", frontline_shift: "Изменение фронта", threats_icon: "Ракеты/Дроны",
      live_alert: "Поток алертов", active: "АКТИВНО", total_strikes: "УДАРОВ ВСЕГО", ai_digest: "AI ДАЙДЖЕСТ", unverified: "НЕ ПОДТВЕРЖДЕНО",
      waiting_signals: "Ожидание сигналов...", bandwidth: "Поток", latency: "Задержка", deploy_assets: "АКТИВАЦИЯ", system_offline: "СИСТЕМА_ВЫКЛ", live_system: "СИСТЕМА_АКТИВНА"
    },
    ua: {
      threat: "РІВЕНЬ ЗАГРОЗИ", threat_stable: "СТАБІЛЬНО", threat_elevated: "ПІДВИЩЕНО", threat_critical: "КРИТИЧНО",
      news: "НОВИНИ", social: "СОЦМОНІТОРИНГ", missile: "СТАТИСТИКА АТАК",
      utc: "UTC", ukr: "UKR", suggest: "Запропонувати джерело", legend: "ЛЕГЕНДА",
      alerts_count: "ТРИВОГ", strikes_count: "УДАРІВ", total_since: "ВСЬОГО З",
      active_alert: "Повітряна тривога", strike_warning: "Загроза удару", frontline_shift: "Зміна фронту", threats_icon: "Ракети/Дрони",
      live_alert: "Потік тривог", active: "АКТИВНО", total_strikes: "УДАРІВ ВСЬОГО", ai_digest: "AI ДАЙДЖЕСТ", unverified: "НЕ ПІДТВЕРДЖЕНО",
      waiting_signals: "Очікування сигналів...", bandwidth: "Потік", latency: "Затримка", deploy_assets: "АКТИВАЦІЯ", system_offline: "СИСТЕМА_ВІДКЛ", live_system: "СИСТЕМА_АКТИВНА"
    }
  };

  const t = UI_STRINGS[lang];

  const connectWs = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    const wsProto = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = typeof window !== "undefined" ? window.location.host : "127.0.0.1:3000";
    
    // Attempt local WebSocket (limited support on Vercel)
    let wsUrl = `${wsProto}://${wsHost}/ws`;
    
    console.log(`[WS] Connecting to ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socket.onopen = () => setWsStatus("live");
    socket.onclose = () => {
      // Don't set offline on close, let polling be the source of truth
      setTimeout(connectWs, 10000); // Wait longer before retry
    };
    socket.onerror = () => {
      // Background error, no need to alert if polling is up
    };
    socket.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        const incoming: UWMEvent[] = data.events ?? [];
        if (!incoming.length) return;
        
        if (data.source === "cache") {
          setEvents(incoming);
        } else {
          setEvents((prev) => {
            const merged = [...incoming, ...prev];
            const unique = [];
            const seen = new Set();
            for (const ev of merged) {
              if (!seen.has(ev.id)) {
                seen.add(ev.id);
                unique.push(ev);
              }
            }
            const deployments = unique.filter(e => e.type === "deployment");
            const others = unique.filter(e => e.type !== "deployment").slice(0, MAX_EVENTS - deployments.length);
            return [...deployments, ...others];
          });
        }
      } catch { }
    };
    ws.current = socket;
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    
    const now = Date.now();
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const scores = { strike: 1.5, bombing: 1.5, air_alert: 0.7, combat: 1.0, deployment: 0.1 };
    let weightedSum = 0;
    
    const getTs = (ts: string | undefined | null) => {
      if (!ts || /^(Active|Now|Current|Recent)$/i.test(ts)) return now;
      const d = new Date(ts).getTime();
      return isNaN(d) ? now : d;
    };

    events.forEach(e => {
       const ts = getTs(e.timestamp);
       if ((now - ts) < THREE_HOURS) {
         weightedSum += (scores as any)[e.type] || 0.05;
       }
    });

    const dynamicPart = Math.min(8, (weightedSum * 1.2));
    setThreatScore(parseFloat((1.0 + dynamicPart).toFixed(1)));
  }, [events]);

  const pollEvents = useCallback(async () => {
    try {
      const resp = await fetch('/api/events');
      if (resp.ok) {
        const data = await resp.json();
        const incoming: UWMEvent[] = Array.isArray(data) ? data : (data.events ?? []);
        setEvents(incoming);
        setWsStatus("live"); 
      }
    } catch (err) {
      console.error("Polling error:", err);
      // Actual server failure/network issue
      setWsStatus("offline");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrTime(new Date()), 1000);
    
    // Initial fetch
    pollEvents();
    
    // Long polling fallback for Vercel
    const pollingTimer = setInterval(() => {
      if (wsStatus !== "live" || ws.current?.readyState !== WebSocket.OPEN) {
        pollEvents();
      }
    }, 5000);

    connectWs();
    
    const statsUrl = `/api/v2/stats?t=${Date.now()}`;

    fetch(statsUrl, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setMissileStats(data))
      .catch((err) => console.error("Failed to fetch missile stats:", err));

    return () => {
      ws.current?.close();
      clearInterval(timer);
    };
  }, [connectWs]);

  if (!mounted) return <div className="bg-black w-screen h-screen" />;

  const sortEvents = (evs: UWMEvent[]) => {
    return [...evs].sort((a, b) => {
      const getVal = (ts: string | undefined | null) => {
        if (!ts || /^(Active|Now|Current|Recent)$/i.test(ts)) return Date.now();
        const d = new Date(ts).getTime();
        return isNaN(d) ? 0 : d;
      };
      return getVal(b.timestamp) - getVal(a.timestamp);
    });
  };

  const newsEvents = sortEvents(events.filter((e) => e.type === "news")).slice(0, 15);
  const socialEvents = sortEvents(events.filter((e) => e.type === "social_post")).slice(0, 30);
  const alertEvents = sortEvents(events.filter(e => ["air_alert", "strike", "combat", "deployment", "bombing"].includes(e.type))).slice(0, 25);

  return (
    <main className="h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* TOP NAV BAR */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 bg-[#0b0d11]/85 backdrop-blur-md border-b border-gray-800/50 h-[36px]">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold tracking-tighter text-white font-mono uppercase">UKRAINE WARMONITOR</span>
          <div className="flex items-center gap-2 ml-2">
            <span className={`w-2 h-2 rounded-full ${wsStatus === 'live' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`mono text-[9px] tracking-widest px-2 py-0.5 rounded border ${wsStatus === 'live' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
              {wsStatus === 'live' ? t.live_system : t.system_offline}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-[18px] transition-colors cursor-pointer ${activeLayers.length === 5 ? 'text-blue-500' : 'text-gray-500'}`} onClick={() => setActiveLayers(["intell", "logist", "strikes", "units", "frontline"])} title="Global View">language</span>
            <span className={`material-symbols-outlined text-[18px] transition-colors cursor-pointer ${showUtc ? 'text-blue-500' : 'text-gray-500'}`} onClick={() => setShowUtc(!showUtc)} title={t.utc}>schedule</span>
            <span className="material-symbols-outlined text-[18px] text-gray-500 hover:text-white transition-colors cursor-pointer" onClick={() => alert("SYSTEM CONFIGURATION ACCESS DENIED / ADMIN ONLY")}>settings</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-gray-800 pr-4">
              {(['en', 'ru', 'ua'] as const).map(l => (
                <button 
                  key={l} 
                  onClick={() => setLang(l)} 
                  className={`mono text-[10px] tracking-widest transition-colors ${lang === l ? 'text-blue-500 font-bold border-b border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="mono text-[11px] tracking-widest text-blue-500 font-bold hover:bg-white/5 transition-colors px-2">{t.deploy_assets}</button>
          </div>
        </div>
      </header>

      {/* SIDE NAV BAR */}
      <nav className="fixed left-0 top-[36px] h-[calc(100%-64px)] z-40 flex flex-col items-center bg-[#1c2029]/85 backdrop-blur-xl w-16 md:w-20 border-r border-white/5 shadow-[0_0_24px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col w-full flex-grow overflow-y-auto">
          <div 
            onClick={() => toggleLayer("strike_or_fire")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("strike_or_fire") ? 'bg-orange-500/10 text-orange-500 border-orange-500' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Flame size={18} />
            <span className="text-[8px] mono mt-1 font-bold">🔥 FIRES</span>
          </div>

          <div 
            onClick={() => toggleLayer("air_base")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("air_base") ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Plane size={18} />
            <span className="text-[8px] mono mt-1 font-bold">✈️ AIR</span>
          </div>

          <div 
            onClick={() => toggleLayer("naval_base")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("naval_base") ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Anchor size={18} />
            <span className="text-[8px] mono mt-1 font-bold">⚓ NAVY</span>
          </div>

          <div 
            onClick={() => toggleLayer("power_plant")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("power_plant") ? 'bg-[#facc15]/10 text-[#facc15] border-[#facc15]' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Zap size={18} />
            <span className="text-[8px] mono mt-1 font-bold">⚡ POWER</span>
          </div>

          <div 
            onClick={() => toggleLayer("nuclear_site")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("nuclear_site") ? 'bg-[#ff9f1c]/10 text-[#ff9f1c] border-[#ff9f1c]' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Radiation size={18} />
            <span className="text-[8px] mono mt-1 font-bold">☢️ NUKE</span>
          </div>

          <div 
            onClick={() => toggleLayer("factory")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("factory") ? 'bg-[#94a3b8]/10 text-[#94a3b8] border-[#94a3b8]' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Building2 size={18} />
            <span className="text-[8px] mono mt-1 font-bold">🏭 ARMS</span>
          </div>

          <div 
            onClick={() => toggleLayer("energy_infrastructure")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("energy_infrastructure") ? 'bg-amber-400/10 text-amber-500 border-amber-500' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Droplets size={18} />
            <span className="text-[8px] mono mt-1 font-bold">🛢️ OIL</span>
          </div>

          <div 
            onClick={() => toggleLayer("missile_infrastructure")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("missile_infrastructure") ? 'bg-rose-400/10 text-rose-500 border-rose-500' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Rocket size={18} />
            <span className="text-[8px] mono mt-1 font-bold">🚀 ICBM</span>
          </div>

          <div 
            onClick={() => toggleLayer("radar_station")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("radar_station") ? 'bg-indigo-400/10 text-indigo-500 border-indigo-500' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Radio size={18} />
            <span className="text-[8px] mono mt-1 font-bold">📡 RADAR</span>
          </div>

          <div 
            onClick={() => toggleLayer("command_center")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("command_center") ? 'bg-red-800/10 text-red-700 border-red-700' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <Landmark size={18} />
            <span className="text-[8px] mono mt-1 font-bold">🏙️ CMD</span>
          </div>

          <div 
            onClick={() => toggleLayer("rail")}
            className={`flex flex-col items-center justify-center w-full py-4 transition-all cursor-pointer border-l-2 ${activeLayers.includes("rail") ? 'bg-purple-500/10 text-purple-400 border-purple-500' : 'text-gray-500 border-transparent hover:bg-white/5'}`}
          >
            <TrainFront size={18} />
            <span className="text-[8px] mono mt-1 font-bold">🛤️ RAIL</span>
          </div>

          <div className="flex flex-col items-center justify-center text-gray-500 w-full py-4 hover:bg-white/10 transition-all cursor-pointer">
            <span className="material-symbols-outlined">terminal</span>
            <span className="text-[10px] mono mt-1">Cmd</span>
          </div>
        </div>

        <div className="mt-auto pb-4 flex flex-col gap-4 w-full items-center">
          <span className="material-symbols-outlined text-gray-500 hover:text-blue-400 cursor-pointer" onClick={() => window.open('/docs/documentation.md')}>help_center</span>
          <span className="material-symbols-outlined text-gray-500 hover:text-blue-400 cursor-pointer" onClick={() => alert("HISTORY LOGS CURRENTLY ENCRYPTED")}>history_edu</span>
        </div>
      </nav>

      {/* MAIN CANVAS (GIS MAP BACKGROUND) */}
      <div className="fixed inset-0 pt-[36px] pl-16 md:pl-20 pb-[32px] overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 transition-all duration-300 pointer-events-auto ${isSatModalOpen ? 'z-[100]' : 'z-0'}`}>
          <MapComponent activeLayers={activeLayers} events={events} lang={lang} />
        </div>
      </div>

      {/* SECTION A: LEFT SIDEBAR */}
      <aside className="fixed left-[84px] md:left-[100px] top-12 bottom-[230px] w-[340px] z-30 flex flex-col gap-3 px-2 pointer-events-none">
        {/* Intro/Status Card */}
        <div className="glass-panel p-4 rounded-lg pointer-events-auto">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="mono text-xs font-bold text-white tracking-widest uppercase">Operational Summary</h2>
              <p className="text-[10px] text-gray-400 mt-1">OSINT System Node: 782-Delta</p>
            </div>
          </div>
          <div className="h-px bg-white/5 my-2"></div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Ukraine War Monitor is a personal <span className="text-white font-bold">OSINT</span> project by <span className="text-blue-400 font-bold">Yogurt</span>. 
            Active monitoring of kinetic activity in Sector 01. Telemetry established from independent ground sources.
          </p>
        </div>
        
        {/* Threat Gauge */}
        <div className="glass-panel p-4 rounded-lg flex flex-col items-center pointer-events-auto">
          <span className="mono text-[9px] text-gray-500 uppercase self-start mb-4">{t.threat}</span>
          <div className="relative w-40 h-20 overflow-visible flex items-center justify-center -mt-8">
            <GaugeWidget score={threatScore} />
          </div>
          <div className="w-full mt-2 h-6 relative bg-white/5 rounded overflow-hidden">
            <svg className="w-full h-full opacity-50" viewBox="0 0 200 40">
              <polyline fill="none" points="0,40 20,35 40,38 60,10 80,15 100,5 120,25 140,20 160,35 180,30 200,40" stroke="#ff9f1c" strokeWidth="1"></polyline>
            </svg>
          </div>
        </div>
        
        {/* Alert Feed */}
        <div className="glass-panel flex-grow rounded-lg flex flex-col overflow-hidden pointer-events-auto">
          <div className="p-3 border-b border-white/5 flex justify-between items-center bg-surface-container-high/50">
            <span className="mono text-[10px] font-bold text-white uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
              {t.live_alert}
            </span>
            <span className="mono text-[9px] text-gray-500">{alertEvents.length} {t.active}</span>
          </div>
          <div className="flex-grow overflow-y-auto p-2 flex flex-col gap-2">
            {alertEvents.length === 0 ? (
               <div className="p-4 text-center text-xs text-on-surface-variant mono">Awaiting Live Threat Data...</div>
            ) : alertEvents.map((ev, i) => (
              <div key={i} className={`bg-surface-container-low hover:bg-surface-container-high transition-colors p-2 rounded border-l-2 ${ev.type === 'deployment' ? 'border-primary' : 'border-error'}`}>
                <div className="flex justify-between items-start">
                  <span className={`mono text-[9px] font-bold ${ev.type === 'deployment' ? 'text-primary' : 'text-error'}`}>{ev.type.replace('_', ' ').toUpperCase()}</span>
                  <span className="mono text-[8px] text-gray-500">{safeTimeAgo(ev.timestamp)}</span>
                </div>
                <p className="text-[10px] text-on-surface mt-1 line-clamp-3">{(ev as any)[`translation_${lang}`] || ev.content}</p>
                <div className="text-[8px] text-gray-500 mt-1 uppercase opacity-60">SRC_{ev.source.substring(0, 10).replace(/ /g,'_')}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* SECTION B: LOGISTICS & SOCIAL HUD (BOTTOM OVERLAY) */}
      <section className={`fixed bottom-[40px] z-40 flex gap-4 pointer-events-none transition-all duration-700 ease-in-out h-[180px]
        ${isSatModalOpen 
          ? 'left-[calc(100%-420px)] right-[10px] w-[400px]' 
          : 'left-[84px] md:left-[100px] right-[10px]'
        }`}
      >
        <div className={`shrink-0 glass-panel rounded-lg flex flex-col overflow-hidden pointer-events-auto transition-all duration-500 ${isSatModalOpen ? 'w-0 opacity-0 -mr-4' : 'w-[280px] opacity-100'}`}>
          <div className="p-2 border-b border-white/5 bg-surface-container-high/30 flex justify-between whitespace-nowrap">
            <span className="mono text-[10px] font-bold text-white uppercase">{t.news}</span>
            <span className="material-symbols-outlined text-[14px] text-gray-500">rss_feed</span>
          </div>
          <div className="p-2 overflow-y-auto space-y-3 flex-1 min-w-[280px]">
            {newsEvents.map((ev, i) => (
               <div key={i} className="flex flex-col gap-0.5 border-b border-white/5 pb-2">
                  <div className="flex justify-between">
                    <span className="mono text-[8px] text-primary">{ev.source.substring(0,25).toUpperCase()}</span>
                    <span className="mono text-[8px] text-gray-500">{safeTimeAgo(ev.timestamp)}</span>
                  </div>
                  <p className="text-[10px] leading-tight text-on-surface-variant line-clamp-3">{(ev as any)[`translation_${lang}`] || ev.content}</p>
               </div>
            ))}
          </div>
        </div>

        {/* AI Digest */}
        <div className="w-[300px] shrink-0 glass-panel rounded-lg flex flex-col overflow-hidden border-l-2 border-secondary/20 pointer-events-auto">
          <div className="p-2 border-b border-white/5 bg-surface-container-high/30 flex justify-between">
            <span className="mono text-[10px] font-bold text-secondary uppercase">{t.ai_digest}</span>
            <span className="material-symbols-outlined text-[14px] text-secondary">neurology</span>
          </div>
          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
            <ul className="text-[10px] text-on-surface-variant space-y-2.5 list-none">
              {newsEvents.slice(0, 5).map((ev, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-secondary mt-0.5">▪</span>
                  <span>{((ev as any)[`translation_${lang}`] || ev.content).substring(0, 100)}...</span>
                </li>
              ))}
              {newsEvents.length === 0 && <li className="text-gray-600 italic">Synthesizing intelligence...</li>}
            </ul>
          </div>
        </div>

        {/* Tactical Attrition */}
        <div className={`flex-1 min-w-[100px] glass-panel rounded-lg flex flex-col overflow-hidden pointer-events-auto transition-all duration-500 ${isSatModalOpen ? 'border-blue-500/30 w-1/2' : ''}`}>
          <div className="p-2 border-b border-white/5 bg-surface-container-high/30 flex justify-between">
            <span className="mono text-[10px] font-bold text-white uppercase">{t.missile}</span>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
               <span className="text-[8px] text-gray-500 font-mono">LIVE T-30D</span>
            </div>
          </div>
          <div className="flex-1 p-2 flex flex-col justify-end min-h-[140px]">
             {missileStats && missileStats.history ? (
               <div className="w-full h-[110px] -ml-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={missileStats.history}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 9, fill: '#8c909f', fontFamily: 'monospace'}}
                      interval={0}
                    />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c2029', border: '1px solid #31353f', fontSize: '11px', borderRadius: '4px' }}
                      itemStyle={{ padding: '2px 0' }}
                    />
                    <Bar dataKey="alerts" name={t.alerts_count} stackId="a" fill="#ef4444" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="strikes" name={t.strikes_count} stackId="a" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
             ) : (
                <div className="flex-1 flex items-center justify-center text-[10px] text-gray-600 mono animate-pulse">
                  CALIBRATING TACTICAL DATA...
                </div>
             )}
              {missileStats && (
              <div className="mt-1 flex justify-between border-t border-white/5 pt-1.5 px-2">
                <span className="mono text-[10px] text-white uppercase">{t.total_since} {missileStats.since_date || '01.01.2024'}</span>
                <span className="mono text-[10px] text-error font-bold">
                  { (missileStats.total_strikes || (missileStats.stats?.strikes) || 0).toLocaleString() } {t.strikes_count}
                </span>
              </div>
              )}
          </div>
        </div>

        {/* Social Monitor */}
        <div className="w-[320px] shrink-0 glass-panel rounded-lg flex flex-col overflow-hidden pointer-events-auto">
          <div className="p-2 border-b border-white/5 bg-surface-container-high/30 flex justify-between">
            <span className="mono text-[10px] font-bold text-white uppercase">{t.social}</span>
            <span className="material-symbols-outlined text-[14px] text-gray-500">hub</span>
          </div>
          <div className="p-2 overflow-y-auto space-y-2 flex-1">
             {socialEvents.length === 0 && <div className="text-on-surface-variant text-xs text-center mt-4">Waiting for signals...</div>}
             {socialEvents.map((ev, i) => (
                <div key={i} className="bg-black/20 p-2 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="mono text-[8px] text-blue-400">{ev.source.substring(0, 15).toUpperCase()}</span>
                    <span className="mono text-[7px] bg-tertiary-container/30 text-tertiary-container px-1 rounded uppercase">{t.unverified}</span>
                  </div>
                  <p className="text-[9px] italic text-on-surface-variant line-clamp-3">"{ (ev as any)[`translation_${lang}`] || ev.content }"</p>
                  <div className="mono text-[7px] text-gray-600 mt-1">{safeTimeAgo(ev.timestamp)}</div>
                </div>
             ))}
          </div>
        </div>

      </section>

      {/* SECTION C: LEGEND OVERLAY */}
      <div className="fixed bottom-[240px] right-[20px] z-40 glass-panel p-2 rounded-lg flex flex-col gap-2 shadow-xl border border-white/10 transition-all duration-500">
        <h4 className="mono text-[8px] font-bold text-gray-500 uppercase tracking-tighter">{t.legend}</h4>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error"></span>
            <span className="mono text-[8px] text-on-surface">{t.active_alert}</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-warning"></span>
             <span className="mono text-[8px] text-on-surface">{t.strike_warning}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-primary"></span>
            <span className="mono text-[8px] text-on-surface">{t.frontline_shift}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t border-dashed border-primary-container"></span>
            <span className="mono text-[8px] text-on-surface">Logistics Vector</span>
          </div>
        </div>
      </div>

      {/* FOOTER - TACTICAL TICKER */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex items-center px-4 overflow-hidden bg-black/90 backdrop-blur-md border-t border-white/5 h-[32px] gap-6">
        <div className="flex items-center gap-3 border-r border-white/10 pr-4 h-full">
           <div className="w-2 h-2 bg-error rounded-full animate-pulse shadow-[0_0_8px_rgba(239, 68, 68, 0.8)]" />
           <span className="mono text-[10px] font-black text-blue-400 whitespace-nowrap tracking-widest italic flex items-center gap-2">
             <span className="opacity-50">//</span> UKRAINE WARMONITOR <span className="text-[#ff9f1c] italic">LIVE FEED</span>
           </span>
        </div>
        
        <div className="flex-grow relative overflow-hidden flex items-center h-full">
          <div className="animate-marquee whitespace-nowrap mono text-[10px] text-white/90 uppercase flex items-center gap-12">
            {newsEvents.length ? newsEvents.map((e, i) => (
               <div key={i} className="flex items-center gap-4 group">
                 <span className="text-yellow-500 font-bold tracking-tight opacity-90 border border-yellow-500/20 px-1 py-0.5 rounded-[2px] bg-yellow-500/5">
                   {safeTimeAgo(e.timestamp).toUpperCase()}
                 </span>
                 <span className="text-gray-300 font-medium tracking-tight hover:text-white transition-colors">
                   { (e as any)[`translation_${lang}`] || e.content }
                 </span>
                 <span className="text-blue-500 font-black opacity-30 px-4 group-last:hidden">//</span>
               </div>
            )) : (
              <div className="flex items-center gap-4 text-blue-400 italic">
                <span className="animate-pulse">ESTABLISHING SECURE DATA LINK...</span>
                <span>SEARCHING SATELLITE NODE 092-B...</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-4 ml-auto border-l border-white/10 pl-4 h-full">
           <div className="flex flex-col items-end">
             <span className="mono text-[8px] text-gray-500 leading-none uppercase">{t.bandwidth}</span>
             <span className="mono text-[9px] text-green-500 leading-tight">94.2 MB/s</span>
           </div>
           <div className="flex flex-col items-end">
             <span className="mono text-[8px] text-gray-500 leading-none uppercase">{t.latency}</span>
             <span className="mono text-[9px] text-blue-400 leading-tight">12ms</span>
           </div>
        </div>
      </footer>

      <div className="fixed inset-0 z-[100] scanline-overlay opacity-20 pointer-events-none"></div>
    </main>
  );
}
