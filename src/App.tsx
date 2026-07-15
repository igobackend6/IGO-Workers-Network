import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { getTranslation } from './translations';
import LoginView from './components/LoginView';
import LandingPage from './components/LandingPage';
import SupervisorView from './components/SupervisorView';
import HrView from './components/HrView';
import AdminView from './components/AdminView';
import CeoView from './components/CeoView';
import MascotRobot from './components/MascotRobot';
import AICommandBar from './components/AICommandBar';
import { 
  Globe, 
  LogOut, 
  Shield, 
  Plus, 
  Search, 
  Compass, 
  LayoutGrid, 
  History, 
  ChevronDown, 
  Sparkles,
  Info
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'search' | 'info'>('dashboard');
  const [showInfoModal, setShowInfoModal] = useState(false);
  // Returning staff with a saved session skip straight past the marketing page.
  const [showLanding, setShowLanding] = useState(() => !localStorage.getItem('igo_user'));

  // 1. Initialize and Restore session on first startup
  useEffect(() => {
    const savedUser = localStorage.getItem('igo_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('igo_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('igo_user');
  };

  // Dynamic mascot message depending on role
  const getMascotMessage = () => {
    if (!currentUser) {
      return lang === 'en' 
        ? "Please sign in to access secure trade ledgers!" 
        : "பாதுகாப்பான கணக்கீடுகளை அணுக உள்நுழையவும்!";
    }
    if (currentUser.role === 'supervisor') {
      return lang === 'en'
        ? "Welcome, Selvam! Ready to verify Aadhaar files?"
        : "செல்வம்! ஆதார் கோப்புகளை சரிபார்க்க தயாரா?";
    }
    if (currentUser.role === 'hr') {
      return lang === 'en'
        ? "Deepak, let's optimize today's travel routes!"
        : "தீபக், பயண வழிகளை மேம்படுத்துவோம்!";
    }
    if (currentUser.role === 'admin') {
      return lang === 'en'
        ? "Admin Desk: Here's the full Pan-India overview."
        : "நிர்வாக அலுவலகம்: அகில இந்திய கண்ணோட்டம் தயார்.";
    }
    return lang === 'en'
      ? "CEO Desk: Database performance is exceptionally green."
      : "தலைமை அலுவலகம்: தரவுத்தளம் மிகவும் சீராக உள்ளது.";
  };

  return (
    <div
      id="app-wrapper"
      className="min-h-screen bg-gradient-mesh flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative"
    >
      {/* Ambient decorative background accents — deep emerald glow drifting over the dark canvas */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[420px] h-[420px] bg-emerald-500/15 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[480px] h-[480px] bg-emerald-500/12 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] right-[15%] w-[320px] h-[320px] bg-emerald-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {showLanding ? (
        <LandingPage lang={lang} setLang={setLang} onEnterPortal={() => setShowLanding(false)} />
      ) : (
      <div
        id="main-glass-console"
        className="w-full max-w-7xl glass-panel rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[92vh] border border-white/10 animate-fadeIn"
      >

        {/* LEFT WORKSPACE SIDEBAR - Matching image perfectly */}
        <aside
          id="workspace-sidebar"
          className="w-full md:w-[84px] bg-black/20 backdrop-blur-md border-b md:border-b-0 md:border-r border-white/10 p-4 flex md:flex-col justify-between items-center shrink-0 gap-4"
        >
          {/* Top Button List */}
          <div className="flex md:flex-col gap-3.5 items-center">
            {/* Plus / Quick Actions Button */}
            <button
              type="button"
              className="icon-glow-emerald w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer active:scale-95"
              onClick={() => setShowInfoModal(true)}
              title="System Overview"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Search Icon */}
            <button
              type="button"
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                activeTab === 'search'
                  ? 'icon-glow-emerald bg-emerald-600 text-white shadow-lg'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 shadow-sm border border-white/10'
              }`}
              onClick={() => {
                setActiveTab('search');
                // Scroll bottom for prompt bar
                const inputEl = document.getElementById('ai-command-input');
                if (inputEl) inputEl.focus();
              }}
              title="AI Cognitive Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Compass Explorer / Language Toggle */}
            <button
              type="button"
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 hover:rotate-45"
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              title="Switch Language"
            >
              <Compass className="w-5 h-5 text-emerald-400" />
            </button>

            {/* Layout Grid / Active view indicator */}
            <button
              type="button"
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                activeTab === 'dashboard'
                  ? 'icon-glow-emerald bg-emerald-600 text-white shadow-lg'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 shadow-sm border border-white/10'
              }`}
              onClick={() => setActiveTab('dashboard')}
              title="Workspace Dashboard"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            {/* History logs / Database diagnostic info */}
            <button
              type="button"
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
              onClick={() => {
                setActiveTab('search');
                setTimeout(() => {
                  const inputEl = document.getElementById('ai-command-input');
                  if (inputEl) {
                    (inputEl as HTMLInputElement).value = 'System diagnostics';
                    const sendBtn = document.getElementById('btn-send-ai-query');
                    if (sendBtn) sendBtn.click();
                  }
                }, 100);
              }}
              title="Audit Logs"
            >
              <History className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Styled Logo - Beautiful custom logo matching "N" from image */}
          <div className="flex items-center gap-2 md:flex-col md:gap-0">
            {currentUser && (
              <button
                type="button"
                className="icon-glow-rose w-10 h-10 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-all cursor-pointer shadow-sm md:mb-4 active:scale-95"
                onClick={handleLogout}
                title="Log Out Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            <div className="icon-glow-emerald w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white font-black text-lg tracking-tighter shadow-lg select-none hover:rotate-6 transition-transform">
              I
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN WORKSPACE PANELS */}
        <main className="flex-1 p-4 md:p-8 flex flex-col justify-between overflow-y-auto min-h-0 bg-black/10">
          
          {/* A. WORKSPACE TOP ACTION BAR */}
          <header id="console-header" className="flex justify-between items-center mb-6 md:mb-10 shrink-0">
            {/* Left: Dropdown picker */}
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 cursor-pointer shadow-sm hover:bg-white/10 hover:border-emerald-500/40 transition-all select-none animate-fadeIn">
              <span className="icon-glow-emerald flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              </span>
              <span className="text-xs font-extrabold text-slate-100 tracking-tight">IGO Portal v2.6</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Center: Title info */}
            <div className="hidden sm:block text-center animate-fadeIn delay-100">
              <span className="text-[10px] text-emerald-400 font-extrabold tracking-widest block uppercase">Agri-Infrastructure System</span>
              <span className="text-xs font-black text-slate-100">Pan-India Labor Logistics</span>
            </div>

            {/* Right: Premium Status Badge */}
            <div className="flex items-center gap-2 animate-fadeIn delay-200">
              <div className="hidden lg:flex flex-col text-right text-[10px] leading-tight mr-1">
                <span className="font-extrabold text-slate-300">Database Status</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Sync
                </span>
              </div>
              <button
                type="button"
                className="icon-glow-amber animate-glow-ring px-4 py-2 bg-black/40 hover:bg-black/60 text-white text-xs font-extrabold rounded-full shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-white/10"
                onClick={() => setShowInfoModal(true)}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Pan-India Secure</span>
              </button>
            </div>
          </header>

          {/* B. MAIN DISPLAY MESSAGE WITH MASCOT */}
          <section id="greeting-section" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0 relative">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none font-display">
                Hi {currentUser ? currentUser.name.split(' ')[0] : 'Partner'},
              </h1>
              <p className="text-base md:text-lg text-slate-300 font-medium mt-1 font-sans">
                {currentUser
                  ? (lang === 'en' ? 'Ready to Achieve Great Things?' : 'பெரிய காரியங்களைச் செய்யத் தயாரா?')
                  : (lang === 'en' ? 'Ready to explore the trade registry?' : 'வர்த்தகப் பதிவேட்டை ஆராயத் தயாரா?')}
              </p>
            </div>

            {/* Beautiful Interactive Robot mascot */}
            <MascotRobot message={getMascotMessage()} />
          </section>

          {/* C. ACTIVE PANEL INJECTION (Login or Roles) */}
          <section id="active-content-stage" className="flex-1 w-full min-h-0">
            {!currentUser ? (
              <LoginView lang={lang} onLoginSuccess={handleLoginSuccess} onBackToHome={() => setShowLanding(true)} />
            ) : (
              <div className="w-full h-full animate-fadeIn" id="active-role-component">
                {currentUser.isSandbox && (
                  <div className="mb-6 p-4 bg-amber-500/10 backdrop-blur-sm border border-amber-500/25 rounded-2xl text-slate-100 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-500 rounded-xl text-white shrink-0 mt-0.5">
                        <Info className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <p className="font-black text-white uppercase tracking-wider text-[10px]">
                          ⚡ Real-Time Sandbox Active
                        </p>
                        <p className="text-slate-300 text-[11px] font-semibold mt-1 leading-relaxed">
                          Firebase Email/Password provider is disabled in your project console. The system has automatically shifted to high-fidelity offline emulation mode. Your edits will save instantly to browser localStorage.
                        </p>
                      </div>
                    </div>
                    <div className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest leading-none shrink-0 self-end sm:self-center">
                      Local Sync Engaged
                    </div>
                  </div>
                )}

                {currentUser.role === 'supervisor' && (
                  <SupervisorView user={currentUser} lang={lang} />
                )}
                {currentUser.role === 'hr' && (
                  <HrView user={currentUser} lang={lang} />
                )}
                {currentUser.role === 'admin' && (
                  <AdminView user={currentUser} lang={lang} />
                )}
                {currentUser.role === 'ceo' && (
                  <CeoView user={currentUser} lang={lang} />
                )}
              </div>
            )}
          </section>

          {/* D. INTERACTIVE BOTTOM AI COMMAND BAR */}
          <footer className="mt-8 shrink-0">
            <AICommandBar lang={lang} />
          </footer>

        </main>
      </div>
      )}

      {/* Info Overview modal panel */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md glass-card border border-white/10 rounded-3xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              IGO PAN-INDIA SECURITY COMPLIANCE
            </h3>

            <div className="mt-4 space-y-3 text-xs text-slate-300 font-semibold leading-relaxed">
              <p>
                This terminal runs under fully verified <strong className="text-slate-100">Pan-India Infrastructure Governance</strong> protocols. All data transactions sync in real-time with our secure <strong className="text-slate-100">Google Cloud Firestore</strong> databases in the Mumbai cluster.
              </p>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <span className="text-[10px] font-black text-emerald-300 block uppercase tracking-widest">Active Network Nodes</span>
                <ul className="mt-1 space-y-1 text-[11px] text-slate-300">
                  <li>• Tamil Nadu (Madurai District Ledger)</li>
                  <li>• Karnataka (Hubli Agricultural Node)</li>
                  <li>• Central Compliance Desk (Mumbai Core)</li>
                </ul>
              </div>
              <p>
                We employ dual-layer validation for Aadhaar files, travel allowance clearances, and contractor daily disbursements.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer active:scale-95"
                onClick={() => setShowInfoModal(false)}
              >
                Acknowledge Safety
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
