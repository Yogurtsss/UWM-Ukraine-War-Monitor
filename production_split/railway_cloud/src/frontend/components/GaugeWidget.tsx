import React from 'react';

export const GaugeWidget = ({ score, max = 10 }: { score: number, max?: number }) => {
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  
  // Clean mathematical arc calculation
  // Radius: 50, Viewbox: 0 0 120 70
  const r = 50;
  const cx = 60;
  const cy = 60;
  
  const getPath = (percent: number) => {
    const angle = (percent / 100) * 180;
    const rad = (angle * Math.PI) / 180;
    const x = cx - r * Math.cos(rad);
    const y = cy - r * Math.sin(rad);
    // Large-arc-flag is 0 for semi-circle
    return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`;
  };

  const fullArc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const progressArc = getPath(percentage);

  // Dynamic colors
  const color = score > 7 ? "#ef4444" : score > 4 ? "#f59e0b" : "#10b981";

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <svg width="180" height="100" viewBox="0 0 120 70" className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Gray Background Track */}
        <path
          d={fullArc}
          fill="none"
          stroke="#1f2937"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Animated Progress Track */}
        <path
          d={progressArc}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        
        {/* Decorative Marks */}
        {[0, 25, 50, 75, 100].map((step) => {
          const angle = (step / 100) * 180;
          const rad = (angle * Math.PI) / 180;
          const x1 = cx - (r - 12) * Math.cos(rad);
          const y1 = cy - (r - 12) * Math.sin(rad);
          const x2 = cx - (r - 18) * Math.cos(rad);
          const y2 = cy - (r - 18) * Math.sin(rad);
          return (
            <line key={step} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth="1" />
          );
        })}
      </svg>

      {/* Center Display */}
      <div className="absolute top-[45px] flex flex-col items-center">
        <div className="flex items-baseline gap-0.5">
          <span className="text-4xl font-black font-mono tracking-tighter" style={{ color, textShadow: `0 0 15px ${color}44` }}>
            {score.toFixed(1)}
          </span>
          <span className="text-xs text-gray-600 font-mono font-bold">/10</span>
        </div>
        <div className="flex flex-col items-center -mt-1">
          <span className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] ${score > 7 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
            {score > 7 ? 'CRITICAL' : score > 4 ? 'ELEVATED' : 'STABLE'}
          </span>
          <div className="w-12 h-[1px] bg-gray-800 mt-1" />
        </div>
      </div>
    </div>
  );
};
