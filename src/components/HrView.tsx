import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Worker, Project, Deployment, Supervisor, UserProfile, RequiredSkill } from '../types';
import { db, handleFirestoreError, OperationType, collection, onSnapshot, doc, setDoc } from '../firebase';
import { getTranslation } from '../translations';
import { STATES_AND_DISTRICTS, SKILL_CATEGORIES, ID_PROOF_TYPES } from '../data';
import { compressImage, readImageFile } from '../utils';
import CameraCaptureModal from './CameraCaptureModal';
import {
  Search, Filter, Calendar, MapPin, Briefcase, Phone,
  User, CheckCircle, ArrowRight, Table, Grid, Plus, Check, X, AlertCircle,
  UserCog, Camera, FileText, Upload
} from 'lucide-react';

interface HrViewProps {
  user: UserProfile;
  lang: 'en' | 'ta';
}

export default function HrView({ user, lang }: HrViewProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkill, setFilterSkill] = useState('All');
  const [filterState, setFilterState] = useState('All');
  const [filterAvailability, setFilterAvailability] = useState('All');

  // UI Selection states
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [viewMode, setViewMode] = useState<'workers' | 'addSupervisor' | 'projects'>('workers');

  // Deployment Form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Project Creation State
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectState, setNewProjectState] = useState('Tamil Nadu');
  const [newProjectDistrict, setNewProjectDistrict] = useState('Chennai');
  const [newProjectSupervisorId, setNewProjectSupervisorId] = useState('');
  const [newProjectSkills, setNewProjectSkills] = useState<Record<string, number>>({});

  // Add Supervisor state
  const [isAddingSupervisor, setIsAddingSupervisor] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supState, setSupState] = useState('Tamil Nadu');
  const [supDistrict, setSupDistrict] = useState('Chennai');
  const [supIdProofType, setSupIdProofType] = useState(ID_PROOF_TYPES[0]);
  const [supProfilePhoto, setSupProfilePhoto] = useState('');
  const [supIdProofPhoto, setSupIdProofPhoto] = useState('');
  const [supFormError, setSupFormError] = useState('');
  const [supSubmitting, setSupSubmitting] = useState(false);
  const [supCameraTarget, setSupCameraTarget] = useState<'profile' | 'id' | null>(null);
  const supProfileFileInputRef = useRef<HTMLInputElement>(null);
  const supIdFileInputRef = useRef<HTMLInputElement>(null);

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

    const unsubSupervisors = onSnapshot(collection(db, 'supervisors'), (snapshot) => {
      const list: Supervisor[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Supervisor);
      });
      setSupervisors(list);
    });

    const unsubDeployments = onSnapshot(collection(db, 'deployments'), (snapshot) => {
      const list: Deployment[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Deployment);
      });
      setDeployments(list);
    });

    return () => {
      unsubWorkers();
      unsubProjects();
      unsubSupervisors();
      unsubDeployments();
    };
  }, []);

  // Keep the deployment form's selected project valid as the live list changes
  // (re-validate rather than "set once": Firestore's offline cache can briefly
  // serve stale/deleted docs before the first real-time snapshot reconciles,
  // and a one-time default would otherwise lock onto that stale id forever).
  useEffect(() => {
    if (projects.length === 0) return;
    if (!projects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Same re-validation for the "assign supervisor" dropdown default.
  useEffect(() => {
    if (supervisors.length === 0) return;
    if (!supervisors.some(s => s.id === newProjectSupervisorId)) {
      setNewProjectSupervisorId(supervisors[0].id);
    }
  }, [supervisors, newProjectSupervisorId]);

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
    const requiredSkills: RequiredSkill[] = (Object.entries(newProjectSkills) as [string, number][])
      .filter(([, count]) => count > 0)
      .map(([skill, count]) => ({ skill, count }));

    if (!newProjectName || requiredSkills.length === 0) {
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
      requiredSkills,
      ...(newProjectSupervisorId ? { assignedSupervisorId: newProjectSupervisorId } : {})
    };

    try {
      await setDoc(doc(db, 'projects', projectId), newProj);
      setNewProjectName('');
      setNewProjectSkills({});
      setIsAddingProject(false);
      setSelectedProject(newProj);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}`);
    }
  };

  const incrementRequiredSkill = (skillName: string) => {
    setNewProjectSkills(prev => ({ ...prev, [skillName]: (prev[skillName] || 0) + 1 }));
  };

  const decrementRequiredSkill = (skillName: string) => {
    setNewProjectSkills(prev => {
      const nextCount = (prev[skillName] || 0) - 1;
      const next = { ...prev };
      if (nextCount <= 0) {
        delete next[skillName];
      } else {
        next[skillName] = nextCount;
      }
      return next;
    });
  };

  // 4. Handle Add Supervisor photo captures & compression
  const handleSupervisorCameraCapture = async (dataUrl: string) => {
    const compressed = await compressImage(dataUrl);
    if (supCameraTarget === 'profile') {
      setSupProfilePhoto(compressed);
    } else if (supCameraTarget === 'id') {
      setSupIdProofPhoto(compressed);
    }
    setSupCameraTarget(null);
  };

  const handleSupervisorFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'id') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      const compressed = await compressImage(dataUrl);
      if (type === 'profile') {
        setSupProfilePhoto(compressed);
      } else {
        setSupIdProofPhoto(compressed);
      }
    } catch (err: any) {
      alert(err.message || (lang === 'en' ? 'Only PNG and JPEG images are allowed.' : 'PNG மற்றும் JPEG படங்கள் மட்டுமே அனுமதிக்கப்படும்.'));
    }
  };

  // 5. Submit new Supervisor registration
  const handleAddSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || supPhone.length !== 10) {
      setSupFormError(lang === 'en' ? 'Please fill in the supervisor name and a valid 10-digit phone number.' : 'மேற்பார்வையாளர் பெயர் மற்றும் செல்லுபடியாகும் 10-இலக்க கைபேசி எண்ணை நிரப்பவும்.');
      return;
    }
    setSupFormError('');
    setSupSubmitting(true);

    const supervisorId = 'sup-' + Date.now();
    const newSupervisor: Supervisor = {
      id: supervisorId,
      name: supName.trim(),
      phone: supPhone,
      assignedState: supState,
      assignedDistrict: supDistrict,
      workerCount: 0,
      lastActiveAt: new Date().toISOString(),
      profilePhotoUrl: supProfilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
      idProofType: supIdProofType,
      idProofPhotoUrl: supIdProofPhoto || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop',
    };

    try {
      await setDoc(doc(db, 'supervisors', supervisorId), newSupervisor);
      setSupName('');
      setSupPhone('');
      setSupState('Tamil Nadu');
      setSupDistrict('Chennai');
      setSupIdProofType(ID_PROOF_TYPES[0]);
      setSupProfilePhoto('');
      setSupIdProofPhoto('');
      setIsAddingSupervisor(false);
      setSelectedSupervisor(newSupervisor);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `supervisors/${supervisorId}`);
    } finally {
      setSupSubmitting(false);
    }
  };

  // 6. Query Filters Logic
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          worker.skill.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = filterSkill === 'All' || worker.skill === filterSkill;
    const matchesState = filterState === 'All' || worker.homeState === filterState;
    const matchesAvailability = filterAvailability === 'All' || worker.availability === filterAvailability;

    return matchesSearch && matchesSkill && matchesState && matchesAvailability;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 text-slate-100 font-sans" id="hr-portal-root">
      {/* Top Welcome Panel */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-5 rounded-3xl border-b-4 border-amber-500 mb-6 shadow-lg"
      >
        {/* Decorative ambient glow orbs, matching the login/app header language */}
        <div className="pointer-events-none absolute -top-12 -left-8 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -bottom-16 right-10 w-52 h-52 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />

        <div className="relative z-10">
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">IGO Group Pan-India System</span>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5 mt-1 uppercase tracking-tight">
            <span className="icon-glow-amber inline-flex p-2 bg-amber-500/15 rounded-xl border border-amber-500/30">
              <Briefcase className="w-5 h-5 text-amber-400 shrink-0" />
            </span>
            {getTranslation('roleHR', lang)} Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Logged in as <strong className="text-amber-400 font-bold">{user.name}</strong> • Active registry overview.
          </p>
        </div>

        {/* View switcher tabs */}
        <div className="relative z-10 flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 self-stretch md:self-auto shrink-0 shadow-inner">
          <button
            type="button"
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'workers' ? 'icon-glow-amber bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => { setViewMode('workers'); setSelectedWorker(null); }}
          >
            <User className="w-4 h-4" />
            Workers Pool
          </button>
          <button
            type="button"
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'addSupervisor' ? 'icon-glow-amber bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => { setViewMode('addSupervisor'); setSelectedWorker(null); }}
          >
            <UserCog className="w-4 h-4" />
            Add Supervisor
          </button>
          <button
            type="button"
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'projects' ? 'icon-glow-amber bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => { setViewMode('projects'); setSelectedWorker(null); }}
          >
            <MapPin className="w-4 h-4" />
            IGO Projects
          </button>
        </div>
      </motion.div>

      <>
      {/* --- WORKERS POOL VIEW --- */}
      {viewMode === 'workers' && (
        <motion.div
          key="workers-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-start" id="hr-workers-registry"
        >

          {/* Filters & Results Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white/5 p-4 rounded-2xl border-2 border-white/10 space-y-4 shadow-sm">
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder={getTranslation('searchPlaceholder', lang)}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border-2 border-white/10 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 rounded-xl text-xs font-bold text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
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
                    className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
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
                    className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
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
                    className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
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
                {filteredWorkers.map((worker, idx) => {
                  const isSel = selectedWorker?.id === worker.id;
                  return (
                    <motion.div
                      key={worker.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(idx, 8) * 0.03, ease: 'easeOut' }}
                      whileHover={{ y: -2 }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex gap-3 items-center relative ${
                        isSel
                          ? 'icon-glow-indigo bg-indigo-500/10 border-indigo-500 shadow-md'
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:shadow-md'
                      }`}
                      onClick={() => { setSelectedWorker(worker); setIsDeploying(false); }}
                    >
                      <img
                        src={worker.profilePhotoUrl}
                        alt={worker.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white/10 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-extrabold text-sm truncate ${isSel ? 'text-indigo-200' : 'text-white'}`}>{worker.name}</h4>
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-0.5 truncate">{worker.skill}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-semibold">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {worker.homeDistrict}, {worker.homeState}
                        </p>
                      </div>

                      {/* Availability status */}
                      <div className="shrink-0">
                        {worker.availability === 'available' ? (
                          <span className="inline-block px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider rounded-lg">Available</span>
                        ) : worker.availability === 'deployed' ? (
                          <span className="inline-block px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[9px] font-black uppercase tracking-wider rounded-lg">Deployed</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-white/10 border border-white/10 text-slate-300 text-[9px] font-black uppercase tracking-wider rounded-lg">Unavailable</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Read-Only Profile & Deployment Request Column */}
          <div className="space-y-4">
            <>
            {selectedWorker ? (
              <motion.div
                key={selectedWorker.id}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="icon-glow-indigo bg-white/5 border-2 border-white/10 rounded-3xl p-5 space-y-5 sticky top-6 shadow-md" id="hr-worker-detail-pane">

                {/* Visual Header */}
                <div className="flex items-start gap-3 border-b-2 border-white/5 pb-4">
                  <img
                    src={selectedWorker.profilePhotoUrl}
                    alt={selectedWorker.name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-white/10 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-base font-black text-white leading-tight">{selectedWorker.name}</h2>
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-0.5 block">{selectedWorker.skill}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-bold">Native: {selectedWorker.homeDistrict}, {selectedWorker.homeState}</p>
                  </div>
                </div>

                {/* Personal particulars */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b-2 border-white/5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone:</span>
                    <span className="font-extrabold font-mono text-slate-100">+91 {selectedWorker.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b-2 border-white/5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Age:</span>
                    <span className="font-extrabold text-slate-100">{selectedWorker.age} years</span>
                  </div>
                  <div className="flex justify-between py-1 border-b-2 border-white/5 font-semibold">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">ID proof verified:</span>
                    <span className="font-extrabold text-emerald-400 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      {selectedWorker.idProofType}
                    </span>
                  </div>
                </div>

                {/* Supervisor Relationship (Owner) */}
                {(() => {
                  const sup = supervisors.find(s => s.id === selectedWorker.supervisorId);
                  return (
                    <div className="p-3.5 bg-white/[0.03] rounded-2xl border-2 border-white/10 space-y-1 shadow-inner">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">Captured By Supervisor</span>
                      <div className="text-xs font-black text-slate-100 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
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
                  <form onSubmit={handleSubmitDeploymentRequest} className="space-y-4 pt-4 border-t-2 border-white/5 animate-fadeIn" id="deployment-form">
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      Assign Travel & Projects
                    </h3>

                    {formError && (
                      <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[10px] rounded flex gap-1 items-center font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                        Select IGO Project
                      </label>
                      <select
                        className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
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
                        <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                          {getTranslation('startDate', lang)}
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 font-mono"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                          {getTranslation('endDate', lang)}
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 font-mono"
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
                        className="px-4 py-3 bg-white/10 hover:bg-white/15 border-2 border-white/10 text-slate-300 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
                        onClick={() => setIsDeploying(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-8 text-center text-slate-400 shadow-sm">
                <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold leading-relaxed">Select any worker from the pool to view details, supervisor contact info, and submit deployment requests.</p>
              </motion.div>
            )}
            </>
          </div>
        </motion.div>
      )}

      {/* --- ADD SUPERVISOR VIEW --- */}
      {viewMode === 'addSupervisor' && (
        <motion.div
          key="add-supervisor-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-start" id="hr-supervisors-registry"
        >
          {/* Registered Supervisors List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Registered Supervisors ({supervisors.length})
              </h3>
              <button
                type="button"
                id="btn-open-add-supervisor"
                className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-black uppercase tracking-wider text-[10px] rounded-xl flex items-center gap-1 shadow-md cursor-pointer transition-all"
                onClick={() => { setIsAddingSupervisor(true); setSelectedSupervisor(null); setSupFormError(''); }}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Add Supervisor
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="hr-supervisors-grid">
              {supervisors.length === 0 ? (
                <div className="sm:col-span-2 text-center py-12 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                  <UserCog className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No supervisors registered yet.</p>
                </div>
              ) : (
                supervisors.map((sup, idx) => {
                  const isSel = selectedSupervisor?.id === sup.id;
                  return (
                    <motion.div
                      key={sup.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(idx, 8) * 0.03, ease: 'easeOut' }}
                      whileHover={{ y: -2 }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex gap-3 items-center ${
                        isSel
                          ? 'icon-glow-indigo bg-indigo-500/10 border-indigo-500 shadow-md'
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:shadow-md'
                      }`}
                      onClick={() => { setSelectedSupervisor(sup); setIsAddingSupervisor(false); }}
                    >
                      <img
                        src={sup.profilePhotoUrl}
                        alt={sup.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white/10 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-extrabold text-sm truncate ${isSel ? 'text-indigo-200' : 'text-white'}`}>{sup.name}</h4>
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-0.5 truncate">Area Supervisor</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-semibold">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {sup.assignedDistrict}, {sup.assignedState}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Supervisor Form / Selected Supervisor Detail */}
          <div className="space-y-4">
            <>
              {isAddingSupervisor ? (
                <motion.div
                  key="add-supervisor-form"
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="bg-white/5 border-2 border-white/10 rounded-3xl p-5 space-y-4 sticky top-6 shadow-md"
                  id="add-supervisor-form-container"
                >
                  <h3 className="text-sm font-black text-white border-b-2 border-white/5 pb-2 uppercase tracking-tight">
                    🧑‍💼 Register New Supervisor
                  </h3>

                  <form onSubmit={handleAddSupervisor} className="space-y-4" id="add-supervisor-form">
                    {supFormError && (
                      <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[10px] rounded flex gap-1 items-center font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{supFormError}</span>
                      </div>
                    )}

                    {/* Photo Upload */}
                    <div className="bg-white/[0.03] p-3.5 rounded-xl border-2 border-white/10">
                      <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-2">
                        Photo Upload
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {supProfilePhoto ? (
                            <img src={supProfilePhoto} alt="Profile Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <button
                            type="button"
                            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 flex items-center justify-center gap-1 shadow cursor-pointer"
                            onClick={() => setSupCameraTarget('profile')}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Use Camera
                          </button>
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            ref={supProfileFileInputRef}
                            className="hidden"
                            onChange={(e) => handleSupervisorFileSelect(e, 'profile')}
                          />
                          <button
                            type="button"
                            className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center gap-1 shadow cursor-pointer"
                            onClick={() => supProfileFileInputRef.current?.click()}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Upload from Device
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                        Name
                      </label>
                      <input
                        id="input-sup-name"
                        type="text"
                        required
                        placeholder="eg. Ganesh Prasad"
                        className="w-full px-3 py-2.5 bg-white/[0.03] border-2 border-white/10 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 rounded-xl text-white font-bold text-sm focus:outline-none transition-all"
                        value={supName}
                        onChange={(e) => setSupName(e.target.value)}
                      />
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                          Location (State)
                        </label>
                        <select
                          className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
                          value={supState}
                          onChange={(e) => {
                            setSupState(e.target.value);
                            setSupDistrict(STATES_AND_DISTRICTS[e.target.value][0]);
                          }}
                        >
                          {Object.keys(STATES_AND_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                          Location (District)
                        </label>
                        <select
                          className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
                          value={supDistrict}
                          onChange={(e) => setSupDistrict(e.target.value)}
                        >
                          {STATES_AND_DISTRICTS[supState].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <input
                        id="input-sup-phone"
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="eg. 9123456780"
                        className="w-full px-3 py-2.5 bg-white/[0.03] border-2 border-white/10 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 rounded-xl text-white font-bold text-sm focus:outline-none transition-all font-mono tracking-wider"
                        value={supPhone}
                        onChange={(e) => setSupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                    </div>

                    {/* ID Proof */}
                    <div className="bg-white/[0.03] p-3.5 rounded-xl border-2 border-white/10 space-y-3">
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            ID Proof Type
                          </label>
                          <select
                            className="w-full px-2 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-600"
                            value={supIdProofType}
                            onChange={(e) => setSupIdProofType(e.target.value)}
                          >
                            {ID_PROOF_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="text-right space-y-1.5">
                          <button
                            type="button"
                            className="w-full py-2.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider text-white flex items-center justify-center gap-1 shadow cursor-pointer"
                            onClick={() => setSupCameraTarget('id')}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            ID Photo Capture
                          </button>
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            ref={supIdFileInputRef}
                            className="hidden"
                            onChange={(e) => handleSupervisorFileSelect(e, 'id')}
                          />
                          <button
                            type="button"
                            className="w-full py-2.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center justify-center gap-1 shadow cursor-pointer"
                            onClick={() => supIdFileInputRef.current?.click()}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Upload from Device
                          </button>
                        </div>
                      </div>

                      <div className="h-20 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
                        {supIdProofPhoto ? (
                          <img src={supIdProofPhoto} alt="ID Preview" className="w-full h-full object-contain" />
                        ) : (
                          <FileText className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-2">
                      <button
                        id="btn-submit-supervisor"
                        type="submit"
                        disabled={supSubmitting}
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition-all active:translate-y-0.5 active:border-b-0 cursor-pointer disabled:opacity-50"
                      >
                        {supSubmitting ? 'Saving...' : 'Submit'}
                      </button>
                      <button
                        type="button"
                        className="px-4 py-3 bg-white/10 hover:bg-white/15 border-2 border-white/10 text-slate-300 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
                        onClick={() => { setIsAddingSupervisor(false); setSupFormError(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : selectedSupervisor ? (
                <motion.div
                  key={selectedSupervisor.id}
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="icon-glow-indigo bg-white/5 border-2 border-white/10 rounded-3xl p-5 space-y-5 sticky top-6 shadow-md"
                  id="hr-supervisor-detail-pane"
                >
                  {/* Visual Header */}
                  <div className="flex items-start gap-3 border-b-2 border-white/5 pb-4">
                    <img
                      src={selectedSupervisor.profilePhotoUrl}
                      alt={selectedSupervisor.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white/10 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h2 className="text-base font-black text-white leading-tight">{selectedSupervisor.name}</h2>
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-0.5 block">Area Supervisor</span>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-bold">Native: {selectedSupervisor.assignedDistrict}, {selectedSupervisor.assignedState}</p>
                    </div>
                  </div>

                  {/* Particulars */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b-2 border-white/5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone:</span>
                      <span className="font-extrabold font-mono text-slate-100">+91 {selectedSupervisor.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b-2 border-white/5 font-semibold">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">ID proof verified:</span>
                      <span className="font-extrabold text-emerald-400 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        {selectedSupervisor.idProofType}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Projects */}
                  {(() => {
                    const assignedProjects = projects.filter(p => p.assignedSupervisorId === selectedSupervisor.id);
                    return (
                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">
                          Assigned Projects ({assignedProjects.length})
                        </span>
                        {assignedProjects.length === 0 ? (
                          <p className="text-xs font-bold text-slate-400">No projects assigned to this supervisor yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {assignedProjects.map(proj => (
                              <div key={proj.id} className="p-3 bg-white/[0.03] rounded-xl border-2 border-white/10">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-extrabold text-white leading-tight">{proj.name}</h4>
                                  <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0">{proj.status}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {proj.locationDistrict}, {proj.locationState}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {proj.requiredSkills.map(({ skill, count }) => (
                                    <span key={skill} className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-[9px] text-slate-300 font-bold uppercase tracking-wider rounded-md">
                                      {skill} <span className="text-indigo-400">×{count}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-8 text-center text-slate-400 shadow-sm"
                >
                  <UserCog className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold leading-relaxed">Select a supervisor from the list to view details, or add a new one.</p>
                </motion.div>
              )}
            </>
          </div>
        </motion.div>
      )}

      {/* --- PROJECTS MANAGEMENT VIEW --- */}
      {viewMode === 'projects' && (
        <motion.div
          key="projects-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-start" id="hr-projects-registry"
        >
          {/* Projects list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                IGO Group Agri-Infrastructure & Construction Projects
              </h3>
              
              <button
                type="button"
                className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-black uppercase tracking-wider text-[10px] rounded-xl flex items-center gap-1 shadow-md cursor-pointer transition-all"
                onClick={() => { setIsAddingProject(true); setSelectedProject(null); }}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Add New Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="hr-projects-grid">
              {projects.length === 0 ? (
                <div className="md:col-span-2 text-center py-12 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No projects registered yet.</p>
                </div>
              ) : (
                projects.map((proj) => {
                  const isSel = selectedProject?.id === proj.id;
                  const assignedSup = supervisors.find(s => s.id === proj.assignedSupervisorId);
                  return (
                    <div
                      key={proj.id}
                      className={`p-4 rounded-2xl border-2 cursor-pointer space-y-3 shadow-sm transition-all ${
                        isSel ? 'icon-glow-indigo bg-indigo-500/10 border-indigo-500' : 'bg-white/5 border-white/10 hover:border-indigo-400'
                      }`}
                      onClick={() => { setSelectedProject(proj); setIsAddingProject(false); }}
                    >
                      <div>
                        <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">{proj.status}</span>
                        <h4 className="text-sm font-extrabold text-white mt-1.5 leading-tight">{proj.name}</h4>
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {proj.locationDistrict}, {proj.locationState}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                          <UserCog className="w-3.5 h-3.5 text-slate-400" />
                          {assignedSup ? assignedSup.name : 'No supervisor assigned'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-black mb-1.5">Required Skills onsite</span>
                        <div className="flex flex-wrap gap-1.5">
                          {proj.requiredSkills.map(({ skill, count }) => (
                            <span key={skill} className="px-2 py-1 bg-white/[0.03] border border-white/10 text-[9px] text-slate-300 font-bold uppercase tracking-wider rounded-lg">
                              {skill} <span className="text-indigo-400">×{count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Project Form Drawer */}
          <div>
            {isAddingProject ? (
              <div className="bg-white/5 border-2 border-white/10 rounded-3xl p-5 space-y-4 shadow-md" id="project-form-container">
                <h3 className="text-sm font-black text-white border-b-2 border-white/5 pb-2 uppercase tracking-tight">
                  🏗️ Create IGO Infrastructure Project
                </h3>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                      Project Site Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="eg. IGO Salem Paddy Mill Phase 3"
                      className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                        State Location
                      </label>
                      <select
                        className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
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
                      <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                        District Location
                      </label>
                      <select
                        className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
                        value={newProjectDistrict}
                        onChange={(e) => setNewProjectDistrict(e.target.value)}
                      >
                        {STATES_AND_DISTRICTS[newProjectState].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1">
                      Assign Supervisor
                    </label>
                    <select
                      id="input-project-supervisor"
                      className="w-full p-2.5 bg-white/[0.03] border-2 border-white/10 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20"
                      value={newProjectSupervisorId}
                      onChange={(e) => setNewProjectSupervisorId(e.target.value)}
                    >
                      {supervisors.length === 0 && <option value="">No supervisors registered yet</option>}
                      {supervisors.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name} ({sup.assignedDistrict}, {sup.assignedState})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider mb-1.5">
                      Select Required Trades / Skills
                    </label>
                    <div className="max-h-52 overflow-y-auto space-y-1.5 p-2 bg-white/[0.03] rounded-xl border-2 border-white/10">
                      {SKILL_CATEGORIES.map(s => {
                        const count = newProjectSkills[s] || 0;
                        const isChecked = count > 0;
                        return (
                          <div
                            key={s}
                            className={`flex items-center justify-between p-2 px-3 rounded-lg text-xs font-bold transition-colors ${isChecked ? 'bg-indigo-500/15 border-2 border-indigo-400/40 text-indigo-200' : 'text-slate-300'}`}
                          >
                            <span>{s}</span>
                            {isChecked ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="w-6 h-6 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white font-black cursor-pointer transition-colors"
                                  onClick={() => decrementRequiredSkill(s)}
                                >
                                  −
                                </button>
                                <span className="w-5 text-center font-black text-indigo-200">{count}</span>
                                <button
                                  type="button"
                                  className="w-6 h-6 flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-black cursor-pointer transition-colors"
                                  onClick={() => incrementRequiredSkill(s)}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-indigo-600 hover:text-white text-slate-300 font-black cursor-pointer transition-colors"
                                onClick={() => incrementRequiredSkill(s)}
                              >
                                +
                              </button>
                            )}
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
                      className="px-4 py-3 bg-white/10 hover:bg-white/15 border-2 border-white/10 text-slate-300 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
                      onClick={() => setIsAddingProject(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedProject ? (
              <div className="icon-glow-indigo bg-white/5 border-2 border-white/10 rounded-3xl p-5 space-y-5 sticky top-6 shadow-md" id="hr-project-detail-pane">
                <div className="border-b-2 border-white/5 pb-4">
                  <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">{selectedProject.status}</span>
                  <h2 className="text-base font-black text-white leading-tight mt-1.5">{selectedProject.name}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedProject.locationDistrict}, {selectedProject.locationState}
                  </p>
                </div>

                {/* Assigned Supervisor */}
                {(() => {
                  const sup = supervisors.find(s => s.id === selectedProject.assignedSupervisorId);
                  return (
                    <div className="p-3.5 bg-white/[0.03] rounded-2xl border-2 border-white/10 space-y-1 shadow-inner">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">Assigned Supervisor</span>
                      {sup ? (
                        <>
                          <div className="text-xs font-black text-slate-100 flex items-center gap-1">
                            <UserCog className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            {sup.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono font-bold">
                            <Phone className="w-3 h-3 text-slate-400" />
                            +91 {sup.phone}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">No supervisor assigned</span>
                      )}
                    </div>
                  );
                })()}

                {/* Daily Workers Assigned, grouped by skill */}
                {(() => {
                  const projectDeployments = deployments.filter(d => d.projectId === selectedProject.id && d.status !== 'cancelled');
                  const bySkill: Record<string, number> = {};
                  projectDeployments.forEach(dep => {
                    const w = workers.find(w => w.id === dep.workerId);
                    if (w) bySkill[w.skill] = (bySkill[w.skill] || 0) + 1;
                  });
                  const entries = Object.entries(bySkill);
                  return (
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">
                        Daily Workers Assigned ({projectDeployments.length})
                      </span>
                      {entries.length === 0 ? (
                        <p className="text-xs font-bold text-slate-400">No workers assigned to this project yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {entries.map(([skill, count]) => (
                            <span key={skill} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[9px] font-bold uppercase tracking-wider rounded-lg">
                              {skill} <span className="text-emerald-400">×{count}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Required vs assigned skills */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">Required Skills Onsite</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProject.requiredSkills.map(({ skill, count }) => (
                      <span key={skill} className="px-2 py-1 bg-white/[0.03] border border-white/10 text-[9px] text-slate-300 font-bold uppercase tracking-wider rounded-lg">
                        {skill} <span className="text-indigo-400">×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-6 text-center text-slate-400 shadow-sm">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold leading-relaxed">Select a project to view its assigned supervisor and daily worker breakdown, or add a new one.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </>

      {supCameraTarget && (
        <CameraCaptureModal
          lang={lang}
          facingMode={supCameraTarget === 'id' ? 'environment' : 'user'}
          onCapture={handleSupervisorCameraCapture}
          onClose={() => setSupCameraTarget(null)}
        />
      )}
    </div>
  );
}
