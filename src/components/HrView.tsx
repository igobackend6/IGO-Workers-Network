import React, { useState, useEffect } from 'react';
import { Worker, Project, Deployment, Supervisor, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType, collection, onSnapshot, doc, setDoc, updateDoc } from '../firebase';
import { getTranslation } from '../translations';
import { STATES_AND_DISTRICTS, SKILL_CATEGORIES } from '../data';
import { 
  Search, Filter, Calendar, MapPin, Briefcase, Phone, 
  User, CheckCircle, ArrowRight, Table, Grid, Plus, Check, X, AlertCircle
} from 'lucide-react';

interface HrViewProps {
  user: UserProfile;
  lang: 'en' | 'ta';
}

export default function HrView({ user, lang }: HrViewProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkill, setFilterSkill] = useState('All');
  const [filterState, setFilterState] = useState('All');
  const [filterAvailability, setFilterAvailability] = useState('All');

  // UI Selection states
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [viewMode, setViewMode] = useState<'workers' | 'deployments' | 'projects'>('workers');

  // Deployment Form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Project Creation State
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectState, setNewProjectState] = useState('Tamil Nadu');
  const [newProjectDistrict, setNewProjectDistrict] = useState('Chennai');
  const [newProjectSkills, setNewProjectSkills] = useState<string[]>([]);

  // 1. Subscribe to Collections in Real Time
  useEffect(() => {
    const unsubWorkers = onSnapshot(collection(db, 'workers'), (snapshot) => {
      const list: Worker[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Worker;
        if (data.status === 'active') {
          list.push(data);
        }
      });
      setWorkers(list);
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Project);
      });
      setProjects(list);
    });

    const unsubDeployments = onSnapshot(collection(db, 'deployments'), (snapshot) => {
      const list: Deployment[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Deployment);
      });
      setDeployments(list);
    });

    const unsubSupervisors = onSnapshot(collection(db, 'supervisors'), (snapshot) => {
      const list: Supervisor[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Supervisor);
      });
      setSupervisors(list);
    });

    return () => {
      unsubWorkers();
      unsubProjects();
      unsubDeployments();
      unsubSupervisors();
    };
  }, []);

  // Set first project by default when deploying form opens
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // 2. Submit Deployment Request to Area Supervisor
  const handleSubmitDeploymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || !selectedProjectId || !startDate || !endDate) {
      setFormError('Please fill in all fields.');
      return;
    }
    setFormError('');
    setSubmitting(true);

    const deploymentId = "dep-" + Date.now();
    const newDeployment: Deployment = {
      id: deploymentId,
      workerId: selectedWorker.id,
      projectId: selectedProjectId,
      requestedBy: user.name,
      status: 'requested',
      startDate,
      endDate
    };

    try {
      await setDoc(doc(db, 'deployments', deploymentId), newDeployment);
      alert(lang === 'en' ? 'Deployment request sent to worker\'s supervisor!' : 'பணி அமர்த்தல் கோரிக்கை மேற்பார்வையாளருக்கு அனுப்பப்பட்டது!');
      setIsDeploying(false);
      setStartDate('');
      setEndDate('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `deployments/${deploymentId}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Create a Project directly (Staff privilege)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || newProjectSkills.length === 0) {
      alert('Please fill project name and select at least one required skill.');
      return;
    }

    const projectId = "proj-" + Date.now();
    const newProj: Project = {
      id: projectId,
      name: newProjectName,
      locationState: newProjectState,
      locationDistrict: newProjectDistrict,
      status: 'active',
      requiredSkills: newProjectSkills
    };

    try {
      await setDoc(doc(db, 'projects', projectId), newProj);
      setNewProjectName('');
      setNewProjectSkills([]);
      setIsAddingProject(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}`);
    }
  };

  const toggleRequiredSkill = (skillName: string) => {
    if (newProjectSkills.includes(skillName)) {
      setNewProjectSkills(newProjectSkills.filter(s => s !== skillName));
    } else {
      setNewProjectSkills([...newProjectSkills, skillName]);
    }
  };

  // 4. Update existing deployment status directly (e.g. mark as Completed / Active once confirmed)
  const handleUpdateDeploymentStatus = async (depId: string, status: 'active' | 'completed' | 'cancelled') => {
    try {
      const depRef = doc(db, 'deployments', depId);
      await updateDoc(depRef, { status });

      const dep = deployments.find(d => d.id === depId);
      if (dep && status === 'completed') {
        // Free the worker, make available again
        const workerRef = doc(db, 'workers', dep.workerId);
        await updateDoc(workerRef, {
          availability: 'available',
          lastUpdatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deployments/${depId}`);
    }
  };

  // 5. Query Filters Logic
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          worker.skill.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = filterSkill === 'All' || worker.skill === filterSkill;
    const matchesState = filterState === 'All' || worker.homeState === filterState;
    const matchesAvailability = filterAvailability === 'All' || worker.availability === filterAvailability;

    return matchesSearch && matchesSkill && matchesState && matchesAvailability;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 text-slate-800 font-sans" id="hr-portal-root">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-5 rounded-3xl border-b-4 border-amber-500 mb-6 shadow-md">
        <div>
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">IGO Group Pan-India System</span>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1 uppercase tracking-tight">
            <Briefcase className="w-6 h-6 text-amber-400 shrink-0" />
            {getTranslation('roleHR', lang)} Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Logged in as <strong className="text-amber-400 font-bold">{user.name}</strong> • Active registry overview.
          </p>
        </div>

        {/* View switcher tabs */}
        <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 self-stretch md:self-auto shrink-0 shadow-inner">
          <button
            type="button"
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'workers' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => { setViewMode('workers'); setSelectedWorker(null); }}
          >
            <User className="w-4 h-4" />
            Workers Pool
          </button>
          <button
            type="button"
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'deployments' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => { setViewMode('deployments'); setSelectedWorker(null); }}
          >
            <Calendar className="w-4 h-4" />
            Placements & Status
          </button>
          <button
            type="button"
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'projects' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => { setViewMode('projects'); setSelectedWorker(null); }}
          >
            <MapPin className="w-4 h-4" />
            IGO Projects
          </button>
        </div>
      </div>

      {/* --- WORKERS POOL VIEW --- */}
      {viewMode === 'workers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-start" id="hr-workers-registry">
          
          {/* Filters & Results Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 space-y-4 shadow-sm">
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder={getTranslation('searchPlaceholder', lang)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Multi Filters Dropdowns */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Skill</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                    value={filterSkill}
                    onChange={(e) => setFilterSkill(e.target.value)}
                  >
                    <option value="All">All Skills</option>
                    {SKILL_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Home State</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                  >
                    <option value="All">All States</option>
                    {Object.keys(STATES_AND_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Status</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                    value={filterAvailability}
                    onChange={(e) => setFilterAvailability(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="available">Available</option>
                    <option value="deployed">Deployed</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Matching Workers ({filteredWorkers.length} found)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="hr-workers-grid">
                {filteredWorkers.map((worker) => {
                  const isSel = selectedWorker?.id === worker.id;
                  return (
                    <div
                      key={worker.id}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex gap-3 items-center relative ${
                        isSel 
                          ? 'bg-indigo-50/50 border-indigo-600 shadow-md shadow-indigo-500/10' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => { setSelectedWorker(worker); setIsDeploying(false); }}
                    >
                      <img
                        src={worker.profilePhotoUrl}
                        alt={worker.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-extrabold text-sm truncate ${isSel ? 'text-indigo-900' : 'text-slate-900'}`}>{worker.name}</h4>
                        <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider mt-0.5 truncate">{worker.skill}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-semibold">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {worker.homeDistrict}, {worker.homeState}
                        </p>
                      </div>

                      {/* Availability status */}
                      <div className="shrink-0">
                        {worker.availability === 'available' ? (
                          <span className="inline-block px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-lg">Available</span>
                        ) : worker.availability === 'deployed' ? (
                          <span className="inline-block px-2 py-0.5 bg-indigo-100 border border-indigo-200 text-indigo-800 text-[9px] font-black uppercase tracking-wider rounded-lg">Deployed</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider rounded-lg">Unavailable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Read-Only Profile & Deployment Request Column */}
          <div className="space-y-4">
            {selectedWorker ? (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-5 sticky top-6 shadow-md" id="hr-worker-detail-pane">
                
                {/* Visual Header */}
                <div className="flex items-start gap-3 border-b-2 border-slate-100 pb-4">
                  <img
                    src={selectedWorker.profilePhotoUrl}
                    alt={selectedWorker.name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-base font-black text-slate-900 leading-tight">{selectedWorker.name}</h2>
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-widest mt-0.5 block">{selectedWorker.skill}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-bold">Native: {selectedWorker.homeDistrict}, {selectedWorker.homeState}</p>
                  </div>
                </div>

                {/* Personal particulars */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b-2 border-slate-100">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone:</span>
                    <span className="font-extrabold font-mono text-slate-800">+91 {selectedWorker.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b-2 border-slate-100">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Age:</span>
                    <span className="font-extrabold text-slate-800">{selectedWorker.age} years</span>
                  </div>
                  <div className="flex justify-between py-1 border-b-2 border-slate-100 font-semibold">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">ID proof verified:</span>
                    <span className="font-extrabold text-emerald-600 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      {selectedWorker.idProofType}
                    </span>
                  </div>
                </div>

                {/* Supervisor Relationship (Owner) */}
                {(() => {
                  const sup = supervisors.find(s => s.id === selectedWorker.supervisorId);
                  return (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-1 shadow-inner">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">Captured By Supervisor</span>
                      <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        {sup ? sup.name : 'Selvam Swamy'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono font-bold">
                        <Phone className="w-3 h-3 text-slate-400" />
                        +91 {sup ? sup.phone : '9876543210'}
                      </div>
                    </div>
                  );
                })()}

                {/* Submit Deployment button */}
                {!isDeploying ? (
                  <button
                    id="btn-trigger-deploy-form"
                    type="button"
                    disabled={selectedWorker.availability !== 'available'}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md active:translate-y-0.5 active:border-b-0 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                    onClick={() => setIsDeploying(true)}
                  >
                    <Calendar className="w-4 h-4 stroke-[2.5]" />
                    {getTranslation('requestWorkerBtn', lang)}
                  </button>
                ) : (
                  <form onSubmit={handleSubmitDeploymentRequest} className="space-y-4 pt-4 border-t-2 border-slate-100 animate-fadeIn" id="deployment-form">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                      Assign Travel & Projects
                    </h3>

                    {formError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] rounded flex gap-1 items-center font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                        Select IGO Project
                      </label>
                      <select
                        className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.locationDistrict})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                          {getTranslation('startDate', lang)}
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 font-mono"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                          {getTranslation('endDate', lang)}
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 font-mono"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id="btn-submit-deployment"
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {submitting ? 'Sending...' : getTranslation('submitRequest', lang)}
                      </button>
                      <button
                        type="button"
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
                        onClick={() => setIsDeploying(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 shadow-sm">
                <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold leading-relaxed">Select any worker from the pool to view details, supervisor contact info, and submit deployment requests.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- PLACEMENTS & STATUS TRACKER VIEW --- */}
      {viewMode === 'deployments' && (
        <div className="space-y-4" id="hr-deployments-registry">
          <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            
            <div className="p-4 bg-slate-900 text-white border-b-4 border-amber-500 flex justify-between items-center shadow-md">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Active Deployments & Assignments
              </h3>
              <span className="text-xs bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow">
                {deployments.length} deployments tracked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse" id="deployments-table">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Worker</th>
                    <th className="p-3.5">Project</th>
                    <th className="p-3.5">Requested By</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5">Deployment Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans font-medium text-slate-700">
                  {deployments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 font-bold">
                        No deployments logged on the platform yet.
                      </td>
                    </tr>
                  ) : (
                    deployments.map((dep) => {
                      const workerObj = workers.find(w => w.id === dep.workerId);
                      const projObj = projects.find(p => p.id === dep.projectId);

                      return (
                        <tr key={dep.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              {workerObj ? (
                                <>
                                  <img src={workerObj.profilePhotoUrl} alt="" className="w-8 h-8 rounded-lg object-cover border-2 border-slate-200 shadow-sm" referrerPolicy="no-referrer" />
                                  <div>
                                    <span className="font-extrabold text-slate-950 block">{workerObj.name}</span>
                                    <span className="text-[9px] text-indigo-700 font-black uppercase tracking-widest mt-0.5 block">{workerObj.skill}</span>
                                  </div>
                                </>
                              ) : (
                                <span className="font-bold text-slate-400">Unknown Worker</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            {projObj ? (
                              <div>
                                <span className="font-extrabold text-slate-900 block">{projObj.name}</span>
                                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">📍 {projObj.locationDistrict}, {projObj.locationState}</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-slate-400">Unknown Project</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-700 font-mono font-bold">{dep.requestedBy}</td>
                          <td className="p-3.5 font-mono text-slate-600 font-semibold">{dep.startDate} to {dep.endDate}</td>
                          <td className="p-3.5">
                            {dep.status === 'requested' && (
                              <span className="inline-flex px-2.5 py-1 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-lg">Requested</span>
                            )}
                            {dep.status === 'confirmed' && (
                              <span className="inline-flex px-2.5 py-1 bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-black uppercase tracking-wider rounded-lg">Supervisor Confirmed</span>
                            )}
                            {dep.status === 'active' && (
                              <span className="inline-flex px-2.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-lg animate-pulse">Active Onsite</span>
                            )}
                            {dep.status === 'completed' && (
                              <span className="inline-flex px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg">Completed</span>
                            )}
                            {dep.status === 'cancelled' && (
                              <span className="inline-flex px-2.5 py-1 bg-rose-100 border border-rose-200 text-rose-800 text-[10px] font-black uppercase tracking-wider rounded-lg">Declined / Cancelled</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {dep.status === 'confirmed' && (
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 text-white font-black uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-sm cursor-pointer"
                                onClick={() => handleUpdateDeploymentStatus(dep.id, 'active')}
                              >
                                Mark Onsite
                              </button>
                            )}
                            {dep.status === 'active' && (
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 font-black uppercase tracking-wider text-[10px] rounded-lg transition-all shadow-sm cursor-pointer"
                                onClick={() => handleUpdateDeploymentStatus(dep.id, 'completed')}
                              >
                                Release / Close
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- PROJECTS MANAGEMENT VIEW --- */}
      {viewMode === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-start" id="hr-projects-registry">
          {/* Projects list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                IGO Group Agri-Infrastructure & Construction Projects
              </h3>
              
              <button
                type="button"
                className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-black uppercase tracking-wider text-[10px] rounded-xl flex items-center gap-1 shadow-md cursor-pointer transition-all"
                onClick={() => setIsAddingProject(true)}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Add New Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-white border-2 border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm hover:border-indigo-400 transition-all">
                  <div>
                    <span className="text-[9px] bg-indigo-100 border border-indigo-200 text-indigo-800 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">{proj.status}</span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-1.5 leading-tight">{proj.name}</h4>
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {proj.locationDistrict}, {proj.locationState}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-black mb-1.5">Required Skills onsite</span>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.requiredSkills.map(skillName => (
                        <span key={skillName} className="px-2 py-1 bg-slate-50 border border-slate-200 text-[9px] text-slate-700 font-bold uppercase tracking-wider rounded-lg">
                          {skillName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Project Form Drawer */}
          <div>
            {isAddingProject ? (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-md" id="project-form-container">
                <h3 className="text-sm font-black text-slate-900 border-b-2 border-slate-100 pb-2 uppercase tracking-tight">
                  🏗️ Create IGO Infrastructure Project
                </h3>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Project Site Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="eg. IGO Salem Paddy Mill Phase 3"
                      className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                        State Location
                      </label>
                      <select
                        className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                        value={newProjectState}
                        onChange={(e) => {
                          setNewProjectState(e.target.value);
                          setNewProjectDistrict(STATES_AND_DISTRICTS[e.target.value][0]);
                        }}
                      >
                        {Object.keys(STATES_AND_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                        District Location
                      </label>
                      <select
                        className="w-full p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                        value={newProjectDistrict}
                        onChange={(e) => setNewProjectDistrict(e.target.value)}
                      >
                        {STATES_AND_DISTRICTS[newProjectState].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                      Select Required Trades / Skills
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border-2 border-slate-200">
                      {SKILL_CATEGORIES.map(s => {
                        const isChecked = newProjectSkills.includes(s);
                        return (
                          <div
                            key={s}
                            className={`flex items-center justify-between p-2 px-3 rounded-lg cursor-pointer text-xs font-bold ${isChecked ? 'bg-indigo-100 border-2 border-indigo-300 text-indigo-900' : 'text-slate-600 hover:bg-slate-100'}`}
                            onClick={() => toggleRequiredSkill(s)}
                          >
                            <span>{s}</span>
                            <span className="font-bold">{isChecked ? "✓" : "+"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition-all active:translate-y-0.5 active:border-b-0 cursor-pointer"
                    >
                      Save Project Location
                    </button>
                    <button
                      type="button"
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
                      onClick={() => setIsAddingProject(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center text-slate-400 shadow-sm">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold leading-relaxed">Add new Pan-India project locations to map trade skills, coordinate, and assign deployment travel requests.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
