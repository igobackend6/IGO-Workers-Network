import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getTranslation } from '../translations';
import { SKILL_CATEGORIES } from '../data';
import {
  Shield, Sparkles, ArrowRight, Clock, ShieldCheck, Globe2, Zap,
  Phone, Mail, MapPin, Building2, Languages, Users2, HardHat,
  Hammer, Axe, Wrench, Flame, Cog, Users, Tractor, Truck, BrainCircuit,
  ChevronLeft, ChevronRight
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
type SkillAccent = 'violet' | 'indigo' | 'amber' | 'emerald' | 'rose';
const SKILL_ACCENTS: SkillAccent[] = ['violet', 'indigo', 'amber', 'emerald', 'rose'];

const SKILL_ACCENT_ICON: Record<SkillAccent, string> = {
  violet: 'icon-glow-violet bg-violet-500/15 text-violet-300 border border-violet-500/30',
  indigo: 'icon-glow-indigo bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
  amber: 'icon-glow-amber bg-amber-500/15 text-amber-300 border border-amber-500/30',
  emerald: 'icon-glow-emerald bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  rose: 'icon-glow-rose bg-rose-500/15 text-rose-300 border border-rose-500/30',
};
const SKILL_ACCENT_BLOB: Record<SkillAccent, string> = {
  violet: 'bg-violet-500',
  indigo: 'bg-indigo-500',
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
const CONTACT_EMAIL = 'bd2@igogroups.com';
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

type BrandAccent = 'violet' | 'indigo' | 'amber' | 'emerald' | 'rose';
const BRAND_ACCENTS: BrandAccent[] = ['violet', 'indigo', 'amber', 'emerald', 'rose'];
const BRAND_ACCENT_GLOW: Record<BrandAccent, string> = {
  violet: 'border-violet-400/60 shadow-[0_0_16px_1px_rgba(139,92,246,0.35)] hover:shadow-[0_0_26px_4px_rgba(139,92,246,0.55)]',
  indigo: 'border-indigo-400/60 shadow-[0_0_16px_1px_rgba(124,110,246,0.35)] hover:shadow-[0_0_26px_4px_rgba(124,110,246,0.55)]',
  amber: 'border-amber-400/60 shadow-[0_0_16px_1px_rgba(245,158,11,0.35)] hover:shadow-[0_0_26px_4px_rgba(245,158,11,0.55)]',
  emerald: 'border-emerald-400/60 shadow-[0_0_16px_1px_rgba(16,185,129,0.35)] hover:shadow-[0_0_26px_4px_rgba(16,185,129,0.55)]',
  rose: 'border-rose-400/60 shadow-[0_0_16px_1px_rgba(244,63,94,0.35)] hover:shadow-[0_0_26px_4px_rgba(244,63,94,0.55)]',
};

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
          <div className="icon-glow-violet w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black text-base tracking-tighter shadow-lg select-none shrink-0">
            I
          </div>
          <span className="text-sm font-black tracking-tight uppercase text-white hidden sm:inline">
            {getTranslation('appName', lang)}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
          <a href="#services" className="hover:text-violet-300 transition-colors">{getTranslation('landingNavServices', lang)}</a>
          <a href="#brands" className="hover:text-violet-300 transition-colors">{getTranslation('landingNavBrands', lang)}</a>
          <a href="#contact" className="hover:text-violet-300 transition-colors">{getTranslation('landingNavContact', lang)}</a>
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
            className="btn-sheen px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            {getTranslation('landingPortalLogin', lang)}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 sm:px-8 py-16 sm:py-24 text-center">
        <div className="pointer-events-none absolute top-[-15%] left-[-10%] w-[380px] h-[380px] bg-violet-500/20 rounded-full blur-3xl animate-blob" />
        <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[420px] h-[420px] bg-indigo-500/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="pointer-events-none absolute top-[30%] right-[20%] w-[280px] h-[280px] bg-fuchsia-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-violet-300 mb-6"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          {getTranslation('portalSubtitle', lang)}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto"
        >
          {getTranslation('landingHeroHeadline', lang)}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 text-sm sm:text-base text-slate-300 font-medium mt-5 max-w-xl mx-auto leading-relaxed"
        >
          {getTranslation('landingHeroSubheadline', lang)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
        >
          <a
            href="#contact"
            id="btn-hero-request-workers"
            className="btn-sheen w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition-all active:translate-y-0.5 active:border-b-0 cursor-pointer text-center"
          >
            {getTranslation('landingHeroCtaPrimary', lang)}
          </a>
          <a
            href="#contact"
            id="btn-hero-partner"
            className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 border-2 border-white/10 text-slate-100 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            {getTranslation('landingHeroCtaSecondary', lang)}
          </a>
        </motion.div>
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
              <div className="icon-glow-violet inline-flex p-2.5 bg-violet-500/15 text-violet-300 rounded-xl border border-violet-500/30 mb-2">
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
          <div className="pointer-events-none absolute -top-20 -left-16 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl animate-blob" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />

          <div className="relative z-10 flex flex-col items-center text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/25 rounded-full text-[9px] font-black uppercase tracking-widest text-violet-300 mb-3">
              <BrainCircuit className="w-3.5 h-3.5 text-violet-300" />
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
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-200px] w-[160%] h-96 rounded-[50%] bg-violet-600/25 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-150px] w-[100%] h-60 rounded-[50%] bg-fuchsia-500/15 blur-3xl" />

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
                  idx === activeSkill ? 'w-5 bg-violet-400' : 'w-1.5 bg-white/20 hover:bg-white/35'
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
            <div className="icon-glow-indigo inline-flex p-2.5 bg-indigo-500/15 text-indigo-300 rounded-xl border border-indigo-500/30 mb-2.5">
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

      {/* Footer */}
      <footer className="px-5 sm:px-8 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">{getTranslation('appName', lang)}</span>
            <span className="text-[10px] text-slate-500 font-semibold">{getTranslation('landingFooterTagline', lang)}</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-600 font-bold">© {new Date().getFullYear()} {getTranslation('appName', lang)}. All rights reserved.</span>
      </footer>
    </div>
  );
}
