"use client";

import React from "react";
import { ShieldAlert, Radio, Zap, Radar, Layers, BrainCircuit, Activity, Database, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UWMEvent } from "@/components/MapComponent";

interface SidebarProps {
  activeLayers: string[];
  toggleLayer: (layer: string) => void;
  events: UWMEvent[];
}

const layers = [
  { id: "frontline", label: "Frontline Control", icon: ShieldAlert, color: "#ef4444" },
  { id: "air_alerts", label: "Air Alerts (Active)", icon: Radio, color: "#f59e0b" },
  { id: "strikes", label: "Strikes (NASA FIRMS)", icon: Zap, color: "#facc15" },
  { id: "flights", label: "MIL ADS-B (OpenSky)", icon: Radar, color: "#60a5fa" },
];

export const Sidebar = ({ activeLayers, toggleLayer, events }: SidebarProps) => {
  // Count events by type for stats
  const airAlerts = events.filter((e) => e.type === "air_alert").length;
  const strikes = events.filter((e) => e.type === "strike").length;
  const newsCount = events.filter((e) => e.type === "news").length;

  return (
    <aside className="relative flex flex-col w-[300px] min-w-[300px] h-screen glass border-r border-white/5 z-20 overflow-hidden p-5 backdrop-blur-2xl">
      
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative">
          <Activity className="text-red-500 w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white leading-none">UWM MONITOR</h1>
          <p className="text-[9px] text-gray-500 tracking-[0.2em] uppercase mt-0.5">Ukraine War Intelligence</p>
        </div>
      </div>

      {/* Live Stats Bar */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: "Alerts", value: airAlerts, color: "#f59e0b" },
          { label: "Strikes", value: strikes, color: "#ef4444" },
          { label: "Reports", value: newsCount, color: "#60a5fa" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white/5 border border-white/5 p-2 text-center">
            <div className="text-lg font-bold font-mono" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Layer Toggle Section */}
      <div className="flex flex-col gap-2 mb-6">
        <label className="text-[9px] uppercase font-bold tracking-widest text-gray-500 flex items-center gap-2">
          <Layers size={10} /> Battlespace Layers
        </label>
        <div className="flex flex-col gap-1.5">
          {layers.map((layer) => {
            const Icon = layer.icon;
            const isActive = activeLayers.includes(layer.id);
            return (
              <motion.button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  isActive
                    ? "bg-white/8 border-white/15 text-white"
                    : "border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300"
                }`}
              >
                <Icon
                  size={14}
                  style={{ color: isActive ? layer.color : "#4b5563" }}
                />
                <span>{layer.label}</span>
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: layer.color, boxShadow: `0 0 6px ${layer.color}` }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* AI Insight Panel */}
      <div className="flex flex-col gap-2 flex-1">
        <label className="text-[9px] uppercase font-bold tracking-widest text-gray-500 flex items-center gap-2">
          <BrainCircuit size={10} /> Groq AI Analysis
        </label>
        <div className="rounded-xl bg-white/5 border border-white/5 p-3 text-xs text-gray-400 leading-relaxed font-mono flex-1 overflow-y-auto">
          <p className="text-[9px] text-emerald-400 mb-2 flex items-center gap-1">
            <Cpu size={9} /> llama-3.3-70b-versatile
          </p>
          {events.length === 0 ? (
            <p className="text-gray-600 italic">Awaiting live data for analysis...</p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={events[0]?.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-gray-300"
              >
                {events[0]?.content?.substring(0, 200)}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer / About */}
      <footer className="pt-4 border-t border-white/5 mt-4 space-y-3">
        <div className="text-[10px] text-gray-500 leading-relaxed font-sans">
          <p className="mb-2">
            <span className="text-gray-300 font-bold">Ukraine War Monitor</span> is a personal hobby project by <span className="text-blue-400">Yogurt</span>. 
          </p>
          <div className="flex flex-col gap-1 mb-3">
             <a href="https://x.com/Yogi83729247" target="_blank" className="text-blue-500 hover:text-blue-300 transition-colors flex items-center gap-1.5 underline underline-offset-2">
                Follow on X (Twitter)
             </a>
             <a href="https://www.linkedin.com/in/alex-egotubov-8b28a268" target="_blank" className="text-blue-400 hover:text-blue-200 transition-colors flex items-center gap-1.5 underline underline-offset-2">
                LinkedIn Profile
             </a>
          </div>
          <p className="text-[9px] text-gray-600 italic">
            Powered by Public Information (OSINT) & Agentic AI. 
            Missile tracks are AI-estimated and may contain inaccuracies.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-gray-700">
          <Database size={9} />
          <span>{events.length} tactical units in buffer</span>
        </div>
      </footer>
    </aside>
  );
};
