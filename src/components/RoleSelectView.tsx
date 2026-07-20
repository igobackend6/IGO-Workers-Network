import React from 'react';
import { motion } from 'motion/react';
import { getTranslation } from '../translations';
import { UserRole } from '../types';
import { Shield, Sparkles, ChevronRight, Users2, Briefcase, Crown, LineChart, ArrowLeft } from 'lucide-react';

interface RoleSelectViewProps {
  lang: 'en' | 'ta';
  onSelectRole: (role: UserRole) => void;
  onBackToHome?: () => void;
}

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

export default function RoleSelectView({ lang, onSelectRole, onBackToHome }: RoleSelectViewProps) {
  const roles: Array<{
    role: UserRole;
    id: string;
    labelKey: string;
    tag: string;
    icon: React.ReactNode;
  }> = [
    {
      role: 'supervisor',
      id: 'role-card-supervisor',
      labelKey: 'roleSupervisor',
      tag: lang === 'en' ? 'Mobile OTP Login' : 'மொபைல் ஒடிபி உள்நுழைவு',
      icon: <Users2 className="w-5 h-5" strokeWidth={1.5} />,
    },
    {
      role: 'hr',
      id: 'role-card-hr',
      labelKey: 'roleHR',
      tag: lang === 'en' ? 'Pan-India Deployment Desk' : 'அகில இந்திய பணி அமர்த்தல் பிரிவு',
      icon: <Briefcase className="w-5 h-5" strokeWidth={1.5} />,
    },
    {
      role: 'admin',
      id: 'role-card-admin',
      labelKey: 'roleAdmin',
      tag: lang === 'en' ? 'Pan-India Overview & Oversight' : 'அகில இந்திய கண்ணோட்டம்',
      icon: <Crown className="w-5 h-5" strokeWidth={1.5} />,
    },
    {
      role: 'ceo',
      id: 'role-card-ceo',
      labelKey: 'roleCeo',
      tag: lang === 'en' ? 'Executive Analytics Dashboard' : 'நிர்வாக பகுப்பாய்வு கட்டுப்பாட்டகம்',
      icon: <LineChart className="w-5 h-5" strokeWidth={1.5} />,
    },
  ];

  return (
    <motion.div
      id="role-select-container"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springTransition}
      className="w-full max-w-md mx-auto bento-surface rounded-[2rem] overflow-hidden text-slate-900"
    >
      {/* Visual Header */}
      <div className="p-7 bg-slate-950 text-center relative overflow-hidden">
        {onBackToHome && (
          <button
            type="button"
            id="btn-back-to-home"
            onClick={onBackToHome}
            className="absolute top-3 left-3 z-20 flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
            {getTranslation('landingBackToHome', lang)}
          </button>
        )}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-600/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-14 -right-10 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />

        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
          className="animate-glow-ring inline-flex p-3.5 bg-emerald-600 rounded-full text-white mb-3 shadow-sm relative z-10"
        >
          <Shield className="w-6 h-6" strokeWidth={1.5} />
        </motion.div>
        <h1 className="text-xl font-black font-sans tracking-tighter uppercase text-white leading-none relative z-10">
          {getTranslation('appName', lang)}
        </h1>
        <p className="text-[9px] text-emerald-300/90 font-bold mt-1.5 uppercase tracking-widest font-sans relative z-10 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-300" strokeWidth={1.5} />
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
              transition={{ ...springTransition, delay: 0.05 + idx * 0.08 }}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-900/8 hover:border-emerald-500/30 hover:bg-emerald-50/40 rounded-2xl text-left transition-colors cursor-pointer group"
              onClick={() => onSelectRole(r.role)}
            >
              <div className="flex items-center gap-3">
                <div className="icon-badge-emerald w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  {r.icon}
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block text-sm">
                    {getTranslation(r.labelKey, lang)}
                  </span>
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest mt-0.5 text-emerald-700">
                    {r.tag}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" strokeWidth={1.5} />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
