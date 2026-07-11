import React from 'react';
import { motion } from 'motion/react';
import { getTranslation } from '../translations';
import { UserRole } from '../types';
import { Shield, Sparkles, ChevronRight, Users2, Briefcase, Crown } from 'lucide-react';

interface RoleSelectViewProps {
  lang: 'en' | 'ta';
  onSelectRole: (role: UserRole) => void;
}

export default function RoleSelectView({ lang, onSelectRole }: RoleSelectViewProps) {
  const roles: Array<{
    role: UserRole;
    id: string;
    labelKey: string;
    tag: string;
    icon: React.ReactNode;
    accent: 'violet' | 'rose';
  }> = [
    {
      role: 'supervisor',
      id: 'role-card-supervisor',
      labelKey: 'roleSupervisor',
      tag: lang === 'en' ? 'Mobile OTP Login' : 'மொபைல் ஒடிபி உள்நுழைவு',
      icon: <Users2 className="w-5 h-5" />,
      accent: 'violet',
    },
    {
      role: 'hr',
      id: 'role-card-hr',
      labelKey: 'roleHR',
      tag: lang === 'en' ? 'Pan-India Deployment Desk' : 'அகில இந்திய பணி அமர்த்தல் பிரிவு',
      icon: <Briefcase className="w-5 h-5" />,
      accent: 'violet',
    },
    {
      role: 'admin',
      id: 'role-card-admin',
      labelKey: 'roleAdmin',
      tag: lang === 'en' ? 'Pan-India Stats & Oversight' : 'அகில இந்திய புள்ளிவிவரங்கள்',
      icon: <Crown className="w-5 h-5" />,
      accent: 'rose',
    },
  ];

  return (
    <motion.div
      id="role-select-container"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md mx-auto glass-card rounded-[28px] shadow-2xl shadow-black/40 overflow-hidden text-slate-100 border border-white/10"
    >
      {/* Visual Header */}
      <div className="p-7 bg-black/40 text-center relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-violet-600/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-14 -right-10 w-44 h-44 bg-fuchsia-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />

        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
          className="icon-glow-violet animate-glow-ring inline-flex p-3.5 bg-violet-600 rounded-full text-white mb-3 shadow-lg relative z-10"
        >
          <Shield className="w-6 h-6 stroke-[2]" />
        </motion.div>
        <h1 className="text-xl font-black font-sans tracking-tight uppercase text-white leading-none relative z-10">
          <span className="text-shimmer">{getTranslation('appName', lang)}</span>
        </h1>
        <p className="text-[9px] text-violet-300/90 font-bold mt-1.5 uppercase tracking-widest font-sans relative z-10 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          {getTranslation('portalSubtitle', lang)}
        </p>
      </div>

      <div className="p-6 space-y-5">
        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
          {getTranslation('selectRole', lang)}
        </h2>

        <div className="space-y-2.5" id="role-card-list">
          {roles.map((r, idx) => (
            <motion.button
              key={r.id}
              id={r.id}
              type="button"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.08, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl text-left transition-colors cursor-pointer group shadow-sm ${
                r.accent === 'rose'
                  ? 'hover:bg-rose-500/10 hover:border-rose-500/30'
                  : 'hover:bg-violet-500/10 hover:border-violet-500/30'
              }`}
              onClick={() => onSelectRole(r.role)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    r.accent === 'rose'
                      ? 'icon-glow-rose bg-rose-500/15 text-rose-400 border border-rose-500/25'
                      : 'icon-glow-violet bg-violet-500/15 text-violet-400 border border-violet-500/25'
                  }`}
                >
                  {r.icon}
                </div>
                <div>
                  <span className="font-extrabold text-slate-100 block text-sm">
                    {getTranslation(r.labelKey, lang)}
                  </span>
                  <span
                    className={`block text-[9px] font-extrabold uppercase tracking-widest mt-0.5 ${
                      r.accent === 'rose' ? 'text-rose-400' : 'text-violet-400'
                    }`}
                  >
                    {r.tag}
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-all ${
                  r.accent === 'rose' ? 'group-hover:text-rose-400' : 'group-hover:text-violet-400'
                }`}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
