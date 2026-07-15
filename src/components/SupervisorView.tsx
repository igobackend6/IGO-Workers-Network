import React, { useState, useEffect, useRef } from 'react';
import { Worker, Supervisor, Deployment, Project, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType, collection, query, where, onSnapshot, doc, setDoc, updateDoc } from '../firebase';
import { getTranslation } from '../translations';
import { STATES_AND_DISTRICTS, SKILL_CATEGORIES, ID_PROOF_TYPES } from '../data';
import { compressImage, readImageFile } from '../utils';
import CameraCaptureModal from './CameraCaptureModal';
import {
  Users, Plus, CheckCircle, RefreshCw, Smartphone,
  MapPin, Phone, Briefcase, Camera, Save, ArrowLeft,
  Check, X, AlertCircle, FileText, ToggleLeft, ToggleRight, Wifi, WifiOff, Upload
} from 'lucide-react';

interface SupervisorViewProps {
  user: UserProfile;
  lang: 'en' | 'ta';
}

export default function SupervisorView({ user, lang }: SupervisorViewProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'deployments'>('list');
  
  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [phone, setPhone] = useState('');
  const [homeState, setHomeState] = useState(user.assignedState || 'Tamil Nadu');
  const [homeDistrict, setHomeDistrict] = useState(user.assignedDistrict || 'Madurai');
  const [skill, setSkill] = useState(SKILL_CATEGORIES[0]);
  const [customSkill, setCustomSkill] = useState('');
  const [isCustomSkill, setIsCustomSkill] = useState(false);
  const [idProofType, setIdProofType] = useState(ID_PROOF_TYPES[0]);
  const [idProofPhoto, setIdProofPhoto] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'profile' | 'id' | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  // 1. Detect Network Changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Real-time Subscription to Workers (Offline-First)
  useEffect(() => {
    const q = query(
      collection(db, 'workers'),
      where('supervisorId', '==', user.uid),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Check if Firestore SDK has any pending local writes
      setHasPendingWrites(snapshot.metadata.hasPendingWrites);
      
      const list: Worker[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Worker);
      });
      // Sort: most recently updated first
      list.sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
      setWorkers(list);
    }, (error) => {
      console.error("Workers snapshot failed", error);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // 3. Real-time Subscription to Deployments and Projects
  useEffect(() => {
    const qDep = collection(db, 'deployments');
    const unsubscribeDep = onSnapshot(qDep, (snapshot) => {
      const list: Deployment[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Deployment);
      });
      setDeployments(list);
    });

    const qProj = collection(db, 'projects');
    const unsubscribeProj = onSnapshot(qProj, (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Project);
      });
      setProjects(list);
    });

    return () => {
      unsubscribeDep();
      unsubscribeProj();
    };
  }, []);

  // 4. Handling Photo Captures & Compression
  const handleCameraCapture = async (dataUrl: string) => {
    const compressed = await compressImage(dataUrl);
    if (cameraTarget === 'profile') {
      setProfilePhoto(compressed);
    } else if (cameraTarget === 'id') {
      setIdProofPhoto(compressed);
    }
    setCameraTarget(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'id') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      const compressed = await compressImage(dataUrl);
      if (type === 'profile') {
        setProfilePhoto(compressed);
      } else {
        setIdProofPhoto(compressed);
      }
    } catch (err: any) {
      alert(err.message || (lang === 'en' ? 'Only PNG and JPEG images are allowed.' : 'PNG மற்றும் JPEG படங்கள் மட்டுமே அனுமதிக்கப்படும்.'));
    }
  };

  // 6. Form Submission (Saves locally first)
  const handleSubmitWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !age) {
      alert(lang === 'en' ? 'Please fill in name, phone and age.' : 'தயவுசெய்து பெயர், கைபேசி மற்றும் வயதை நிரப்பவும்.');
      return;
    }

    setLoading(true);
    const workerId = "worker-" + Date.now();
    const finalSkill = isCustomSkill ? customSkill : skill;

    const newWorker: Worker = {
      id: workerId,
      name,
      phone,
      age: Number(age),
      homeState,
      homeDistrict,
      skill: finalSkill || "Helper / General Labour",
      idProofType,
      idProofPhotoUrl: idProofPhoto || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop",
      profilePhotoUrl: profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
      availability: isAvailable ? 'available' : 'unavailable',
      supervisorId: user.uid,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      status: 'active',
    };

    try {
      // Save locally to Firestore (which caches it and syncs in background)
      const workerDocRef = doc(db, 'workers', workerId);
      await setDoc(workerDocRef, newWorker);

      // Reset form
      setName('');
      setAge('');
      setPhone('');
      setProfilePhoto('');
      setIdProofPhoto('');
      setIsCustomSkill(false);
      setCustomSkill('');

      setActiveTab('list');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `workers/${workerId}`);
    } finally {
      setLoading(false);
    }
  };

  // 7. Soft Delete (Archive)
  const handleArchiveWorker = async (workerId: string) => {
    if (!window.confirm(lang === 'en' ? 'Are you sure you want to archive this profile?' : 'இந்த விவரக்குறிப்பை காப்பகப்படுத்த விரும்புகிறீர்களா?')) {
      return;
    }
    try {
      const workerRef = doc(db, 'workers', workerId);
      await updateDoc(workerRef, {
        status: 'archived',
        lastUpdatedAt: new Date().toISOString(),
      });
      setSelectedWorker(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workers/${workerId}`);
    }
  };

  // 8. Handle Deployment Confirmations (Supervisor answers HR)
  const handleConfirmDeployment = async (depId: string, confirm: boolean) => {
    try {
      const depRef = doc(db, 'deployments', depId);
      const newStatus = confirm ? 'confirmed' : 'cancelled';
      
      await updateDoc(depRef, {
        status: newStatus
      });

      // Find the worker ID to update their availability status
      const dep = deployments.find(d => d.id === depId);
      if (dep && confirm) {
        const workerRef = doc(db, 'workers', dep.workerId);
        await updateDoc(workerRef, {
          availability: 'deployed',
          lastUpdatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deployments/${depId}`);
    }
  };

  // Filters workers by search query
  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.phone.includes(searchQuery)
  );

  // Get active requested deployments for workers owned by this supervisor
  const mySupervisorWorkersIds = workers.map(w => w.id);
  const pendingRequests = deployments.filter(d => 
    mySupervisorWorkersIds.includes(d.workerId) && 
    d.status === 'requested'
  );

  // Status Badge styles

  return (
    <div className={`flex flex-col min-h-[85vh] bg-white/[0.03] text-white mx-auto border-2 border-white/10 rounded-3xl pb-20 shadow-2xl relative overflow-hidden transition-all ${activeTab === 'list' && !selectedWorker ? 'max-w-3xl' : 'max-w-md'}`}>
      {/* 1. Mobile Status Top Bar */}
      <header className="p-4 bg-slate-900 text-white sticky top-0 z-30 border-b-4 border-amber-500 flex justify-between items-center shadow-lg">
        <div>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">Supervisor Portal</span>
          <h2 className="text-base font-black text-white flex items-center gap-1.5 leading-tight uppercase tracking-tight">
            <span className="icon-glow-amber inline-flex p-1.5 bg-amber-500/15 rounded-lg border border-amber-500/30">
              <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </span>
            {user.name}
          </h2>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1">
          {isOnline ? (
            hasPendingWrites ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-full shadow animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {getTranslation('pendingSync', lang)}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow">
                <Wifi className="w-3 h-3" />
                {getTranslation('synced', lang)}
              </div>
            )
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow">
              <WifiOff className="w-3 h-3" />
              {lang === 'en' ? 'Offline Cache' : 'ஆஃப்லைன்'}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'list' && !selectedWorker && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Column 1: Assigned Projects (from HR) */}
            {(() => {
              const myProjects = projects.filter(p => p.assignedSupervisorId === user.uid);
              return (
                <div className="bg-white/5 p-4 rounded-2xl border-2 border-white/10 shadow-sm space-y-3" id="supervisor-assigned-projects">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      My Assigned Projects
                    </h3>
                    <span className="text-xs font-bold text-slate-500">{myProjects.length}</span>
                  </div>

                  {myProjects.length === 0 ? (
                    <p className="text-[11px] font-bold text-slate-400">No projects assigned to you yet. HR will assign you when a project is ready.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {myProjects.map(proj => (
                        <div key={proj.id} className="p-3 bg-white/[0.03] rounded-xl border-2 border-white/10">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold text-white leading-tight">{proj.name}</h4>
                            <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0">{proj.status}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {proj.locationDistrict}, {proj.locationState}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.requiredSkills.map(({ skill, count }) => (
                              <span key={skill} className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-[9px] text-slate-300 font-bold uppercase tracking-wider rounded-md">
                                {skill} <span className="text-emerald-400">×{count}</span>
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

            {/* Column 2: Registered Workers (search, add, list) */}
            <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-2xl border-2 border-white/10 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  📍 {user.assignedDistrict}, {user.assignedState}
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {workers.length} {getTranslation('registeredWorkers', lang)}
                </span>
              </div>
              
              <input
                type="text"
                placeholder={getTranslation('searchPlaceholder', lang)}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] border-2 border-white/10 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-xs font-bold text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {getTranslation('myWorkers', lang)}
              </h3>
              
              <button
                type="button"
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black uppercase tracking-wider text-[10px] rounded-xl flex items-center gap-1 shadow-md cursor-pointer active:translate-y-0.5 transition-all"
                onClick={() => setActiveTab('add')}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                {getTranslation('addWorker', lang)}
              </button>
            </div>

            {/* List Items */}
            <div className="space-y-3" id="supervisor-workers-list">
              {filteredWorkers.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No workers registered in this area yet.</p>
                </div>
              ) : (
                filteredWorkers.map((worker) => {
                  const isAvailable = worker.availability === 'available';
                  const isDeployed = worker.availability === 'deployed';
                  
                  return (
                    <div
                      key={worker.id}
                      className="bg-white/5 p-3.5 rounded-2xl border-2 border-white/10 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden"
                      onClick={() => setSelectedWorker(worker)}
                    >
                      {/* Worker Thumbnail */}
                      <img
                        src={worker.profilePhotoUrl}
                        alt={worker.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border-2 border-white/10 shadow-sm"
                        referrerPolicy="no-referrer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-white truncate leading-tight">{worker.name}</h4>
                        </div>
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-emerald-500 shrink-0" />
                          {worker.skill}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {worker.homeDistrict}, {worker.homeState}
                        </p>
                      </div>

                      {/* Availability status badge */}
                      <div className="text-right shrink-0">
                        {isAvailable ? (
                          <span className="px-2 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider rounded-lg block text-center">
                            {getTranslation('available', lang)}
                          </span>
                        ) : isDeployed ? (
                          <span className="px-2 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider rounded-lg block text-center">
                            {getTranslation('deployed', lang)}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-white/10 border border-white/10 text-slate-300 text-[9px] font-black uppercase tracking-wider rounded-lg block text-center">
                            {getTranslation('unavailable', lang)}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-extrabold mt-1 block">Age: {worker.age}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </div>
          </div>
        )}

        {/* Worker Detail View / Edit Overlay */}
        {selectedWorker && (
          <div className="space-y-4 animate-fadeIn">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-emerald-400 cursor-pointer"
              onClick={() => setSelectedWorker(null)}
            >
              <ArrowLeft className="w-4 h-4" />
              {lang === 'en' ? 'Back to Registry' : 'பட்டியலுக்குத் திரும்பு'}
            </button>

            <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-4 space-y-4 shadow-md">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 border-b-2 border-white/5 pb-4">
                <img
                  src={selectedWorker.profilePhotoUrl}
                  alt={selectedWorker.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-black text-white leading-none">{selectedWorker.name}</h3>
                  </div>
                  <p className="text-xs text-emerald-400 font-black uppercase tracking-wider mt-1">{selectedWorker.skill}</p>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    +91 {selectedWorker.phone}
                  </p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/[0.03] p-2.5 rounded-xl border-2 border-white/10">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Age</span>
                  <span className="font-extrabold text-slate-100">{selectedWorker.age} years</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-xl border-2 border-white/10">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Native Region</span>
                  <span className="font-extrabold text-slate-100 truncate block">{selectedWorker.homeDistrict}, {selectedWorker.homeState}</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-xl border-2 border-white/10">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">ID Document</span>
                  <span className="font-extrabold text-slate-100 block">{selectedWorker.idProofType}</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-xl border-2 border-white/10">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Availability</span>
                  <span className={`font-extrabold block ${selectedWorker.availability === 'available' ? 'text-emerald-400' : selectedWorker.availability === 'deployed' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {selectedWorker.availability.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* ID Proof Photo Display */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Captured ID Proof Doc</span>
                <div className="relative border-2 border-white/10 rounded-xl overflow-hidden bg-white/10 h-40">
                  <img
                    src={selectedWorker.idProofPhotoUrl}
                    alt="ID Proof"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/85 rounded text-[9px] font-mono text-slate-300">
                    {selectedWorker.idProofType} verification file
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t-2 border-white/5 flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 border-b-4 border-rose-700 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow active:translate-y-0.5 active:border-b-0 cursor-pointer"
                  onClick={() => handleArchiveWorker(selectedWorker.id)}
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  {getTranslation('archiveWorker', lang)}
                </button>
                <button
                  type="button"
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 border-2 border-white/10 text-slate-300 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
                  onClick={() => setSelectedWorker(null)}
                >
                  {lang === 'en' ? 'Close' : 'மூடு'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. Register New Worker Form (Offline Friendly) */}
        {activeTab === 'add' && (
          <div className="space-y-4">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-emerald-400 cursor-pointer"
              onClick={() => setActiveTab('list')}
            >
              <ArrowLeft className="w-4 h-4" />
              {lang === 'en' ? 'Back' : 'பின்செல்'}
            </button>

            <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-4 shadow-md">
              <h3 className="text-lg font-black text-white mb-4 border-b-2 border-white/5 pb-2 uppercase tracking-tight">
                📝 {getTranslation('addWorker', lang)}
              </h3>

              <form onSubmit={handleSubmitWorker} className="space-y-4">
                {/* 1. Profile Photo and Quick Actions */}
                <div className="bg-white/[0.03] p-3.5 rounded-xl border-2 border-white/10">
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                    {getTranslation('profilePhoto', lang)}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 flex-1">
                      <button
                        type="button"
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 flex items-center justify-center gap-1 shadow cursor-pointer"
                        onClick={() => setCameraTarget('profile')}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'Device Camera' : 'கைபேசி கேமரா'}
                      </button>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        ref={profileFileInputRef}
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'profile')}
                      />
                      <button
                        type="button"
                        className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center gap-1 shadow cursor-pointer"
                        onClick={() => profileFileInputRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'Upload from Device' : 'சாதனத்திலிருந்து பதிவேற்று'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Worker Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1">
                      {getTranslation('workerName', lang)}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="eg. Muthu Karuppan"
                      className="w-full px-3 py-2.5 bg-white/[0.03] border-2 border-white/10 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-white font-bold text-sm focus:outline-none transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1">
                        {getTranslation('workerAge', lang)}
                      </label>
                      <input
                        type="number"
                        required
                        min={18}
                        max={90}
                        placeholder="eg. 32"
                        className="w-full px-3 py-2.5 bg-white/[0.03] border-2 border-white/10 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-white font-bold text-sm focus:outline-none transition-all"
                        value={age}
                        onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1">
                        {getTranslation('workerPhone', lang)}
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="eg. 9123456780"
                        className="w-full px-3 py-2.5 bg-white/[0.03] border-2 border-white/10 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-white font-bold text-sm focus:outline-none transition-all font-mono tracking-wider"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  {/* Worker's Home State / District (native origin, independent of the supervisor's own operating area) */}
                  <div className="grid grid-cols-2 gap-3 p-2.5 bg-white/[0.03] rounded-xl border-2 border-white/10">
                    <div>
                      <label className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">
                        {getTranslation('nativeState', lang)}
                      </label>
                      <select
                        className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-600"
                        value={homeState}
                        onChange={(e) => {
                          setHomeState(e.target.value);
                          setHomeDistrict(STATES_AND_DISTRICTS[e.target.value][0]);
                        }}
                      >
                        {Object.keys(STATES_AND_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">
                        {getTranslation('nativeDistrict', lang)}
                      </label>
                      <select
                        className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-600"
                        value={homeDistrict}
                        onChange={(e) => setHomeDistrict(e.target.value)}
                      >
                        {STATES_AND_DISTRICTS[homeState].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Skill selector */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1">
                      {getTranslation('skillTrade', lang)}
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-3 py-2.5 bg-white/[0.03] border-2 border-white/10 rounded-lg text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20"
                          disabled={isCustomSkill}
                          value={skill}
                          onChange={(e) => setSkill(e.target.value)}
                        >
                          {SKILL_CATEGORIES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                            isCustomSkill 
                              ? 'bg-emerald-700 border-emerald-700 text-white' 
                              : 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/15'
                          }`}
                          onClick={() => setIsCustomSkill(!isCustomSkill)}
                        >
                          {lang === 'en' ? 'Other' : 'மற்றவை'}
                        </button>
                      </div>
                      {isCustomSkill && (
                        <input
                          type="text"
                          required
                          placeholder="Type custom skill..."
                          className="w-full px-3 py-2.5 bg-white/[0.03] border-2 border-white/10 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-xs font-bold text-slate-100"
                          value={customSkill}
                          onChange={(e) => setCustomSkill(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* ID Proof & Capture */}
                  <div className="bg-white/[0.03] p-3.5 rounded-xl border-2 border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          {getTranslation('idProofType', lang)}
                        </label>
                        <select
                          className="w-full px-2 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-600"
                          value={idProofType}
                          onChange={(e) => setIdProofType(e.target.value)}
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
                          onClick={() => setCameraTarget('id')}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {lang === 'en' ? 'ID Photo Capture' : 'அடையாள சான்று படம்'}
                        </button>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          ref={idFileInputRef}
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, 'id')}
                        />
                        <button
                          type="button"
                          className="w-full py-2.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center justify-center gap-1 shadow cursor-pointer"
                          onClick={() => idFileInputRef.current?.click()}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {lang === 'en' ? 'Upload from Device' : 'சாதனத்திலிருந்து பதிவேற்று'}
                        </button>
                      </div>
                    </div>

                    <div className="h-24 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
                      {idProofPhoto ? (
                        <img src={idProofPhoto} alt="ID Preview" className="w-full h-full object-contain" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                  </div>

                  {/* Instant Travel Toggle */}
                  <div className="flex justify-between items-center bg-white/[0.03] p-3 rounded-xl border-2 border-white/10">
                    <div>
                      <span className="block text-xs font-black text-white">{getTranslation('availabilityToggle', lang)}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Ready to travel to other states for work immediately</span>
                    </div>
                    <button
                      type="button"
                      className="text-emerald-400 active:scale-95 transition-all cursor-pointer"
                      onClick={() => setIsAvailable(!isAvailable)}
                    >
                      {isAvailable ? (
                        <ToggleRight className="w-10 h-10 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Form Buttons */}
                <button
                  id="btn-save-worker"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md active:translate-y-0.5 active:border-b-0 cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-slate-950 border-t-transparent"></span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {getTranslation('saveWorker', lang)}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 10. Deployment Confirmations Tab */}
        {activeTab === 'deployments' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {getTranslation('incomingRequests', lang)}
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                <CheckCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No active travel/deployment requests from HR.</p>
              </div>
            ) : (
              <div className="space-y-3" id="supervisor-deployments-list">
                {pendingRequests.map((dep) => {
                  const workerObj = workers.find(w => w.id === dep.workerId);
                  const projObj = projects.find(p => p.id === dep.projectId);
                  if (!workerObj || !projObj) return null;

                  return (
                    <div key={dep.id} className="bg-white/5 p-4 rounded-2xl border-2 border-white/10 space-y-3 shadow-sm hover:border-emerald-400 transition-all">
                      <div className="flex items-start gap-3">
                        <img
                          src={workerObj.profilePhotoUrl}
                          alt={workerObj.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-white/10 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-extrabold text-white truncate leading-none">{workerObj.name}</h4>
                          <span className="text-[9px] font-mono text-emerald-400 font-black uppercase tracking-widest mt-1 block">{workerObj.skill}</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white/[0.03] rounded-lg border-2 border-white/10 text-xs text-slate-100">
                        <div className="font-extrabold text-white">{projObj.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-bold">📍 {projObj.locationDistrict}, {projObj.locationState}</div>
                        <div className="text-[10px] text-slate-300 font-mono mt-2 bg-emerald-500/10 border border-emerald-500/20 p-1 px-2 rounded inline-block">
                          {dep.startDate} to {dep.endDate}
                        </div>
                      </div>

                      {/* Tactical deployment confirmation buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 text-white font-black uppercase tracking-wider text-xs rounded-lg shadow transition-all flex items-center justify-center gap-1 active:translate-y-0.5 active:border-b-0 cursor-pointer"
                          onClick={() => handleConfirmDeployment(dep.id, true)}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {lang === 'en' ? 'Confirm Deployment' : 'பயணத்தை உறுதிசெய்'}
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2.5 bg-white/10 hover:bg-white/15 border-2 border-white/10 text-slate-300 font-black text-xs rounded-lg transition-all cursor-pointer"
                          onClick={() => handleConfirmDeployment(dep.id, false)}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 11. Custom tactile mobile bottom navigation bar */}
      <nav className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900 border-t-4 border-amber-500 flex justify-around items-center sticky bottom-0 z-30 shadow-xl">
        <button
          type="button"
          className={`flex flex-col items-center justify-center gap-1 py-1.5 flex-1 transition-all cursor-pointer ${
            activeTab === 'list' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => { setActiveTab('list'); setSelectedWorker(null); }}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] tracking-wider uppercase font-bold">{getTranslation('myWorkers', lang)}</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center justify-center -translate-y-4 shadow-lg cursor-pointer"
          onClick={() => { setActiveTab('add'); setSelectedWorker(null); }}
        >
          <div className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-lg border-4 border-slate-900 active:scale-95 transition-all">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-extrabold uppercase tracking-wider">{lang === 'en' ? 'Register' : 'பதிவு'}</span>
        </button>

        <button
          type="button"
          className={`flex flex-col items-center justify-center gap-1 py-1.5 flex-1 transition-all relative cursor-pointer ${
            activeTab === 'deployments' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => { setActiveTab('deployments'); setSelectedWorker(null); }}
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-[10px] tracking-wider uppercase font-bold">{lang === 'en' ? 'Confirmations' : 'அமர்த்தல்கள்'}</span>
          {pendingRequests.length > 0 && (
            <span className="absolute top-1 right-8 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-slate-900">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </nav>

      {cameraTarget && (
        <CameraCaptureModal
          lang={lang}
          facingMode={cameraTarget === 'id' ? 'environment' : 'user'}
          onCapture={handleCameraCapture}
          onClose={() => setCameraTarget(null)}
        />
      )}
    </div>
  );
}
