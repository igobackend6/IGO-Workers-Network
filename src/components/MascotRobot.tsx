import React from 'react';

interface MascotRobotProps {
  message?: string;
}

export default function MascotRobot({ message = "Need a boost?" }: MascotRobotProps) {
  return (
    <div className="relative flex items-center gap-4 group" id="ai-mascot-robot">
      {/* Speech Bubble */}
      <div className="absolute right-[85px] top-[-5px] md:right-[100px] md:top-[10px] bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-2xl rounded-tr-none shadow-lg border border-slate-100 max-w-[180px] animate-bounce shrink-0 z-10">
        <p className="leading-tight">{message}</p>
        <span className="absolute right-[-6px] top-0 w-3 h-3 bg-white border-t border-r border-slate-100 transform rotate-45"></span>
      </div>

      {/* Floating Robot Body SVG */}
      <div className="w-20 h-20 md:w-24 md:h-24 relative hover:scale-105 transition-all duration-300 cursor-pointer animate-pulse shrink-0">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Glow behind the robot */}
          <circle cx="100" cy="100" r="80" fill="url(#roboGlow)" opacity="0.35" />

          {/* Ears/Side Receivers */}
          <rect x="25" y="85" width="15" height="30" rx="7" fill="#64748b" />
          <rect x="160" y="85" width="15" height="30" rx="7" fill="#64748b" />
          
          {/* Ear Lights */}
          <circle cx="32" cy="100" r="4" fill="#06b6d4" className="animate-ping" />
          <circle cx="168" cy="100" r="4" fill="#06b6d4" className="animate-ping" />

          {/* Head Joint / Neck */}
          <ellipse cx="100" cy="135" rx="20" ry="10" fill="#cbd5e1" />

          {/* Robot Head Outer */}
          <rect x="40" y="45" width="120" height="90" rx="45" fill="url(#headBody)" stroke="#e2e8f0" strokeWidth="4" />

          {/* Glass Visor Face */}
          <rect x="52" y="57" width="96" height="66" rx="33" fill="#0f172a" stroke="#334155" strokeWidth="3" />

          {/* Glowing Eyes Screen */}
          <g className="animate-pulse">
            {/* Left Eye */}
            <path d="M 72 82 Q 82 72 92 82" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="82" cy="94" r="5" fill="#22d3ee" />
            
            {/* Right Eye */}
            <path d="M 108 82 Q 118 72 128 82" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="118" cy="94" r="5" fill="#22d3ee" />

            {/* Cute rosy cheeks */}
            <circle cx="68" cy="105" r="4" fill="#f43f5e" opacity="0.6" />
            <circle cx="132" cy="105" r="4" fill="#f43f5e" opacity="0.6" />
            
            {/* Happy Smile */}
            <path d="M 94 105 Q 100 112 106 105" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>

          {/* Subtle Reflection Highlights */}
          <path d="M 50 65 Q 100 48 150 65" stroke="white" strokeWidth="2" opacity="0.25" fill="none" />

          {/* Definitions */}
          <defs>
            <radialGradient id="roboGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="headBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
