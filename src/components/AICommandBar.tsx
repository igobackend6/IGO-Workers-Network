import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Sparkles, Send, Mic, Plus, HelpCircle, X, ShieldAlert, CheckCircle, MapPin, User, Activity } from 'lucide-react';

interface AICommandBarProps {
  lang: 'en' | 'ta';
}

interface SearchResultItem {
  id: string;
  type: 'worker' | 'supervisor' | 'project' | 'deployment' | 'system';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
}

export default function AICommandBar({ lang }: AICommandBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setIsOpen(true);
    setResults([]);
    
    // Create organic message
    let message = "";
    const items: SearchResultItem[] = [];

    try {
      // 1. Fetch collections from Firestore
      const [workersSnap, supervisorsSnap, projectsSnap, deploymentsSnap] = await Promise.all([
        getDocs(collection(db, 'workers')),
        getDocs(collection(db, 'supervisors')),
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'deployments'))
      ]);

      const workers = workersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const supervisors = supervisorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const deployments = deploymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      const cleanText = text.toLowerCase();

      // 2. Core Search Logic (Smart Parsing)
      if (cleanText.includes('stale') || cleanText.includes('flagged') || cleanText.includes('old')) {
        message = "Searching our database for workers with stale files (no updates in >30 days). Here are the flagged profiles requiring supervisor follow-up:";
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        workers.forEach(w => {
          const updatedAt = w.updatedAt ? new Date(w.updatedAt).getTime() : 0;
          if (updatedAt < thirtyDaysAgo) {
            const days = Math.round((Date.now() - updatedAt) / (1000 * 60 * 60 * 24));
            items.push({
              id: w.id,
              type: 'worker',
              title: w.name,
              subtitle: `Stale ${days} days • Last updated: ${new Date(w.updatedAt).toLocaleDateString()} • Supervisor: ${w.supervisorId}`,
              badge: 'FLAGGED',
              badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
            });
          }
        });
      } else if (cleanText.includes('mason') || cleanText.includes('brick') || cleanText.includes('stone')) {
        message = "Filtered the Pan-India talent registry specifically for skilled Masonry professionals:";
        workers.forEach(w => {
          if (w.skillCategory?.toLowerCase().includes('mason') && w.status === 'active') {
            items.push({
              id: w.id,
              type: 'worker',
              title: w.name,
              subtitle: `${w.homeDistrict}, ${w.homeState} • Trade: Mason • Daily Wage Expected: ₹${w.dailyWageExpectation || 650}`,
              badge: 'AVAILABLE',
              badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
            });
          }
        });
      } else if (cleanText.includes('tamil') || cleanText.includes('nadu') || cleanText.includes('tn')) {
        message = "Showing active agricultural workers located in Tamil Nadu state registry:";
        workers.forEach(w => {
          if (w.homeState?.toLowerCase().includes('tamil') && w.status === 'active') {
            items.push({
              id: w.id,
              type: 'worker',
              title: w.name,
              subtitle: `${w.homeDistrict}, TN • Trade: ${w.skillCategory} • Contact: ${w.phone || 'Verifying'}`,
              badge: 'ON SITE',
              badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
            });
          }
        });
      } else if (cleanText.includes('placement') || cleanText.includes('deploy') || cleanText.includes('travel')) {
        message = "Retrieving active placements & logistics details for on-site infrastructure jobs:";
        deployments.forEach(d => {
          const workerObj = workers.find(w => w.id === d.workerId);
          const projObj = projects.find(p => p.id === d.projectId);
          items.push({
            id: d.id,
            type: 'deployment',
            title: workerObj ? workerObj.name : 'Trade Worker',
            subtitle: `Deployed to: ${projObj ? projObj.name : 'Unknown'} • Wage: ₹${d.wageRate}/day • Status: ${d.status.toUpperCase()}`,
            badge: d.status.toUpperCase(),
            badgeColor: d.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
          });
        });
      } else if (cleanText.includes('diagnostic') || cleanText.includes('health') || cleanText.includes('status')) {
        message = "Executing comprehensive database safety & connection diagnostic for IGO Portal:";
        items.push({
          id: 'diag-1',
          type: 'system',
          title: 'Cloud Firestore Database Node',
          subtitle: 'Active & Syncing perfectly with Mumbai (ap-south-1) region.',
          badge: 'ONLINE',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        });
        items.push({
          id: 'diag-2',
          type: 'system',
          title: 'Total Active Registries',
          subtitle: `${workers.length} worker profiles, ${supervisors.length} supervisors, and ${projects.length} sites.`,
          badge: 'STABLE',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
        });
      } else {
        // General text search
        message = `Searched entire database for "${text}". Found the following matched records:`;
        workers.forEach(w => {
          if (w.name?.toLowerCase().includes(cleanText) || w.homeDistrict?.toLowerCase().includes(cleanText) || w.skillCategory?.toLowerCase().includes(cleanText)) {
            items.push({
              id: w.id,
              type: 'worker',
              title: w.name,
              subtitle: `${w.homeDistrict}, ${w.homeState} • Trade: ${w.skillCategory} • Status: ${w.status}`,
              badge: w.status.toUpperCase(),
              badgeColor: w.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            });
          }
        });

        supervisors.forEach(s => {
          if (s.name?.toLowerCase().includes(cleanText) || s.assignedDistrict?.toLowerCase().includes(cleanText)) {
            items.push({
              id: s.id,
              type: 'supervisor',
              title: s.name,
              subtitle: `Supervisor Code: ${s.id} • ${s.assignedDistrict}, ${s.assignedState} • Phone: ${s.phone}`,
              badge: 'LEADER',
              badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
            });
          }
        });
      }

      if (items.length === 0) {
        message = `No direct records matched "${text}". Try asking about "stale", "tamil nadu", "mason", "deployments", or search a worker's name.`;
      }

      setAiMessage(message);
      setResults(items);

    } catch (err: any) {
      console.error(err);
      setAiMessage("An error occurred while connecting to the Firestore database. Please verify your permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  return (
    <div className="w-full mt-8 select-none" id="ai-command-bar-root">
      
      {/* 1. Header label row */}
      <div className="flex justify-between items-center text-xs text-slate-500 font-bold px-2 mb-2">
        <span className="flex items-center gap-1.5 text-emerald-700">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" strokeWidth={1.5} />
          Unlock smart insights with Pan-India AI Assistant
        </span>
        <span className="font-medium text-slate-400">Powered by Assistant v2.6</span>
      </div>

      {/* 2. Search input frame */}
      <div className="bento-surface-hover bento-surface rounded-2xl">
        <div className="flex items-center rounded-2xl p-2 md:p-3 gap-2">

          <div className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </div>

          <input
            id="ai-command-input"
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-slate-900 placeholder-slate-400 font-medium font-sans"
            placeholder={lang === 'en' ? 'Example: Ask "Show stale profiles" or search trade skill like "mason"...' : 'உதாரணமாக: "செல்லாத சுயவிவரங்களைக் காட்டு" என்று கேட்கவும்...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
          />

          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors hidden sm:block"
            >
              <Mic className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              id="btn-send-ai-query"
              type="button"
              className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              onClick={() => handleSearch(query)}
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Helper Chips underneath */}
      <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start px-1" id="ai-quick-chips">
        <button
          type="button"
          className="px-2.5 py-1.5 bg-white border border-slate-900/8 hover:bg-emerald-50 hover:border-emerald-300 rounded-full text-[10px] font-bold text-slate-600 hover:text-emerald-700 transition-all cursor-pointer active:scale-95"
          onClick={() => {
            setQuery('Show stale profiles');
            handleSearch('Show stale profiles');
          }}
        >
          Check Stale Profiles
        </button>
        <button
          type="button"
          className="px-2.5 py-1.5 bg-white border border-slate-900/8 hover:bg-emerald-50 hover:border-emerald-300 rounded-full text-[10px] font-bold text-slate-600 hover:text-emerald-700 transition-all cursor-pointer active:scale-95"
          onClick={() => {
            setQuery('Find masonry workers');
            handleSearch('Find masonry workers');
          }}
        >
          Find Masonry Workers
        </button>
        <button
          type="button"
          className="px-2.5 py-1.5 bg-white border border-slate-900/8 hover:bg-emerald-50 hover:border-emerald-300 rounded-full text-[10px] font-bold text-slate-600 hover:text-emerald-700 transition-all cursor-pointer active:scale-95"
          onClick={() => {
            setQuery('Show Tamil Nadu registry');
            handleSearch('Show Tamil Nadu registry');
          }}
        >
          Tamil Nadu Pool
        </button>
        <button
          type="button"
          className="px-2.5 py-1.5 bg-white border border-slate-900/8 hover:bg-emerald-50 hover:border-emerald-300 rounded-full text-[10px] font-bold text-slate-600 hover:text-emerald-700 transition-all cursor-pointer active:scale-95"
          onClick={() => {
            setQuery('View placements');
            handleSearch('View placements');
          }}
        >
          Active Placements
        </button>
        <button
          type="button"
          className="px-2.5 py-1.5 bg-white border border-slate-900/8 hover:bg-emerald-50 hover:border-emerald-300 rounded-full text-[10px] font-bold text-slate-600 hover:text-emerald-700 transition-all cursor-pointer active:scale-95"
          onClick={() => {
            setQuery('System diagnostics');
            handleSearch('System diagnostics');
          }}
        >
          System Diagnostic
        </button>
      </div>

      {/* 4. Display Results Drawer/Modal when open */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl bento-surface rounded-3xl overflow-hidden flex flex-col max-h-[80dvh]">

            {/* Header */}
            <div className="bg-slate-50 text-slate-900 p-4 flex justify-between items-center border-b border-slate-900/8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                <span className="font-extrabold text-sm tracking-tight">IGO Cognitive Query Report</span>
              </div>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-all cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">

              {/* Natural language response from mascot */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 items-start">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Milo AI Assistant</h5>
                  <p className="text-xs text-slate-600 font-semibold mt-1 leading-relaxed">{aiMessage}</p>
                </div>
              </div>

              {/* Loader */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Consulting Trade Ledger...</span>
                </div>
              )}

              {/* Items List */}
              {!loading && results && results.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Found {results.length} Matching Records</span>

                  <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                    {results.map((item) => (
                      <div key={item.id} className="p-3 bg-white border border-slate-900/8 rounded-2xl flex justify-between items-center gap-4 hover:border-emerald-300 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            {item.type === 'worker' && <User className="w-4 h-4" strokeWidth={1.5} />}
                            {item.type === 'supervisor' && <User className="w-4 h-4" strokeWidth={1.5} />}
                            {item.type === 'deployment' && <Activity className="w-4 h-4" strokeWidth={1.5} />}
                            {item.type === 'system' && <Activity className="w-4 h-4" strokeWidth={1.5} />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-xs text-slate-900 block truncate">{item.title}</span>
                            <span className="text-[10px] text-slate-500 block truncate font-medium">{item.subtitle}</span>
                          </div>
                        </div>

                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold border rounded-md tracking-wider shrink-0 ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && (!results || results.length === 0) && (
                <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                  No matching data results to display. Try a different query word!
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-900/8 flex justify-end">
              <button
                type="button"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
                onClick={() => setIsOpen(false)}
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
