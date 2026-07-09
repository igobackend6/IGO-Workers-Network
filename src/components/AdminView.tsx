import React, { useState, useEffect } from 'react';
import { Worker, Supervisor, Deployment, Project, VerificationLog, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType, collection, onSnapshot, doc, setDoc } from '../firebase';
import { getTranslation } from '../translations';
import { STATES_AND_DISTRICTS } from '../data';
import { 
  TrendingUp, Users, CheckCircle, ShieldAlert, Award, 
  Map, Clock, FileCheck, Check, AlertTriangle, Plus, ClipboardList
} from 'lucide-react';

interface AdminViewProps {
  user: UserProfile;
  lang: 'en' | 'ta';
}

export default function AdminView({ user, lang }: AdminViewProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);

  // Compliance Verification Form states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyWorkerId, setVerifyWorkerId] = useState('');
  const [verifyResult, setVerifyResult] = useState<'pass' | 'fail'>('pass');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

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

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Project);
      });
      setProjects(list);
    });

    const unsubLogs = onSnapshot(collection(db, 'verificationLog'), (snapshot) => {
      const list: VerificationLog[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as VerificationLog);
      });
      setVerificationLogs(list);
    });

    return () => {
      unsubWorkers();
      unsubSupervisors();
      unsubDeployments();
      unsubProjects();
      unsubLogs();
    };
  }, []);

  // 2. High-Level Core Analytics Calculation
  const totalRegistered = workers.length;
  const totalAvailable = workers.filter(w => w.availability === 'available').length;
  const totalDeployed = workers.filter(w => w.availability === 'deployed').length;
  const placementRate = totalRegistered > 0 ? Math.round((totalDeployed / totalRegistered) * 100) : 0;

  // 3. Stale worker profiles (no updates in 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const flaggedWorkers = workers.filter(w => {
    const lastUpdateDate = new Date(w.lastUpdatedAt);
    return lastUpdateDate < thirtyDaysAgo;
  });

  // 4. State-wise aggregated database
  const stateSummary = Object.keys(STATES_AND_DISTRICTS).map((stateName) => {
    const stateWorkers = workers.filter(w => w.homeState === stateName);
    const regCount = stateWorkers.length;
    const availCount = stateWorkers.filter(w => w.availability === 'available').length;
    const depCount = stateWorkers.filter(w => w.availability === 'deployed').length;
    const statePlacementRate = regCount > 0 ? Math.round((depCount / regCount) * 100) : 0;

    return {
      state: stateName,
      registered: regCount,
      available: availCount,
      deployed: depCount,
      rate: statePlacementRate
    };
  }).filter(item => item.registered > 0); // Only show states with registered workers

  // 5. Submit Verification Log
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyWorkerId) {
      alert("Please select a worker to verify.");
      return;
    }
    setSubmittingLog(true);

    const logId = "log-" + Date.now();
    const newLog: VerificationLog = {
      id: logId,
      workerId: verifyWorkerId,
      checkedBy: user.name,
      checkedAt: new Date().toISOString(),
      result: verifyResult,
      notes: verifyNotes || "Vetted Aadhaar particulars. Details confirmed with supervisor."
    };

    try {
      await setDoc(doc(db, 'verificationLog', logId), newLog);
      alert("Officer safety and verification log recorded successfully!");
      setIsVerifying(false);
      setVerifyWorkerId('');
      setVerifyNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `verificationLog/${logId}`);
    } finally {
      setSubmittingLog(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 text-slate-800 font-sans" id="admin-portal-root">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-5 rounded-3xl border-b-4 border-amber-500 mb-6 shadow-md">
        <div>
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">Executive Intelligence Core</span>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1 uppercase tracking-tight">
            <Award className="w-6 h-6 text-amber-400 shrink-0" />
            {getTranslation('panIndiaDashboard', lang)}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Logged in: <strong className="text-amber-400 font-bold">{user.name}</strong> • Real-time Pan-India summary & compliance auditing.
          </p>
        </div>

        {/* Quick info widgets */}
        <div className="flex gap-2 text-xs">
          <div className="bg-slate-950/80 p-2.5 px-4 rounded-2xl border border-slate-800/80 shadow-inner">
            <span className="text-[10px] text-slate-500 block uppercase font-black tracking-wider">Pan-India Projects</span>
            <span className="font-extrabold text-amber-400 text-sm">{projects.length} sites active</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 px-4 rounded-2xl border border-slate-800/80 shadow-inner">
            <span className="text-[10px] text-slate-500 block uppercase font-black tracking-wider">Placements</span>
            <span className="font-extrabold text-emerald-400 text-sm">{deployments.filter(d => d.status === 'active').length} onsite</span>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Registered */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-200">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Registered</span>
            <span className="text-2xl font-black text-slate-900">{totalRegistered}</span>
            <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Informal workers catalogued</span>
          </div>
        </div>

        {/* Card 2: Available */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Ready / Available</span>
            <span className="text-2xl font-black text-slate-900">{totalAvailable}</span>
            <span className="text-[10px] text-emerald-600 font-extrabold block mt-0.5">{Math.round((totalAvailable/totalRegistered)*100 || 0)}% of worker pool</span>
          </div>
        </div>

        {/* Card 3: Deployed */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-200">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Active Placement Rate</span>
            <span className="text-2xl font-black text-slate-900">{placementRate}%</span>
            <span className="text-[10px] text-indigo-700 font-extrabold block mt-0.5">{totalDeployed} deployed onsite</span>
          </div>
        </div>

        {/* Card 4: Flagged */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Stale / Flagged Records</span>
            <span className="text-2xl font-black text-rose-600">{flaggedWorkers.length}</span>
            <span className="text-[10px] text-rose-600 font-extrabold block mt-0.5">Stale &gt;30 days without update</span>
          </div>
        </div>
      </div>

      {/* 3. Detailed Regional and Supervisor Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Regional State-wise Registry Summary */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <Map className="w-4 h-4 text-indigo-600" />
            {getTranslation('stateWiseSummary', lang)}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="state-wise-table">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 font-black uppercase pb-2 text-[10px]">
                  <th className="py-2">State</th>
                  <th className="py-2 text-center">Registered</th>
                  <th className="py-2 text-center">Available</th>
                  <th className="py-2 text-center">Deployed</th>
                  <th className="py-2 text-right">Placements Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans font-semibold text-slate-700">
                {stateSummary.map((item) => (
                  <tr key={item.state} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 font-extrabold text-slate-900">{item.state}</td>
                    <td className="py-3 text-center text-slate-800 font-mono font-bold">{item.registered}</td>
                    <td className="py-3 text-center text-emerald-600 font-mono font-bold">{item.available}</td>
                    <td className="py-3 text-center text-indigo-600 font-mono font-bold">{item.deployed}</td>
                    <td className="py-3 text-right font-black font-mono text-indigo-700">{item.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supervisor Performance Leaderboard */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm" id="supervisor-leaderboard">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <Award className="w-4 h-4 text-amber-500" />
            {getTranslation('supervisorLeaderboard', lang)}
          </h3>

          <div className="space-y-3">
            {supervisors.map((sup, idx) => {
              // Calculate placements count (confirmed/active/completed deployments of this supervisor's workers)
              const supWorkersIds = workers.filter(w => w.supervisorId === sup.id).map(w => w.id);
              const placementsCount = deployments.filter(d => 
                supWorkersIds.includes(d.workerId) && 
                (d.status === 'active' || d.status === 'completed' || d.status === 'confirmed')
              ).length;

              return (
                <div key={sup.id} className="p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center gap-3 hover:border-slate-200 transition-all">
                  <div className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-xs font-black font-mono">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-800 truncate">{sup.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold truncate">📍 {sup.assignedDistrict}, {sup.assignedState}</p>
                    <span className="text-[9px] text-slate-400 font-bold">Last active: {new Date(sup.lastActiveAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-700 block">{supWorkersIds.length} reg</span>
                    <span className="text-[9px] text-emerald-600 font-mono font-bold block">{placementsCount} placements</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Flagged queue & Vetting safety logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Stale/Flagged Records Tracker */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm" id="flagged-records-tracker">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
            {getTranslation('flaggedRecords', lang)}
          </h3>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {flaggedWorkers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-bold">
                Excellent! All registered worker records have been refreshed within the last 30 days.
              </div>
            ) : (
              flaggedWorkers.map((worker) => {
                const daysNoUpdate = Math.round((Date.now() - new Date(worker.lastUpdatedAt).getTime()) / (1000 * 60 * 60 * 24));
                const sup = supervisors.find(s => s.id === worker.supervisorId);
                
                return (
                  <div key={worker.id} className="p-3 bg-rose-50/50 border-2 border-rose-100 hover:border-rose-300 rounded-2xl flex items-center justify-between gap-2.5 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={worker.profilePhotoUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-rose-200 shadow-sm" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs text-slate-900 block truncate">{worker.name}</span>
                        <span className="text-[9px] text-slate-500 block truncate font-mono font-bold">Supervisor: {sup ? sup.name : 'Unknown'} (+91 {sup?.phone})</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-1 bg-rose-100 border border-rose-200 text-rose-800 font-mono text-[9px] font-black rounded-lg uppercase tracking-wider">
                        Stale {daysNoUpdate} days
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Administrative Officer Compliance Verification Log */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <ClipboardList className="w-4.5 h-4.5 text-indigo-600" />
            Vetting Verification Console
          </h3>

          {!isVerifying ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                As a compliance administrator, you can log security verification audits on active worker profiles (checking their photo credentials, native details, and Aadhaar files).
              </p>
              
              <button
                id="btn-open-verify-form"
                type="button"
                className="w-full py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                onClick={() => setIsVerifying(true)}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                {getTranslation('logVerificationBtn', lang)}
              </button>

              {/* Show last 3 audits registered */}
              <div className="space-y-2 pt-3 border-t-2 border-slate-100">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">Latest Security Vetting Logs</span>
                {verificationLogs.slice(-3).reverse().map((log) => {
                  const workerObj = workers.find(w => w.id === log.workerId);
                  return (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border-2 border-slate-100 text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-800 font-extrabold">{workerObj ? workerObj.name : 'Worker Verified'}</span>
                        <span className={log.result === 'pass' ? 'text-emerald-600 font-black tracking-wider text-xs' : 'text-rose-600 font-black tracking-wider text-xs'}>
                          {log.result === 'pass' ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-semibold italic">"{log.notes}"</p>
                      <div className="text-[9px] text-slate-400 font-mono font-bold flex justify-between">
                        <span>Checked by: {log.checkedBy}</span>
                        <span>{new Date(log.checkedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitVerification} className="space-y-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl animate-fadeIn" id="vetting-log-form">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Register Safety Audit Record</h4>
              
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Select Registered Worker to Vette
                </label>
                <select
                  required
                  className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                  value={verifyWorkerId}
                  onChange={(e) => setVerifyWorkerId(e.target.value)}
                >
                  <option value="">-- Choose Worker --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.skill})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Audit Outcome
                </label>
                <div className="flex bg-white p-1 rounded-xl border-2 border-slate-200">
                  <button
                    type="button"
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${verifyResult === 'pass' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    onClick={() => setVerifyResult('pass')}
                  >
                    PASS
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${verifyResult === 'fail' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    onClick={() => setVerifyResult('fail')}
                  >
                    DISCREPANCY
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                  Compliance Audit Notes
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Vetted profile photo and credentials. All details verified as accurate..."
                  className="w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 font-sans"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  id="btn-submit-vetting-log"
                  type="submit"
                  disabled={submittingLog}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition-all active:translate-y-0.5 active:border-b-0 cursor-pointer"
                >
                  {submittingLog ? 'Logging...' : 'Record Compliance Check'}
                </button>
                <button
                  type="button"
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
                  onClick={() => setIsVerifying(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
