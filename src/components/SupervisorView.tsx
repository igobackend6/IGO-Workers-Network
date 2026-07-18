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

const CARD_SURFACE = 'bg-white border border-slate-900/8 shadow-[0_16px_32px_-16px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_-16px_rgba(0,0,0,0.1)] hover:border-emerald-500/30 transition-all duration-300';

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
    <div className={`flex flex-col min-h-[85dvh] bento-surface text-slate-900 mx-auto rounded-3xl pb-20 relative overflow-hidden transition-all ${activeTab === 'list' && !selectedWorker ? 'max-w-3xl' : 'max-w-md'}`}>
      {/* 1. Mobile Status Top Bar */}
      <header className="p-4 bg-white text-slate-900 sticky top-0 z-30 border-b border-slate-900/8 flex justify-between items-center">
        <div>
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest block">Supervisor Portal</span>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5 leading-tight uppercase tracking-tight">
            <span className="icon-badge-emerald inline-flex p-1.5 rounded-lg">
              <Smartphone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            </span>
            {user.name}
          </h2>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1">
          {isOnline ? (
            hasPendingWrites ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider rounded-full animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                {getTranslation('pendingSync', lang)}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-full">
                <Wifi className="w-3 h-3" strokeWidth={1.5} />
                {getTranslation('synced', lang)}
              </div>
            )
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 text-[9px] font-black uppercase tracking-wider rounded-full">
              <WifiOff className="w-3 h-3" strokeWidth={1.5} />
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
                <div className="surface-card p-4 rounded-2xl space-y-3" id="supervisor-assigned-projects">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
                      My Assigned Projects
                    </h3>
                    <span className="text-xs font-bold text-slate-500 font-mono">{myProjects.length}</span>
                  </div>

                  {myProjects.length === 0 ? (
                    <p className="text-[11px] font-bold text-slate-500">No projects assigned to you yet. HR will assign you when a project is ready.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {myProjects.map(proj => (
                        <div key={proj.id} className="p-3 bg-slate-50 rounded-xl border border-slate-900/8">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{proj.name}</h4>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0">{proj.status}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
                            {proj.locationDistrict}, {proj.locationState}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.requiredSkills.map(({ skill, count }) => (
                              <span key={skill} className="px-1.5 py-0.5 bg-white border border-slate-900/8 text-[9px] text-slate-600 font-bold uppercase tracking-wider rounded-md font-mono">
                                {skill} <span className="text-emerald-600">×{count}</span>
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
            <div className="surface-card p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {user.assignedDistrict}, {user.assignedState}
                </h3>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {workers.length} {getTranslation('registeredWorkers', lang)}
                </span>
              </div>

              <input
                type="text"
                placeholder={getTranslation('searchPlaceholder', lang)}
                className="w-full px-3.5 py-2.5 surface-input rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {getTranslation('myWorkers', lang)}
              </h3>

              <button
                type="button"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-[10px] rounded-xl flex items-center gap-1 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => setActiveTab('add')}
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                {getTranslation('addWorker', lang)}
              </button>
            </div>

            {/* List Items */}
            <div className="space-y-3" id="supervisor-workers-list">
              {filteredWorkers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-900/10">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-xs font-bold text-slate-500">No workers registered in this area yet.</p>
                </div>
              ) : (
                filteredWorkers.map((worker) => {
                  const isAvailable = worker.availability === 'available';
                  const isDeployed = worker.availability === 'deployed';

                  return (
                    <div
                      key={worker.id}
                      className={`p-3.5 rounded-2xl cursor-pointer flex items-center gap-3 relative overflow-hidden ${CARD_SURFACE}`}
                      onClick={() => setSelectedWorker(worker)}
                    >
                      {/* Worker Thumbnail */}
                      <img
                        src={worker.profilePhotoUrl}
                        alt={worker.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-900/8"
                        referrerPolicy="no-referrer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate leading-tight">{worker.name}</h4>
                        </div>
                        <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                          {worker.skill}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" strokeWidth={1.5} />
                          {worker.homeDistrict}, {worker.homeState}
                        </p>
                      </div>

                      {/* Availability status badge */}
                      <div className="text-right shrink-0">
                        {isAvailable ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-lg block text-center">
                            {getTranslation('available', lang)}
                          </span>
                        ) : isDeployed ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-lg block text-center">
                            {getTranslation('deployed', lang)}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider rounded-lg block text-center">
                            {getTranslation('unavailable', lang)}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-extrabold mt-1 block font-mono">Age: {worker.age}</span>
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
              className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-emerald-700 cursor-pointer"
              onClick={() => setSelectedWorker(null)}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              {lang === 'en' ? 'Back to Registry' : 'பட்டியலுக்குத் திரும்பு'}
            </button>

            <div className="surface-card rounded-2xl p-4 space-y-4">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 border-b border-slate-900/6 pb-4">
                <img
                  src={selectedWorker.profilePhotoUrl}
                  alt={selectedWorker.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-900/8"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-none">{selectedWorker.name}</h3>
                  <p className="text-xs text-emerald-700 font-black uppercase tracking-wider mt-1">{selectedWorker.skill}</p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                    +91 {selectedWorker.phone}
                  </p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-900/8">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Age</span>
                  <span className="font-extrabold text-slate-900 font-mono">{selectedWorker.age} years</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-900/8">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Native Region</span>
                  <span className="font-extrabold text-slate-900 truncate block">{selectedWorker.homeDistrict}, {selectedWorker.homeState}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-900/8">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">ID Document</span>
                  <span className="font-extrabold text-slate-900 block">{selectedWorker.idProofType}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-900/8">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Availability</span>
                  <span className={`font-extrabold block ${selectedWorker.availability === 'available' ? 'text-emerald-700' : selectedWorker.availability === 'deployed' ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {selectedWorker.availability.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* ID Proof Photo Display */}
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Captured ID Proof Doc</span>
                <div className="relative border border-slate-900/8 rounded-xl overflow-hidden bg-slate-50 h-40">
                  <img
                    src={selectedWorker.idProofPhotoUrl}
                    alt="ID Proof"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/85 rounded text-[9px] font-mono text-white">
                    {selectedWorker.idProofType} verification file
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-900/6 flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm active:scale-[0.98] cursor-pointer"
                  onClick={() => handleArchiveWorker(selectedWorker.id)}
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                  {getTranslation('archiveWorker', lang)}
                </button>
                <button
                  type="button"
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
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
              className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-emerald-700 cursor-pointer"
              onClick={() => setActiveTab('list')}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              {lang === 'en' ? 'Back' : 'பின்செல்'}
            </button>

            <div className="surface-card rounded-2xl p-4">
              <h3 className="text-lg font-black text-slate-900 mb-4 border-b border-slate-900/6 pb-2 uppercase tracking-tight">
                {getTranslation('addWorker', lang)}
              </h3>

              <form onSubmit={handleSubmitWorker} className="space-y-4">
                {/* 1. Profile Photo and Quick Actions */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-900/8">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                    {getTranslation('profilePhoto', lang)}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white border border-slate-900/8 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                      <button
                        type="button"
                        className="py-2 px-3 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        onClick={() => setCameraTarget('profile')}
                      >
                        <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
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
                        className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-900/8 rounded-lg text-xs font-bold text-slate-600 flex items-center justify-center gap-1 cursor-pointer"
                        onClick={() => profileFileInputRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {lang === 'en' ? 'Upload from Device' : 'சாதனத்திலிருந்து பதிவேற்று'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Worker Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      {getTranslation('workerName', lang)}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="eg. Muthu Karuppan"
                      className="w-full px-3 py-2.5 surface-input rounded-xl text-slate-900 font-bold text-sm focus:outline-none transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                        {getTranslation('workerAge', lang)}
                      </label>
                      <input
                        type="number"
                        required
                        min={18}
                        max={90}
                        placeholder="eg. 32"
                        className="w-full px-3 py-2.5 surface-input rounded-xl text-slate-900 font-bold text-sm focus:outline-none transition-all"
                        value={age}
                        onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                        {getTranslation('workerPhone', lang)}
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="eg. 9123456780"
                        className="w-full px-3 py-2.5 surface-input rounded-xl text-slate-900 font-bold text-sm focus:outline-none transition-all font-mono tracking-wider"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  {/* Worker's Home State / District (native origin, independent of the supervisor's own operating area) */}
                  <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-900/8">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">
                        {getTranslation('nativeState', lang)}
                      </label>
                      <select
                        className="w-full p-2 bg-white border border-slate-900/8 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
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
                      <label className="block text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">
                        {getTranslation('nativeDistrict', lang)}
                      </label>
                      <select
                        className="w-full p-2 bg-white border border-slate-900/8 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                        value={homeDistrict}
                        onChange={(e) => setHomeDistrict(e.target.value)}
                      >
                        {STATES_AND_DISTRICTS[homeState].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Skill selector */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      {getTranslation('skillTrade', lang)}
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-3 py-2.5 surface-input rounded-lg text-xs text-slate-900 font-bold focus:outline-none"
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
                          className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            isCustomSkill
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-900/8 text-slate-600 hover:bg-slate-50'
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
                          className="w-full px-3 py-2.5 surface-input rounded-xl text-xs font-bold text-slate-900"
                          value={customSkill}
                          onChange={(e) => setCustomSkill(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* ID Proof & Capture */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-900/8 space-y-3">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          {getTranslation('idProofType', lang)}
                        </label>
                        <select
                          className="w-full px-2 py-2.5 bg-white border border-slate-900/8 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
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
                          className="w-full py-2.5 px-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-wider text-white flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          onClick={() => setCameraTarget('id')}
                        >
                          <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
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
                          className="w-full py-2.5 px-2 bg-white hover:bg-slate-100 border border-slate-900/8 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center justify-center gap-1 cursor-pointer"
                          onClick={() => idFileInputRef.current?.click()}
                        >
                          <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                          {lang === 'en' ? 'Upload from Device' : 'சாதனத்திலிருந்து பதிவேற்று'}
                        </button>
                      </div>
                    </div>

                    <div className="h-24 bg-white border border-slate-900/8 rounded-xl flex items-center justify-center overflow-hidden">
                      {idProofPhoto ? (
                        <img src={idProofPhoto} alt="ID Preview" className="w-full h-full object-contain" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                      )}
                    </div>
                  </div>

                  {/* Instant Travel Toggle */}
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-900/8">
                    <div>
                      <span className="block text-xs font-black text-slate-900">{getTranslation('availabilityToggle', lang)}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Ready to travel to other states for work immediately</span>
                    </div>
                    <button
                      type="button"
                      className="active:scale-95 transition-all cursor-pointer"
                      onClick={() => setIsAvailable(!isAvailable)}
                    >
                      {isAvailable ? (
                        <ToggleRight className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Form Buttons */}
                <button
                  id="btn-save-worker"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" strokeWidth={1.5} />
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
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {getTranslation('incomingRequests', lang)}
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-900/10">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs font-bold text-slate-500">No active travel/deployment requests from HR.</p>
              </div>
            ) : (
              <div className="space-y-3" id="supervisor-deployments-list">
                {pendingRequests.map((dep) => {
                  const workerObj = workers.find(w => w.id === dep.workerId);
                  const projObj = projects.find(p => p.id === dep.projectId);
                  if (!workerObj || !projObj) return null;

                  return (
                    <div key={dep.id} className={`p-4 rounded-2xl space-y-3 ${CARD_SURFACE}`}>
                      <div className="flex items-start gap-3">
                        <img
                          src={workerObj.profilePhotoUrl}
                          alt={workerObj.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-900/8"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate leading-none">{workerObj.name}</h4>
                          <span className="text-[9px] font-mono text-emerald-700 font-black uppercase tracking-widest mt-1 block">{workerObj.skill}</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-900/8 text-xs text-slate-700">
                        <div className="font-extrabold text-slate-900">{projObj.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
                          {projObj.locationDistrict}, {projObj.locationState}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-mono mt-2 bg-emerald-50 border border-emerald-100 p-1 px-2 rounded inline-block">
                          {dep.startDate} to {dep.endDate}
                        </div>
                      </div>

                      {/* Deployment confirmation buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 active:scale-[0.98] cursor-pointer"
                          onClick={() => handleConfirmDeployment(dep.id, true)}
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                          {lang === 'en' ? 'Confirm Deployment' : 'பயணத்தை உறுதிசெய்'}
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-lg transition-all cursor-pointer"
                          onClick={() => handleConfirmDeployment(dep.id, false)}
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
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

      {/* 11. Tactile mobile bottom navigation bar */}
      <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-900/8 flex justify-around items-center sticky bottom-0 z-30">
        <button
          type="button"
          className={`flex flex-col items-center justify-center gap-1 py-1.5 flex-1 transition-all cursor-pointer ${
            activeTab === 'list' ? 'text-emerald-700 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
          onClick={() => { setActiveTab('list'); setSelectedWorker(null); }}
        >
          <Users className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[10px] tracking-wider uppercase font-bold">{getTranslation('myWorkers', lang)}</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center justify-center -translate-y-4 cursor-pointer"
          onClick={() => { setActiveTab('add'); setSelectedWorker(null); }}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-sm border-4 border-white active:scale-95 transition-all">
            <Plus className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-extrabold uppercase tracking-wider">{lang === 'en' ? 'Register' : 'பதிவு'}</span>
        </button>

        <button
          type="button"
          className={`flex flex-col items-center justify-center gap-1 py-1.5 flex-1 transition-all relative cursor-pointer ${
            activeTab === 'deployments' ? 'text-emerald-700 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
          onClick={() => { setActiveTab('deployments'); setSelectedWorker(null); }}
        >
          <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[10px] tracking-wider uppercase font-bold">{lang === 'en' ? 'Confirmations' : 'அமர்த்தல்கள்'}</span>
          {pendingRequests.length > 0 && (
            <span className="absolute top-1 right-8 w-4.5 h-4.5 bg-rose-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
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
