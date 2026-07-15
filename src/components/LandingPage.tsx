import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getTranslation } from '../translations';
import { SKILL_CATEGORIES } from '../data';
import {
  Shield, Sparkles, ArrowRight, Clock, ShieldCheck, Globe2, Zap,
  Phone, Mail, MapPin, Building2, Languages, Users2, HardHat,
  Hammer, Axe, Wrench, Flame, Cog, Users, Tractor, Truck, BrainCircuit,
  ChevronLeft, ChevronRight, MousePointer2, Facebook, Instagram, Linkedin, Youtube
} from 'lucide-react';

interface LandingPageProps {
  lang: 'en' | 'ta';
  setLang: (lang: 'en' | 'ta') => void;
  onEnterPortal: () => void;
}

// Illustrative figures for the marketing page — not pulled from live Firestore data.
// Swap these for real numbers once the business has them.
const STATS: Array<{ icon: React.ReactNode; value: string; labelKey: string }> = [
  { icon: <Users2 className="w-5 h-5" />, value: '500+', labelKey: 'landingStatSupervisors' },
  { icon: <HardHat className="w-5 h-5" />, value: '10,000+', labelKey: 'landingStatWorkers' },
  { icon: <Building2 className="w-5 h-5" />, value: '26', labelKey: 'landingStatBrands' },
  { icon: <Globe2 className="w-5 h-5" />, value: '6', labelKey: 'landingStatStates' },
];

const FEATURES: Array<{ icon: React.ReactNode; titleKey: string; descKey: string }> = [
  { icon: <Clock className="w-6 h-6" />, titleKey: 'landingFeature247Title', descKey: 'landingFeature247Desc' },
  { icon: <ShieldCheck className="w-6 h-6" />, titleKey: 'landingFeatureVerifiedTitle', descKey: 'landingFeatureVerifiedDesc' },
  { icon: <Globe2 className="w-6 h-6" />, titleKey: 'landingFeatureReachTitle', descKey: 'landingFeatureReachDesc' },
  { icon: <Zap className="w-6 h-6" />, titleKey: 'landingFeatureFastTitle', descKey: 'landingFeatureFastDesc' },
];

// Bento-grid card styling for the skills section, inspired by crypto/AI-product landing
// pages (glowing gradient-bordered cards on a dark canvas). Tailwind class names must stay
// fully static (not template-built) for the JIT compiler to pick them up, so each accent is
// a complete literal string here rather than assembled from a variable.
type SkillAccent = 'emerald' | 'emerald' | 'amber' | 'emerald' | 'rose';
const SKILL_ACCENTS: SkillAccent[] = ['emerald', 'emerald', 'amber', 'emerald', 'rose'];

const SKILL_ACCENT_ICON: Record<SkillAccent, string> = {
  emerald: 'icon-glow-emerald bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  emerald: 'icon-glow-emerald bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  amber: 'icon-glow-amber bg-amber-500/15 text-amber-300 border border-amber-500/30',
  emerald: 'icon-glow-emerald bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  rose: 'icon-glow-rose bg-rose-500/15 text-rose-300 border border-rose-500/30',
};
const SKILL_ACCENT_BLOB: Record<SkillAccent, string> = {
  emerald: 'bg-emerald-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
};
const SKILL_ICON_MAP: Record<string, React.ReactNode> = {
  'Mason': <Hammer className="w-5 h-5" />,
  'Carpenter': <Axe className="w-5 h-5" />,
  'Electrician': <Zap className="w-5 h-5" />,
  'Plumber': <Wrench className="w-5 h-5" />,
  'Welder': <Flame className="w-5 h-5" />,
  'Concrete Mixer Operator': <Cog className="w-5 h-5" />,
  'Helper / General Labour': <Users className="w-5 h-5" />,
  'Agri-Infrastructure Operator': <Tractor className="w-5 h-5" />,
  'Excavator Operator': <Truck className="w-5 h-5" />,
};

// Real contact details, sourced from igoagritechfarms.in (an IGO Group brand site).
const CONTACT_PHONE = '+91 73977 89803';
const CONTACT_PHONES = ['+91 73977 89803', '+91 73977 89804', '+91 73977 89805'];
const CONTACT_EMAIL = 'bd2@igogroups.com';
const CONTACT_EMAILS = ['precisionfarming152@gmail.com', 'bd2@igogroups.com'];
const CONTACT_HUB = 'Uthandi Kanathur, Chennai 600119, Tamil Nadu, India';

// Logos copied from assets/IGO Brands into public/brand-logos so Vite/Vercel serve them statically.
// Only 24 of the intended 26 brand logo files were found in that folder — ask the business
// for the remaining 2 (or confirm 24 is the current, correct count) and drop them in alongside
// these to reach 26.
// Short taglines below are inferred from each brand name (no official copy was supplied) —
// swap these for real descriptions whenever the business provides them.
const BRANDS: Array<{ name: string; file: string; desc: string }> = [
  { name: 'IGO Agritech Farms', file: 'igo-agritech-farms.jpg', desc: 'Agri engineering & smart farm consulting' },
  { name: 'IGO Academy', file: 'igo-academy.jpg', desc: 'Skill training & farmer education' },
  { name: 'IGO Agri Mart', file: 'igo-agri-mart.jpg', desc: 'Farm inputs & equipment retail' },
  { name: 'IGO Crop Care', file: 'igo-crop-care.jpg', desc: 'Crop protection & plant health solutions' },
  { name: 'IGO Exports', file: 'igo-exports.jpg', desc: 'Pan-India agri produce exports' },
  { name: 'IGO Farm Automation', file: 'igo-farm-automation.jpg', desc: 'Smart irrigation & IoT farm systems' },
  { name: 'IGO Farm Factories', file: 'igo-farm-factories.jpg', desc: 'Controlled-environment farm production' },
  { name: 'IGO Farm Loans, Subsidy & Grants', file: 'igo-farm-loans-subsidy-grants.jpg', desc: 'Farmer financing & subsidy assistance' },
  { name: 'IGO Farmlands', file: 'igo-farmlands.jpg', desc: 'Managed farmland investment' },
  { name: 'IGO Fintech', file: 'igo-fintech.jpg', desc: 'Agri-focused financial services' },
  { name: 'IGO Franchise', file: 'igo-franchise.jpg', desc: 'Business franchise opportunities' },
  { name: 'IGO Mart', file: 'igo-mart.jpg', desc: 'Retail marketplace for farm goods' },
  { name: 'IGO Natural Cosmetics', file: 'igo-natural-cosmetics.jpg', desc: 'Organic & natural personal care' },
  { name: 'IGO Nursery', file: 'igo-nursery.jpg', desc: 'Plant saplings & nursery supply' },
  { name: 'IGO Organic Pharmacy', file: 'igo-organic-pharmacy.jpg', desc: 'Organic health & wellness products' },
  { name: 'IGO Wealth Management Service', file: 'igo-wealth-management.jpg', desc: 'Investment & wealth advisory' },
  { name: 'India Green Organics', file: 'india-green-organics.jpg', desc: 'Certified organic produce' },
  { name: 'Farm Gate Mandi', file: 'farm-gate-mandi.jpg', desc: 'Direct farm-to-market produce trading' },
  { name: 'Farmer Factory', file: 'farmer-factory.jpg', desc: 'Farm produce processing & packaging' },
  { name: 'Palm Cafe', file: 'palm-cafe.jpg', desc: 'Farm-to-cup cafe experience' },
  { name: 'Protein Cuts', file: 'protein-cuts.jpg', desc: 'Quality meat & protein retail' },
  { name: 'Tech Farming Expert', file: 'tech-farming-expert.jpg', desc: 'Precision farming technology consulting' },
  { name: 'Tech Farming Scientists Foundation', file: 'tech-farming-scientists-foundation.jpg', desc: 'Agri research & innovation foundation' },
  { name: 'Valluvam', file: 'valluvam.jpg', desc: 'Traditional wellness & heritage products' },
];

type BrandAccent = 'emerald' | 'emerald' | 'amber' | 'emerald' | 'rose';
const BRAND_ACCENTS: BrandAccent[] = ['emerald', 'emerald', 'amber', 'emerald', 'rose'];
const BRAND_ACCENT_GLOW: Record<BrandAccent, string> = {
  emerald: 'border-emerald-400/60 shadow-[0_0_16px_1px_rgba(139,92,246,0.35)] hover:shadow-[0_0_26px_4px_rgba(139,92,246,0.55)]',
  emerald: 'border-emerald-400/60 shadow-[0_0_16px_1px_rgba(124,110,246,0.35)] hover:shadow-[0_0_26px_4px_rgba(124,110,246,0.55)]',
  amber: 'border-amber-400/60 shadow-[0_0_16px_1px_rgba(245,158,11,0.35)] hover:shadow-[0_0_26px_4px_rgba(245,158,11,0.55)]',
  emerald: 'border-emerald-400/60 shadow-[0_0_16px_1px_rgba(16,185,129,0.35)] hover:shadow-[0_0_26px_4px_rgba(16,185,129,0.55)]',
  rose: 'border-rose-400/60 shadow-[0_0_16px_1px_rgba(244,63,94,0.35)] hover:shadow-[0_0_26px_4px_rgba(244,63,94,0.55)]',
};

// Orbit system for the hero (Nixtio marketing-agency reference): worker avatars and
// dark skill-icon tiles circling a central headline stat on concentric rings.
// Angles are degrees, radii are px within a 420px visual (scaled down on mobile).
const ORBIT_AVATARS: Array<{ angle: number; radius: number; img: string }> = [
  { angle: -80, radius: 195, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop' },
  { angle: 10, radius: 195, img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' },
  { angle: 100, radius: 195, img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop' },
  { angle: 190, radius: 145, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop' },
  { angle: 280, radius: 95, img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop' },
];

const ORBIT_TILES: Array<{ angle: number; radius: number; icon: React.ReactNode }> = [
  { angle: -30, radius: 145, icon: <Zap className="w-4 h-4 text-emerald-300" /> },
  { angle: 60, radius: 145, icon: <Hammer className="w-4 h-4 text-amber-300" /> },
  { angle: 150, radius: 145, icon: <Wrench className="w-4 h-4 text-emerald-300" /> },
  { angle: 230, radius: 195, icon: <Flame className="w-4 h-4 text-rose-300" /> },
];

export default function LandingPage({ lang, setLang, onEnterPortal }: LandingPageProps) {
  // Auto-advancing 3D coverflow carousel for the skills section, paused on hover.
  const [activeSkill, setActiveSkill] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const skillCount = SKILL_CATEGORIES.length;

  useEffect(() => {
    if (carouselPaused) return;
    const timer = setInterval(() => {
      setActiveSkill((i) => (i + 1) % skillCount);
    }, 2600);
    return () => clearInterval(timer);
  }, [carouselPaused, skillCount]);

  return (
    <div
      id="landing-page-root"
      className="w-full max-w-7xl mx-auto glass-panel rounded-[32px] shadow-2xl border border-white/10 animate-fadeIn text-slate-100"
    >
      {/* Nav Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-5 sm:px-8 py-4 bg-black/40 backdrop-blur-md border-b border-white/10 rounded-t-[32px]">
        <div className="flex items-center gap-2.5">
          <div className="icon-glow-emerald w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-black text-base tracking-tighter shadow-lg select-none shrink-0">
            I
          </div>
          <span className="text-sm font-black tracking-tight uppercase text-white hidden sm:inline">
            {getTranslation('appName', lang)}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
          <a href="#services" className="hover:text-emerald-300 transition-colors">{getTranslation('landingNavServices', lang)}</a>
          <a href="#brands" className="hover:text-emerald-300 transition-colors">{getTranslation('landingNavBrands', lang)}</a>
          <a href="#contact" className="hover:text-emerald-300 transition-colors">{getTranslation('landingNavContact', lang)}</a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="landing-lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Switch Language"
          >
            <Languages className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-portal-login"
            onClick={onEnterPortal}
            className="btn-sheen px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            {getTranslation('landingPortalLogin', lang)}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero — Nixtio marketing-agency reference: left-aligned bold headline + pill CTA,
          orbital avatar/icon ring system around a central stat on the right,
          and a partner logo strip along the bottom edge. */}
      <section className="hero-nixtio-glow relative overflow-hidden px-5 sm:px-10 pt-14 sm:pt-20 pb-8">
        <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[420px] h-[420px] bg-emerald-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="pointer-events-none absolute top-[30%] right-[20%] w-[280px] h-[280px] bg-emerald-400/10 rounded-full blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: headline + CTA */}
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-fade-dark-light text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.08]"
            >
              {getTranslation('landingHeroHeadline', lang)}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-400 font-medium mt-5 max-w-md mx-auto lg:mx-0 leading-relaxed"
            >
              {getTranslation('landingHeroSubheadline', lang)}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
            >
              <a
                href="#contact"
                id="btn-hero-request-workers"
                className="btn-sheen inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 border border-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-[0_0_20px_2px_rgba(16,185,129,0.35)] hover:shadow-[0_0_28px_4px_rgba(16,185,129,0.5)] transition-all cursor-pointer active:scale-95"
              >
                {getTranslation('landingHeroCtaPrimary', lang)}
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Collaborative cursor tag, like the reference's "David" pointer chip */}
              <div className="hidden sm:flex items-start pt-6 pl-2 select-none" aria-hidden="true">
                <MousePointer2 className="w-4 h-4 text-emerald-400 -mb-1 fill-emerald-400" />
                <span className="ml-0.5 mt-3 px-2.5 py-1 bg-emerald-500/90 text-white text-[10px] font-bold rounded-full rounded-tl-none shadow-md">
                  {getTranslation('landingHeroCursorTag', lang)}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right: orbital ring system around the central stat */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto w-[420px] h-[420px] scale-[0.72] sm:scale-90 lg:scale-100 -my-14 sm:-my-4 lg:my-0"
            id="hero-orbit"
            aria-hidden="true"
          >
            {/* Concentric rings */}
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-[55px] rounded-full border border-white/10" />
            <div className="absolute inset-[110px] rounded-full border border-white/[0.07]" />

            {/* Central stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-white tracking-tight">10,000+</span>
              <span className="text-[11px] font-bold text-slate-400 mt-1">{getTranslation('landingStatWorkers', lang)}</span>
            </div>

            {/* Orbiting items: the wrapper spins slowly, each item counter-spins to stay upright */}
            <div className="absolute inset-0 animate-orbit">
              {ORBIT_AVATARS.map((item) => (
                <div
                  key={item.angle}
                  className="absolute left-1/2 top-1/2 -ml-5 -mt-5"
                  style={{ transform: `rotate(${item.angle}deg) translate(${item.radius}px) rotate(${-item.angle}deg)` }}
                >
                  <div className="animate-orbit-reverse">
                    <img
                      src={item.img}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-[0_0_14px_2px_rgba(139,92,246,0.35)]"
                    />
                  </div>
                </div>
              ))}
              {ORBIT_TILES.map((item) => (
                <div
                  key={item.angle}
                  className="absolute left-1/2 top-1/2 -ml-5 -mt-5"
                  style={{ transform: `rotate(${item.angle}deg) translate(${item.radius}px) rotate(${-item.angle}deg)` }}
                >
                  <div className="animate-orbit-reverse">
                    <div className="w-10 h-10 rounded-xl bg-slate-950/90 border border-white/15 flex items-center justify-center shadow-[0_0_14px_2px_rgba(139,92,246,0.25)]">
                      {item.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Partner strip along the hero's bottom edge, like the reference */}
        <div className="relative z-10 mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-between gap-x-8 gap-y-3">
          {BRANDS.slice(0, 5).map((brand) => (
            <span key={brand.file} className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors select-none">
              {brand.name}
            </span>
          ))}
        </div>
      </section>

      {/* Stats Strip */}
      <section className="px-5 sm:px-8 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat, idx) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="bg-white/5 border-2 border-white/10 rounded-2xl p-4 sm:p-5 text-center shadow-sm"
            >
              <div className="icon-glow-emerald inline-flex p-2.5 bg-emerald-500/15 text-emerald-300 rounded-xl border border-emerald-500/30 mb-2">
                {stat.icon}
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {getTranslation(stat.labelKey, lang)}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services / 24-7 Section */}
      <section id="services" className="px-5 sm:px-8 py-14 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {getTranslation('landingServicesTitle', lang)}
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-3 leading-relaxed">
            {getTranslation('landingServicesSubtitle', lang)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {FEATURES.map((f, idx) => (
            <motion.div
              key={f.titleKey}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="bg-white/5 border-2 border-white/10 rounded-2xl p-5 shadow-sm hover:border-white/20 transition-all"
            >
              <div className="icon-glow-amber inline-flex p-2.5 bg-amber-500/15 text-amber-300 rounded-xl border border-amber-500/30 mb-3">
                {f.icon}
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1.5">
                {getTranslation(f.titleKey, lang)}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                {getTranslation(f.descKey, lang)}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="relative overflow-hidden bg-black/30 border-2 border-white/10 rounded-3xl p-6 sm:p-8">
          {/* Ambient glow + dot-grid backdrop, crypto/AI-product landing page style */}
          <div className="pointer-events-none absolute -top-20 -left-16 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl animate-blob" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />

          <div className="relative z-10 flex flex-col items-center text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-300 mb-3">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-300" />
              {getTranslation('landingSkillsBadge', lang)}
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-shimmer tracking-tight">
              {getTranslation('landingSkillsTitle', lang)}
            </h3>
          </div>

          {/* 3D coverflow carousel — inspired by the referenced crypto-landing-page shot:
              a giant glowing horizon arc beneath an elevated, perspective-tilted card row.
              Auto-advances continuously (setInterval in the effect above), pauses on hover. */}
          <div
            className="relative z-10 h-96 sm:h-[30rem] [perspective:1600px]"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            role="region"
            aria-label={getTranslation('landingSkillsTitle', lang)}
          >
            {/* Glowing horizon arc */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-200px] w-[160%] h-96 rounded-[50%] bg-emerald-600/25 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-150px] w-[100%] h-60 rounded-[50%] bg-emerald-500/15 blur-3xl" />

            <div className="relative h-full flex items-center justify-center [transform-style:preserve-3d]">
              {SKILL_CATEGORIES.map((skill, idx) => {
                let offset = idx - activeSkill;
                if (offset > skillCount / 2) offset -= skillCount;
                if (offset < -skillCount / 2) offset += skillCount;
                const dist = Math.abs(offset);
                if (dist > 1) return null; // only center card + its two neighbors are shown

                const accent = SKILL_ACCENTS[idx % SKILL_ACCENTS.length];
                const icon = SKILL_ICON_MAP[skill] ?? <Sparkles className="w-9 h-9" />;
                const isActive = dist === 0;

                return (
                  <motion.button
                    type="button"
                    key={skill}
                    onClick={() => setActiveSkill(idx)}
                    className="absolute w-56 sm:w-72 cursor-pointer"
                    animate={{
                      x: offset * 220,
                      scale: isActive ? 1.1 : 0.8,
                      rotateY: offset * -30,
                      opacity: isActive ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ zIndex: 10 - dist, transformStyle: 'preserve-3d' }}
                  >
                    <div
                      className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center gap-4 border transition-colors ${
                        isActive
                          ? 'bg-gradient-to-b from-white/[0.08] to-black/40 border-white/20 shadow-2xl'
                          : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-40 ${SKILL_ACCENT_BLOB[accent]}`} />
                      {/* Glossy 3D-style icon badge: base glow color + a soft highlight overlay for volume */}
                      <div className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden ${SKILL_ACCENT_ICON[accent]}`}>
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{ background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 55%)' }}
                        />
                        <span className="relative z-10">{icon}</span>
                      </div>
                      <span className="relative z-10 text-sm sm:text-base font-black text-white uppercase tracking-wide leading-tight">
                        {skill}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Prev / Next controls */}
            <button
              type="button"
              id="landing-skills-prev"
              onClick={() => setActiveSkill((i) => (i - 1 + skillCount) % skillCount)}
              className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              id="landing-skills-next"
              onClick={() => setActiveSkill((i) => (i + 1) % skillCount)}
              className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="relative z-10 flex items-center justify-center gap-1.5 mt-4">
            {SKILL_CATEGORIES.map((skill, idx) => (
              <button
                key={skill}
                type="button"
                aria-label={skill}
                onClick={() => setActiveSkill(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeSkill ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/20 hover:bg-white/35'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Brands / Clients Gallery */}
      <section id="brands" className="px-5 sm:px-8 py-14 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {getTranslation('landingBrandsTitle', lang)}
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-3 leading-relaxed">
            {getTranslation('landingBrandsSubtitle', lang)}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" id="landing-brands-grid">
          {BRANDS.map((brand, idx) => {
            const accent = BRAND_ACCENTS[idx % BRAND_ACCENTS.length];
            return (
              <motion.div
                key={brand.file}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: (idx % 8) * 0.04 }}
                whileHover={{ y: -3 }}
                className={`bg-white rounded-2xl border-2 flex flex-col items-center text-center p-3 h-[150px] sm:h-[160px] transition-shadow duration-300 ${BRAND_ACCENT_GLOW[accent]}`}
              >
                <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                  <img
                    src={`/brand-logos/${brand.file}`}
                    alt={brand.name}
                    className="max-h-full max-w-[88%] object-contain"
                  />
                </div>
                <div className="shrink-0 w-full">
                  <h4 className="text-[11px] font-black text-slate-800 leading-tight line-clamp-1">{brand.name}</h4>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-snug line-clamp-1">{brand.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-5 sm:px-8 py-14 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {getTranslation('landingContactTitle', lang)}
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-3 leading-relaxed">
            {getTranslation('landingContactSubtitle', lang)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-5 text-center">
            <div className="icon-glow-emerald inline-flex p-2.5 bg-emerald-500/15 text-emerald-300 rounded-xl border border-emerald-500/30 mb-2.5">
              <Phone className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{getTranslation('landingContactPhone', lang)}</div>
            <div className="text-sm font-bold text-white mt-1" id="landing-contact-phone">{CONTACT_PHONE}</div>
          </div>
          <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-5 text-center">
            <div className="icon-glow-emerald inline-flex p-2.5 bg-emerald-500/15 text-emerald-300 rounded-xl border border-emerald-500/30 mb-2.5">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{getTranslation('landingContactEmail', lang)}</div>
            <div className="text-sm font-bold text-white mt-1 break-all" id="landing-contact-email">{CONTACT_EMAIL}</div>
          </div>
          <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-5 text-center">
            <div className="icon-glow-rose inline-flex p-2.5 bg-rose-500/15 text-rose-300 rounded-xl border border-rose-500/30 mb-2.5">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{getTranslation('landingContactAddress', lang)}</div>
            <div className="text-sm font-bold text-white mt-1" id="landing-contact-address">{CONTACT_HUB}</div>
          </div>
        </div>
      </section>

      {/* Footer — layout inspired by the IGO Agritech Farms site footer (logo/vision + contact/mission
          + copyright bar), recolored to this page's emerald/amber theme instead of that site's green accent. */}
      <footer className="relative overflow-hidden px-5 sm:px-10 py-12 border-t border-white/10 bg-black/30">
        <div className="pointer-events-none absolute -top-24 -left-10 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Logo, vision, socials */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="icon-glow-emerald w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white font-black text-lg tracking-tighter shadow-lg select-none shrink-0">
                I
              </div>
              <span className="text-sm font-black uppercase tracking-tight text-white">{getTranslation('appName', lang)}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-2">
              {getTranslation('landingFooterVisionLabel', lang)}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {getTranslation('landingFooterVisionText', lang)}
            </p>
            <div className="flex items-center gap-2.5 mt-5">
              {[Facebook, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/40 flex items-center justify-center text-slate-400 hover:text-emerald-300 transition-all"
                  aria-label="Social link"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Contact + mission */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-4">
              {getTranslation('landingNavContact', lang)}
            </span>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-300 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>{CONTACT_HUB}</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300 font-semibold">
                <Phone className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>{CONTACT_PHONES.join(' • ')}</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300 font-semibold">
                <Mail className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="break-all">{CONTACT_EMAILS.join(' • ')}</span>
              </div>
            </div>

            <a
              href="#contact"
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md transition-all cursor-pointer active:scale-95"
            >
              {getTranslation('landingFooterGetInTouch', lang)}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mt-6 mb-2">
              {getTranslation('landingFooterMissionLabel', lang)}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {getTranslation('landingFooterMissionText', lang)}
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px] text-slate-500 font-bold">
            © {new Date().getFullYear()} {getTranslation('appName', lang)}. {getTranslation('landingFooterRights', lang)}
          </span>
          <div className="flex items-center gap-5 text-[10px] text-slate-500 font-bold">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">{getTranslation('landingFooterPrivacy', lang)}</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">{getTranslation('landingFooterTerms', lang)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
