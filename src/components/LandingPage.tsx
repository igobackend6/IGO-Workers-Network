import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getTranslation } from '../translations';
import { SKILL_CATEGORIES } from '../data';
import {
  Shield, Sparkles, ArrowRight, Clock, ShieldCheck, Globe2, Zap,
  Phone, Mail, MapPin, Building2, Languages, Users2, HardHat,
  Hammer, Axe, Wrench, Flame, Cog, Users, Tractor, Truck, BrainCircuit,
  ChevronLeft, ChevronRight, MousePointer2, Facebook, Instagram, Linkedin, Youtube, Camera
} from 'lucide-react';

interface LandingPageProps {
  lang: 'en' | 'ta';
  setLang: (lang: 'en' | 'ta') => void;
  onEnterPortal: () => void;
}

// Shared "glow on hover" treatment applied to every card on the page, per the request to
// have every box brighten its border/glow on mouseover. White/green/black palette only.
const CARD_GLOW =
  'bg-white border-2 border-emerald-100 hover:border-emerald-400 shadow-sm hover:shadow-[0_0_22px_2px_rgba(16,129,73,0.28)] transition-all duration-300';

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

// Real crew photos from a live IGO site build — copied from assets/Skills into public/skills
// so Vite/Vercel serve them statically. Only 7 of the 9 skill categories have a matching
// photo yet (no Helper/General Labour or Agri-Infrastructure Operator shot supplied).
const GALLERY_PHOTOS: Array<{ skill: string; file: string }> = [
  { skill: 'Mason', file: 'mason.png' },
  { skill: 'Carpenter', file: 'carpenter.png' },
  { skill: 'Electrician', file: 'electrician.png' },
  { skill: 'Plumber', file: 'plumber.png' },
  { skill: 'Welder', file: 'welder.png' },
  { skill: 'Concrete Mixer Operator', file: 'mixer-operator.png' },
  { skill: 'Excavator Operator', file: 'excavator-operator.png' },
];

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
// Category + description copy below is the REAL "26 Verticals of IGO" content, taken directly
// from igoagritechfarms.in/igo-groups. Two entries (IGO Agrimart, India Green) reuse a sibling
// division's logo since no distinct asset exists for them; IGO Green Energy has none at all yet
// (falls back to a generic icon in the card).
const BRANDS: Array<{ category: string; name: string; file: string | null; desc: string }> = [
  { category: 'Core Business', name: 'IGO Agritech Farms', file: 'igo-agritech-farms.jpg', desc: "India's leading Agri Engineering & Consulting brand — polyhouse, hydroponics, vertical farming, precision farming and livestock projects. Pan-India. MSME Award 2024." },
  { category: 'Processing & Mfg', name: 'Farmers Factory', file: 'farmer-factory.jpg', desc: 'Farm to shop distribution brand. Bringing fresh farm produce directly to retail stores and consumers across India.' },
  { category: 'Agri Consultancy', name: 'Valluvam', file: 'valluvam.jpg', desc: 'Branded grocery staples celebrating Tamil heritage. Quality everyday essentials — As Pure As Nature.' },
  { category: 'Farm-to-Table', name: 'Protein Cuts', file: 'protein-cuts.jpg', desc: "Premium meat, fish, and eggs retail brand. Fresh protein products straight from IGO's own livestock farms." },
  { category: 'Distribution', name: 'IGO Agri Mart', file: 'igo-agri-mart.jpg', desc: 'Farm inputs and distribution network connecting quality agricultural inputs directly to farmers across India.' },
  { category: 'Plant Propagation', name: 'IGO Nursery', file: 'igo-nursery.jpg', desc: 'Premium nursery and landscaping solutions — supplying quality plants, seeds and horticultural products pan-India.' },
  { category: 'F&B', name: 'Palm Cafe', file: 'palm-cafe.jpg', desc: "The Healthy Food Joint — farm-to-table F&B brand creating 5,000 jobs for youth using IGO's own farm produce." },
  { category: 'Trade', name: 'IGO Exports & Imports', file: 'igo-exports.jpg', desc: 'International trade division connecting Indian agri products to global markets and bringing world-class inputs to India.' },
  { category: 'Foundation', name: 'IGO Tech Farming Scientist Foundation', file: 'tech-farming-scientists-foundation.jpg', desc: 'Research and education foundation advancing agri-science and technology for the next generation of tech farming scientists.' },
  { category: 'Retail', name: 'IGO Mart', file: 'igo-mart.jpg', desc: "Supermarket chain offering quality products at accessible prices — part of IGO Group's consumer retail vision." },
  { category: 'Fintech', name: 'IGO Fintech', file: 'igo-fintech.jpg', desc: 'Micro finance unit providing financial access and support to farmers and agricultural entrepreneurs across India.' },
  { category: 'Real Estate', name: 'IGO Farm Land Estates', file: 'igo-farmlands.jpg', desc: 'Agricultural land and property development — creating investment opportunities in farmland across India.' },
  { category: 'Investment', name: 'IGO Wealth Management Services', file: 'igo-wealth-management.jpg', desc: 'JV investment project providing wealth management and financial planning services to IGO Group stakeholders.' },
  { category: 'Franchise', name: 'IGO Franchise', file: 'igo-franchise.jpg', desc: 'Franchise operations division expanding IGO Group brands across India through a structured franchise model.' },
  { category: 'Programme', name: 'IGO Farmgate Mandi', file: 'farm-gate-mandi.jpg', desc: 'Guaranteed buy-back programme for farmers — empowering agricultural entrepreneurs with assured market access.' },
  { category: 'Agri Input', name: 'IGO Crop Care', file: 'igo-crop-care.jpg', desc: 'Quality crop care solutions for optimum yield and sustainable farming practices across all crop types.' },
  { category: 'Healthcare', name: 'IGO Organic Pharmacy', file: 'igo-organic-pharmacy.jpg', desc: "Future division developing organic pharmaceutical products from IGO's farm network — bridging agriculture and health." },
  { category: 'Lifestyle', name: 'IGO Natural Cosmetics', file: 'igo-natural-cosmetics.jpg', desc: 'Future personal care brand using natural farm-sourced ingredients. Farm to skin — the next frontier for IGO Group.' },
  { category: 'Infrastructure', name: 'IGO Farm Factories', file: 'igo-farm-factories.jpg', desc: 'Industrial-scale farm facilities integrating processing, storage, and logistics for high-efficiency agri-chains.' },
  { category: 'Distribution', name: 'IGO Agrimart', file: 'igo-agri-mart.jpg', desc: 'Specialized input supply centers for advanced farming technologies and sustainable inputs.' },
  { category: 'Sustainability', name: 'India Green', file: 'india-green-organics.jpg', desc: 'Environmental conservation and green initiative division focused on carbon neutrality and sustainable agri-ecosystems.' },
  { category: 'Organic', name: 'India Green Organics', file: 'india-green-organics.jpg', desc: 'Certified organic production and distribution arm ensuring chemical-free food for a healthier India.' },
  { category: 'Finance', name: 'IGO Farm Loans, Subsidy & Grants', file: 'igo-farm-loans-subsidy-grants.jpg', desc: 'Expert guidance and financial facilitation for farmers to access government agricultural subsidies and low-interest loans.' },
  { category: 'Technology', name: 'IGO Farm Automation', file: 'igo-farm-automation.jpg', desc: 'Smart farm hardware and software solutions — IoT, sensors, and automated climate control for precision agriculture.' },
  { category: 'Education', name: 'IGO Training Courses', file: 'igo-academy.jpg', desc: 'Skill development and masterclasses for modern farming techniques, certified by industry experts.' },
  { category: 'Energy', name: 'IGO Green Energy', file: null, desc: 'Renewable energy solutions for farms, including solar water pumps and solar agri-grid integration.' },
];

// Orbit system for the hero (Nixtio marketing-agency reference): worker avatars and
// dark skill-icon tiles circling a central headline stat on concentric rings.
// Structure/motion kept exactly as originally built — only recolored to the white/green/black
// palette below. Angles are degrees, radii are px within a 420px visual (scaled on mobile).
const ORBIT_AVATARS: Array<{ angle: number; radius: number; img: string }> = [
  { angle: -80, radius: 195, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop' },
  { angle: 10, radius: 195, img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' },
  { angle: 100, radius: 195, img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop' },
  { angle: 190, radius: 145, img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop' },
  { angle: 280, radius: 95, img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop' },
];

const ORBIT_TILES: Array<{ angle: number; radius: number; icon: React.ReactNode }> = [
  { angle: -30, radius: 145, icon: <Zap className="w-4 h-4 text-emerald-300" /> },
  { angle: 60, radius: 145, icon: <Hammer className="w-4 h-4 text-emerald-300" /> },
  { angle: 150, radius: 145, icon: <Wrench className="w-4 h-4 text-emerald-300" /> },
  { angle: 230, radius: 195, icon: <Flame className="w-4 h-4 text-emerald-300" /> },
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

  // Auto-changing photo gallery ("under the home page"), crossfading through real crew photos.
  const [activePhoto, setActivePhoto] = useState(0);
  const [galleryPaused, setGalleryPaused] = useState(false);
  const photoCount = GALLERY_PHOTOS.length;

  useEffect(() => {
    if (galleryPaused) return;
    const timer = setInterval(() => {
      setActivePhoto((i) => (i + 1) % photoCount);
    }, 3500);
    return () => clearInterval(timer);
  }, [galleryPaused, photoCount]);

  return (
    <div
      id="landing-page-root"
      className="w-full max-w-7xl mx-auto bg-white rounded-[32px] shadow-2xl border border-emerald-100 animate-fadeIn text-slate-900 overflow-hidden"
    >
      {/* Nav Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-5 sm:px-8 py-4 bg-white/95 backdrop-blur-md border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="icon-glow-emerald w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-black text-base tracking-tighter shadow-lg select-none shrink-0">
            I
          </div>
          <span className="text-sm font-black tracking-tight uppercase text-slate-900 hidden sm:inline">
            {getTranslation('appName', lang)}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
          <a href="#gallery" className="hover:text-emerald-700 transition-colors">{getTranslation('landingNavGallery', lang)}</a>
          <a href="#services" className="hover:text-emerald-700 transition-colors">{getTranslation('landingNavServices', lang)}</a>
          <a href="#brands" className="hover:text-emerald-700 transition-colors">{getTranslation('landingNavBrands', lang)}</a>
          <a href="#contact" className="hover:text-emerald-700 transition-colors">{getTranslation('landingNavContact', lang)}</a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="landing-lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Switch Language"
          >
            <Languages className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-portal-login"
            onClick={onEnterPortal}
            className="btn-sheen px-4 py-2 bg-black hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            {getTranslation('landingPortalLogin', lang)}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero — layout/motion kept exactly as built: left-aligned bold headline + pill CTA,
          orbital avatar/icon ring system around a central stat on the right, partner strip
          along the bottom edge. Only the background/text/accent colors changed to white/green/black. */}
      <section className="hero-nixtio-glow relative overflow-hidden px-5 sm:px-10 pt-14 sm:pt-20 pb-8">
        <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[420px] h-[420px] bg-emerald-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
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
              className="text-sm sm:text-base text-slate-600 font-medium mt-5 max-w-md mx-auto lg:mx-0 leading-relaxed"
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
                className="btn-sheen inline-flex items-center gap-2 px-7 py-3.5 bg-black hover:bg-slate-900 border border-emerald-500/40 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-[0_0_20px_2px_rgba(16,129,73,0.35)] hover:shadow-[0_0_28px_4px_rgba(16,129,73,0.5)] transition-all cursor-pointer active:scale-95"
              >
                {getTranslation('landingHeroCtaPrimary', lang)}
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Collaborative cursor tag, like the reference's "David" pointer chip */}
              <div className="hidden sm:flex items-start pt-6 pl-2 select-none" aria-hidden="true">
                <MousePointer2 className="w-4 h-4 text-emerald-700 -mb-1 fill-emerald-700" />
                <span className="ml-0.5 mt-3 px-2.5 py-1 bg-emerald-700 text-white text-[10px] font-bold rounded-full rounded-tl-none shadow-md">
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
            <div className="absolute inset-0 rounded-full border border-emerald-100" />
            <div className="absolute inset-[55px] rounded-full border border-emerald-100" />
            <div className="absolute inset-[110px] rounded-full border border-emerald-50" />

            {/* Central stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-slate-900 tracking-tight">10,000+</span>
              <span className="text-[11px] font-bold text-slate-500 mt-1">{getTranslation('landingStatWorkers', lang)}</span>
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
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-[0_0_14px_2px_rgba(16,129,73,0.35)]"
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
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-[0_0_14px_2px_rgba(16,129,73,0.3)]">
                      {item.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Partner strip along the hero's bottom edge, like the reference */}
        <div className="relative z-10 mt-10 pt-6 border-t border-emerald-100 flex flex-wrap items-center justify-center lg:justify-between gap-x-8 gap-y-3">
          {BRANDS.slice(0, 5).map((brand) => (
            <span key={brand.name} className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-700 transition-colors select-none">
              {brand.name}
            </span>
          ))}
        </div>
      </section>

      {/* Auto-changing photo gallery — new content: real IGO crew photos, "under the home page"
          per the reference site's own auto-rotating hero carousel pattern. */}
      <section id="gallery" className="px-5 sm:px-8 py-14 border-t border-emerald-50">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-3">
            <Camera className="w-3.5 h-3.5" />
            {getTranslation('landingGalleryBadge', lang)}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {getTranslation('landingGalleryTitle', lang)}
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-3 leading-relaxed">
            {getTranslation('landingGallerySubtitle', lang)}
          </p>
        </div>

        <div
          className="relative max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden border-2 border-emerald-100 shadow-lg hover:border-emerald-400 hover:shadow-[0_0_30px_4px_rgba(16,129,73,0.25)] transition-all duration-300"
          id="landing-gallery"
          onMouseEnter={() => setGalleryPaused(true)}
          onMouseLeave={() => setGalleryPaused(false)}
        >
          <div className="absolute inset-0">
            <img
              src={`/skills/${GALLERY_PHOTOS[activePhoto].file}`}
              alt={GALLERY_PHOTOS[activePhoto].skill}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 sm:p-7">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
                {SKILL_ICON_MAP[GALLERY_PHOTOS[activePhoto].skill]}
                {GALLERY_PHOTOS[activePhoto].skill}
              </span>
              <p className="text-white text-lg sm:text-2xl font-black tracking-tight drop-shadow-lg">
                {getTranslation('appName', lang)}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="landing-gallery-prev"
            onClick={() => setActivePhoto((i) => (i - 1 + photoCount) % photoCount)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            id="landing-gallery-next"
            onClick={() => setActivePhoto((i) => (i + 1) % photoCount)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 right-5 z-10 flex items-center gap-1.5">
            {GALLERY_PHOTOS.map((photo, idx) => (
              <button
                key={photo.file}
                type="button"
                aria-label={photo.skill}
                onClick={() => setActivePhoto(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activePhoto ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
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
              className={`rounded-2xl p-4 sm:p-5 text-center ${CARD_GLOW}`}
            >
              <div className="icon-glow-emerald inline-flex p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 mb-2">
                {stat.icon}
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                {getTranslation(stat.labelKey, lang)}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services / 24-7 Section */}
      <section id="services" className="px-5 sm:px-8 py-14 border-t border-emerald-50">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {getTranslation('landingServicesTitle', lang)}
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-3 leading-relaxed">
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
              className={`rounded-2xl p-5 ${CARD_GLOW}`}
            >
              <div className="icon-glow-emerald inline-flex p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 mb-3">
                {f.icon}
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                {getTranslation(f.titleKey, lang)}
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                {getTranslation(f.descKey, lang)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Skills coverflow panel — a deliberate black bookend (like the footer) framing this
            section, per "footer in black": structure/motion kept exactly as built, only recolored. */}
        <div className="relative overflow-hidden bg-black rounded-3xl p-6 sm:p-8">
          <div className="pointer-events-none absolute -top-20 -left-16 w-64 h-64 bg-emerald-600/25 rounded-full blur-3xl animate-blob" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />

          <div className="relative z-10 flex flex-col items-center text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-300 mb-3">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-300" />
              {getTranslation('landingSkillsBadge', lang)}
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {getTranslation('landingSkillsTitle', lang)}
            </h3>
          </div>

          {/* 3D coverflow carousel: a giant glowing horizon arc beneath an elevated,
              perspective-tilted card row. Auto-advances continuously, pauses on hover. */}
          <div
            className="relative z-10 h-96 sm:h-[30rem] [perspective:1600px]"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            role="region"
            aria-label={getTranslation('landingSkillsTitle', lang)}
          >
            {/* Glowing horizon arc */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-200px] w-[160%] h-96 rounded-[50%] bg-emerald-600/30 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-150px] w-[100%] h-60 rounded-[50%] bg-emerald-500/20 blur-3xl" />

            <div className="relative h-full flex items-center justify-center [transform-style:preserve-3d]">
              {SKILL_CATEGORIES.map((skill, idx) => {
                let offset = idx - activeSkill;
                if (offset > skillCount / 2) offset -= skillCount;
                if (offset < -skillCount / 2) offset += skillCount;
                const dist = Math.abs(offset);
                if (dist > 1) return null; // only center card + its two neighbors are shown

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
                          ? 'bg-gradient-to-b from-emerald-950 to-black border-emerald-500/40 shadow-2xl'
                          : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-40 bg-emerald-500" />
                      {/* Glossy 3D-style icon badge: base glow color + a soft highlight overlay for volume */}
                      <div className="icon-glow-emerald relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
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
      <section id="brands" className="px-5 sm:px-8 py-14 border-t border-emerald-50">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {getTranslation('landingBrandsTitle', lang)}
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-3 leading-relaxed">
            {getTranslation('landingBrandsSubtitle', lang)}
          </p>
        </div>

        {/* Continuous left-scrolling marquee — the track is the brand list rendered twice back
            to back, scrolled exactly -50% on a loop, so it wraps seamlessly. Pauses on hover. */}
        <div
          className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
          id="landing-brands-grid"
        >
          <div className="flex gap-5 w-max animate-marquee">
            {[...BRANDS, ...BRANDS].map((brand, idx) => (
              <div
                key={`${brand.name}-${idx}`}
                className="w-64 sm:w-72 shrink-0 flex flex-col rounded-3xl bg-white border-2 border-slate-100 hover:border-emerald-300 shadow-sm hover:shadow-[0_0_24px_2px_rgba(16,129,73,0.2)] transition-all duration-300 p-5"
              >
                <div className="w-full aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-6 mb-4">
                  {brand.file ? (
                    <img
                      src={`/brand-logos/${brand.file}`}
                      alt={brand.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">
                  {brand.category}
                </span>
                <h4 className="text-sm font-black text-slate-900 uppercase leading-tight mb-2">
                  {brand.name}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">
                  {brand.desc}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                    Active Division
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-5 sm:px-8 py-14 border-t border-emerald-50">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {getTranslation('landingContactTitle', lang)}
          </h2>
          <p className="text-sm text-slate-600 font-medium mt-3 leading-relaxed">
            {getTranslation('landingContactSubtitle', lang)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className={`rounded-2xl p-5 text-center ${CARD_GLOW}`}>
            <div className="icon-glow-emerald inline-flex p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 mb-2.5">
              <Phone className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{getTranslation('landingContactPhone', lang)}</div>
            <div className="text-sm font-bold text-slate-900 mt-1" id="landing-contact-phone">{CONTACT_PHONE}</div>
          </div>
          <div className={`rounded-2xl p-5 text-center ${CARD_GLOW}`}>
            <div className="icon-glow-emerald inline-flex p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 mb-2.5">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{getTranslation('landingContactEmail', lang)}</div>
            <div className="text-sm font-bold text-slate-900 mt-1 break-all" id="landing-contact-email">{CONTACT_EMAIL}</div>
          </div>
          <div className={`rounded-2xl p-5 text-center ${CARD_GLOW}`}>
            <div className="icon-glow-emerald inline-flex p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 mb-2.5">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{getTranslation('landingContactAddress', lang)}</div>
            <div className="text-sm font-bold text-slate-900 mt-1" id="landing-contact-address">{CONTACT_HUB}</div>
          </div>
        </div>
      </section>

      {/* Footer — black, per the reference site's own footer, with green accents throughout. */}
      <footer className="relative overflow-hidden px-5 sm:px-10 py-12 border-t border-emerald-900/40 bg-black">
        <div className="pointer-events-none absolute -top-24 -left-10 w-72 h-72 bg-emerald-600/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Logo, vision, socials */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="icon-glow-emerald w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-black text-lg tracking-tighter shadow-lg select-none shrink-0">
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
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/50 flex items-center justify-center text-slate-400 hover:text-emerald-300 transition-all"
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
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">{getTranslation('landingFooterPrivacy', lang)}</span>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">{getTranslation('landingFooterTerms', lang)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
