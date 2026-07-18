import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Worker, Supervisor, Deployment, Project, UserProfile } from '../types';
import { db, collection, onSnapshot } from '../firebase';
import { getTranslation } from '../translations';
import CeoView from './CeoView';
import {
  Crown, Users2, Briefcase, HardHat, Award, MapPin, Phone, ChevronRight, Cake, IdCard, Search
} from 'lucide-react';

interface AdminViewProps {
  user: UserProfile;
  lang: 'en' | 'ta';
}

type AdminTab = 'supervisor' | 'hr' | 'workers' | 'ceo';

export default function AdminView({ user, lang }: AdminViewProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('supervisor');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [supervisorSearchQuery, setSupervisorSearchQuery] = useState('');
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');

  // Subscribe to collections in real time (mirrors the read pattern used across the other portals)
  useEffect(() => {
    const unsubWorkers = onSnapshot(collection(db, 'workers'), (snapshot) => {
      const list: Worker[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Worker;
        if (data.status === 'active') list.push(data);
      });
      setWorkers(list);
    });

    const unsubSupervisors = onSnapshot(collection(db, 'supervisors'), (snapshot) => {
      const list: Supervisor[] = [];
      snapshot.forEach((doc) => list.push(doc.data() as Supervisor));
      setSupervisors(list);
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((doc) => list.push(doc.data() as Project));
      setProjects(list);
    });

    const unsubDeployments = onSnapshot(collection(db, 'deployments'), (snapshot) => {
      const list: Deployment[] = [];
      snapshot.forEach((doc) => list.push(doc.data() as Deployment));
      setDeployments(list);
    });

    return () => {
      unsubWorkers();
      unsubSupervisors();
      unsubProjects();
      unsubDeployments();
    };
  }, []);

  // Re-validate the selected supervisor/worker against the live list (avoids locking onto a stale/deleted id)
  useEffect(() => {
    if (selectedSupervisorId && !supervisors.some(s => s.id === selectedSupervisorId)) {
      setSelectedSupervisorId(null);
    }
  }, [supervisors, selectedSupervisorId]);

  useEffect(() => {
    if (selectedWorkerId && !workers.some(w => w.id === selectedWorkerId)) {
      setSelectedWorkerId(null);
    }
  }, [workers, selectedWorkerId]);

  const deployedWorkersForProject = (projectId: string) =>
    deployments
      .filter(d => d.projectId === projectId && (d.status === 'confirmed' || d.status === 'active'))
      .map(d => workers.find(w => w.id === d.workerId))
      .filter((w): w is Worker => !!w);

  const workersAssignedToProject = (projectId: string) => deployedWorkersForProject(projectId).length;

  const selectedSupervisor = supervisors.find(s => s.id === selectedSupervisorId) || null;
  const selectedSupervisorProjects = selectedSupervisor
    ? projects.filter(p => p.assignedSupervisorId === selectedSupervisor.id)
    : [];

  const selectedWorker = workers.find(w => w.id === selectedWorkerId) || null;
  const selectedWorkerSupervisor = selectedWorker
    ? supervisors.find(s => s.id === selectedWorker.supervisorId) || null
    : null;
  const selectedWorkerDeployment = selectedWorker
    ? deployments.find(d => d.workerId === selectedWorker.id && (d.status === 'confirmed' || d.status === 'active'))
    : null;
  const selectedWorkerProject = selectedWorkerDeployment
    ? projects.find(p => p.id === selectedWorkerDeployment.projectId) || null
    : null;

  const availableCount = workers.filter(w => w.availability === 'available').length;
  const deployedCount = workers.filter(w => w.availability === 'deployed').length;
  const unavailableCount = workers.filter(w => w.availability === 'unavailable').length;

  const filteredSupervisors = supervisors.filter((s) => {
    const q = supervisorSearchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q)
      || s.phone.includes(supervisorSearchQuery)
      || s.assignedDistrict.toLowerCase().includes(q)
      || s.assignedState.toLowerCase().includes(q);
  });

  const filteredWorkers = workers.filter((w) => {
    const q = workerSearchQuery.toLowerCase();
    return w.name.toLowerCase().includes(q)
      || w.phone.includes(workerSearchQuery)
      || w.skill.toLowerCase().includes(q)
      || w.homeDistrict.toLowerCase().includes(q)
      || w.homeState.toLowerCase().includes(q);
  });

  const NAV_ITEMS: Array<{ tab: AdminTab; labelKey: string; icon: React.ReactNode }> = [
    { tab: 'supervisor', labelKey: 'navSupervisor', icon: <Users2 className="w-4 h-4" /> },
    { tab: 'hr', labelKey: 'navHr', icon: <Briefcase className="w-4 h-4" /> },
    { tab: 'workers', labelKey: 'navWorkers', icon: <HardHat className="w-4 h-4" /> },
    { tab: 'ceo', labelKey: 'navCeo', icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 text-slate-900 font-sans" id="admin-portal-root">

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bento-surface text-slate-900 p-5 rounded-3xl mb-6"
      >
        <div className="pointer-events-none absolute -bottom-16 right-10 w-52 h-52 bg-emerald-400/8 rounded-full blur-3xl animate-blob animation-delay-2000" />

        <div className="relative z-10">
          <span className="text-xs font-black text-emerald-700 uppercase tracking-widest block">Pan-India Oversight</span>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1 uppercase tracking-tight">
            <span className="icon-badge-emerald inline-flex p-2 rounded-xl">
              <Crown className="w-5 h-5 shrink-0" strokeWidth={1.5} />
            </span>
            {getTranslation('adminOverviewTitle', lang)}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">
            Logged in: <strong className="text-emerald-700 font-bold">{user.name}</strong> • Cross-portal overview.
          </p>
        </div>
      </motion.div>

      {/* Left-panel nav + content */}
      <div className="flex flex-col md:flex-row gap-6">
        <nav className="flex md:flex-col gap-2 md:w-52 shrink-0" id="admin-side-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.tab}
              type="button"
              id={`admin-nav-${item.tab}`}
              onClick={() => setActiveTab(item.tab)}
              className={`flex-1 md:flex-none flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                activeTab === item.tab
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-900/8 hover:text-slate-800 hover:border-slate-900/15'
              }`}
            >
              {item.icon}
              {getTranslation(item.labelKey, lang)}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          {/* --- SUPERVISOR TAB --- */}
          {activeTab === 'supervisor' && (
            <div className="space-y-4" id="admin-tab-supervisor">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="bg-white border border-slate-900/8 rounded-2xl p-4 flex items-center gap-4 shadow-sm shrink-0">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200">
                    <Users2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                      {getTranslation('totalSupervisorsRegistered', lang)}
                    </span>
                    <span className="text-2xl font-black text-slate-900 font-mono" id="admin-supervisor-count">{supervisors.length}</span>
                  </div>
                </div>
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="admin-supervisor-search"
                    type="text"
                    placeholder="Search supervisors by name, phone or area..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-900/8 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    value={supervisorSearchQuery}
                    onChange={(e) => setSupervisorSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-2.5" id="admin-supervisor-list">
                  {filteredSupervisors.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-900/8 text-xs font-bold text-slate-400">
                      {supervisors.length === 0 ? 'No supervisors registered yet.' : 'No supervisors match your search.'}
                    </div>
                  ) : (
                    filteredSupervisors.map((sup) => (
                      <button
                        key={sup.id}
                        type="button"
                        onClick={() => setSelectedSupervisorId(sup.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedSupervisorId === sup.id
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-slate-50 border-slate-900/6 hover:border-slate-900/10'
                        }`}
                      >
                        {sup.profilePhotoUrl ? (
                          <img src={sup.profilePhotoUrl} alt={sup.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-900/8" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">
                            {sup.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">{sup.name}</h4>
                          <p className="text-[10px] text-slate-500 font-bold truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {sup.assignedDistrict}, {sup.assignedState}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </button>
                    ))
                  )}
                </div>

                <div id="admin-supervisor-detail">
                  {!selectedSupervisor ? (
                    <div className="bg-white border border-dashed border-slate-900/8 rounded-3xl p-8 text-center text-slate-400 shadow-sm">
                      <Users2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold leading-relaxed">Select a supervisor to view their assigned project and worker counts.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-900/8 rounded-3xl p-5 space-y-4 shadow-sm">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{selectedSupervisor.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> +91 {selectedSupervisor.phone}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {selectedSupervisor.assignedDistrict}, {selectedSupervisor.assignedState}
                        </p>
                      </div>

                      <div className="pt-3 border-t-2 border-slate-900/6">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black mb-2">Assigned Projects ({selectedSupervisorProjects.length})</span>
                        {selectedSupervisorProjects.length === 0 ? (
                          <p className="text-[11px] text-slate-500 font-semibold">No project currently assigned to this supervisor.</p>
                        ) : (
                          <div className="space-y-2" id="admin-supervisor-assigned-projects">
                            {selectedSupervisorProjects.map((proj) => (
                              <div key={proj.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-900/6">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-extrabold text-xs text-slate-900">{proj.name}</h4>
                                  <span className="text-[9px] font-black text-emerald-600 uppercase">{proj.status}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />{proj.locationDistrict}, {proj.locationState}</p>
                                <p className="text-[10px] text-emerald-700 font-black mt-1">
                                  {getTranslation('assignedProjectWorkers', lang)}: {workersAssignedToProject(proj.id)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- HR TAB --- */}
          {activeTab === 'hr' && (
            <div className="space-y-4" id="admin-tab-hr">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-900/8 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                      {getTranslation('totalSupervisorsRegistered', lang)}
                    </span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{supervisors.length}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-900/8 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Ongoing Projects</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{projects.filter(p => p.status === 'active').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-900/8 rounded-3xl p-5 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  {getTranslation('supervisorProjectOverview', lang)}
                </h3>
                <div className="space-y-3" id="admin-hr-projects-list">
                  {projects.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-900/8 text-xs font-bold text-slate-400">
                      No projects created yet.
                    </div>
                  ) : (
                    projects.map((proj) => {
                      const supervisor = supervisors.find(s => s.id === proj.assignedSupervisorId) || null;
                      const assignedWorkers = deployedWorkersForProject(proj.id);
                      return (
                        <div key={proj.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-900/6">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-900">{proj.name}</h4>
                              <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {proj.locationDistrict}, {proj.locationState}
                              </p>
                            </div>
                            <span className="text-[9px] font-black text-emerald-600 uppercase shrink-0">{proj.status}</span>
                          </div>

                          <p className="text-[10px] text-emerald-700 font-black mt-2">
                            Supervisor: <span className="text-slate-900 font-bold">{supervisor ? supervisor.name : 'Unassigned'}</span>
                          </p>

                          <div className="pt-2 mt-2 border-t border-slate-900/6">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-black block mb-1.5">
                              {getTranslation('assignedProjectWorkers', lang)} ({assignedWorkers.length})
                            </span>
                            {assignedWorkers.length === 0 ? (
                              <p className="text-[10px] text-slate-500 font-semibold">No workers currently assigned to this project.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {assignedWorkers.map((w) => (
                                  <span key={w.id} className="text-[10px] font-bold text-slate-700 bg-white border border-slate-900/8 rounded-lg px-2 py-1">
                                    {w.name} <span className="text-slate-500">· {w.skill}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- WORKERS TAB --- */}
          {activeTab === 'workers' && (
            <div className="space-y-4" id="admin-tab-workers">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="bg-white border border-slate-900/8 rounded-2xl p-4 flex items-center gap-4 shadow-sm shrink-0">
                  <div className="icon-badge-emerald p-3 rounded-2xl">
                    <HardHat className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                      {getTranslation('totalWorkersRegisteredSoFar', lang)}
                    </span>
                    <span className="text-2xl font-black text-slate-900 font-mono" id="admin-workers-count">{workers.length}</span>
                  </div>
                </div>
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="admin-workers-search"
                    type="text"
                    placeholder="Search workers by name, skill, phone or location..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-900/8 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    value={workerSearchQuery}
                    onChange={(e) => setWorkerSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-900/8 rounded-2xl p-3 text-center">
                  <span className="text-lg font-black text-emerald-600 block">{availableCount}</span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Available</span>
                </div>
                <div className="bg-white border border-slate-900/8 rounded-2xl p-3 text-center">
                  <span className="text-lg font-black text-emerald-700 block">{deployedCount}</span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Deployed</span>
                </div>
                <div className="bg-white border border-slate-900/8 rounded-2xl p-3 text-center">
                  <span className="text-lg font-black text-slate-400 block">{unavailableCount}</span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Unavailable</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-900/8 rounded-3xl p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">All Registered Workers</h3>
                  <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1" id="admin-workers-list">
                    {filteredWorkers.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-900/8 text-xs font-bold text-slate-400">
                        {workers.length === 0 ? 'No workers registered yet.' : 'No workers match your search.'}
                      </div>
                    ) : filteredWorkers.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWorkerId(w.id)}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedWorkerId === w.id
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-slate-50 border-slate-900/6 hover:border-slate-900/10'
                        }`}
                      >
                        <img src={w.profilePhotoUrl} alt={w.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-900/8" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <span className="font-extrabold text-xs text-slate-900 block truncate">{w.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{w.skill} • {w.homeDistrict}, {w.homeState}</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg shrink-0 ${
                          w.availability === 'available' ? 'bg-emerald-100 text-emerald-700' :
                          w.availability === 'deployed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {w.availability}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div id="admin-worker-detail">
                  {!selectedWorker ? (
                    <div className="bg-white border border-dashed border-slate-900/8 rounded-3xl p-8 text-center text-slate-400 shadow-sm">
                      <HardHat className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold leading-relaxed">Select a worker to view their full details.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-900/8 rounded-3xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-center gap-3 border-b border-slate-900/6 pb-3">
                        <img src={selectedWorker.profilePhotoUrl} alt={selectedWorker.name} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-900/8" referrerPolicy="no-referrer" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 truncate">{selectedWorker.name}</h3>
                          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">{selectedWorker.skill}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" /> +91 {selectedWorker.phone}
                        </p>
                        <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5">
                          <Cake className="w-3.5 h-3.5 text-slate-500" /> {selectedWorker.age} years
                        </p>
                        <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" /> {selectedWorker.homeDistrict}, {selectedWorker.homeState}
                        </p>
                        <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5">
                          <IdCard className="w-3.5 h-3.5 text-slate-500" /> {selectedWorker.idProofType}
                        </p>
                      </div>

                      <div className="pt-3 border-t-2 border-slate-900/6 space-y-1.5">
                        <p className="text-[10px] text-slate-500 font-bold">
                          Registered by supervisor: <span className="text-slate-700 font-extrabold">{selectedWorkerSupervisor ? selectedWorkerSupervisor.name : 'Unknown'}</span>
                        </p>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black pt-1">Currently Assigned Project</span>
                        {selectedWorkerProject ? (
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-900/6">
                            <h4 className="font-extrabold text-xs text-slate-900">{selectedWorkerProject.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />{selectedWorkerProject.locationDistrict}, {selectedWorkerProject.locationState}</p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 font-semibold">Not currently assigned to any project.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- CEO TAB (embeds the same analytical dashboard as the standalone CEO Portal) --- */}
          {activeTab === 'ceo' && (
            <div id="admin-tab-ceo" className="-mx-4 md:-mx-6">
              <CeoView user={user} lang={lang} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
