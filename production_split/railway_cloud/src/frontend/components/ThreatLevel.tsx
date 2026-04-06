"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface ThreatLevelProps {
  score: number;
}

export const ThreatLevel = ({ score }: ThreatLevelProps) => {
  const getLevelColor = () => {
    if (score > 8) return "bg-red-500 shadow-red-500/30";
    if (score > 5) return "bg-amber-500 shadow-amber-500/30";
    return "bg-green-500 shadow-green-500/30";
  };

  return (
    <div className="p-4 glass rounded-3xl w-48 border border-white/5 backdrop-blur-3xl shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert size={14} className="text-red-500" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
          THREAT SCORE
        </span>
      </div>

      <div className="flex items-end gap-2 px-1">
        <span className="text-4xl font-black text-white leading-none tracking-tighter">
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400 font-mono mb-1">/ 10.0</span>
      </div>

      <div className="mt-4 w-full h-[3px] bg-white/5 rounded-full overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          className={`h-full absolute left-0 top-0 transition-colors duration-500 ${getLevelColor()}`} 
        />
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-tighter text-gray-600">
        <span>Low</span>
        <span>Peak</span>
      </div>
    </div>
  );
};
