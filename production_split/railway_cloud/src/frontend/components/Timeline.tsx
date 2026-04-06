"use client";

import React, { useState } from "react";
import { Play, SkipBack, SkipForward, Rewind, FastForward } from "lucide-react";
import { motion } from "framer-motion";

export const Timeline = () => {
  const [currentDay, setCurrentDay] = useState(740); // Day of the invasion
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDay(parseInt(e.target.value));
  };

  return (
    <div className="flex flex-col items-center gap-4 w-[60vw] max-w-[800px] h-[100px] p-6 glass rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-2xl">
      <div className="flex items-center gap-8 text-gray-400">
        <SkipBack size={16} className="hover:text-white cursor-pointer transition-colors" />
        <Rewind size={18} className="hover:text-white cursor-pointer transition-colors" />
        <div className="flex h-10 w-10 flex-col items-center justify-center rounded-full border border-white/10 glass-accent text-white signal-pulse-slow">
          <Play size={16} fill="white" />
        </div>
        <FastForward size={18} className="hover:text-white cursor-pointer transition-colors" />
        <SkipForward size={16} className="hover:text-white cursor-pointer transition-colors" />
      </div>

      <div className="relative w-full flex flex-col gap-2">
        <div className="w-full flex justify-between absolute -top-8 px-1 text-[10px] font-mono tracking-tighter text-gray-500 uppercase">
          <span>DAY 0: INVASION START</span>
          <span className="text-white bg-white/5 px-2 py-0.5 rounded-full border border-white/10 font-bold tracking-widest bg-amber-500/10 text-amber-400">DAY {currentDay}: ACTIVE MONITOR</span>
        </div>
        
        {/* Custom Range Slider Styling */}
        <input 
          type="range" 
          min="0" 
          max="800" 
          value={currentDay}
          onChange={handleScrub}
          className="w-full h-[6px] rounded-full bg-white/10 appearance-none transition-all cursor-pointer accent-red-500"
        />

        <div className="w-full flex justify-between px-1 text-[9px] font-mono tracking-tighter text-gray-700 uppercase">
          <span>FEB 24 2022</span>
          <span>APR 05 2026</span>
        </div>
      </div>
    </div>
  );
};
