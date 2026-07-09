import React, { useState } from 'react';
import { getTranslation } from '../translations';
import { UserRole, UserProfile } from '../types';
import { authenticateAndGetProfile } from '../utils';
import { Shield, Phone, Mail, ChevronRight, UserCheck, AlertTriangle } from 'lucide-react';

interface LoginViewProps {
  lang: 'en' | 'ta';
  onLoginSuccess: (user: UserProfile) => void;
}

export default function LoginView({ lang, onLoginSuccess }: LoginViewProps) {
  const [loginMode, setLoginMode] = useState<'supervisor' | 'staff'>('supervisor');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError(lang === 'en' ? 'Please enter a valid 10-digit mobile number' : 'தயவுசெய்து செல்லுபடியாகும் 10-இலக்க கைபேசி எண்ணை உள்ளிடவும்');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
    }, 800);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError(lang === 'en' ? 'Please enter the 6-digit OTP code' : 'தயவுசெய்து 6-இலக்க ஒடிபி குறியீட்டை உள்ளிடவும்');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const profile = await authenticateAndGetProfile('supervisor', phoneNumber || '9876543210', 'Selvam Swamy');
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error(err);
      setError(lang === 'en' ? `Verification failed: ${err.message}` : `சரிபார்ப்பு தோல்வியுற்றது: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === 'en' ? 'Please fill in all fields' : 'தயவுசெய்து அனைத்து புலங்களையும் நிரப்பவும்');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const isAd = email.toLowerCase().includes('admin') || email === 'igobackend2@gmail.com';
      const role = isAd ? 'admin' : 'hr';
      const name = isAd ? 'CEO Office Admin' : 'Deepak HR Officer';
      const profile = await authenticateAndGetProfile(role, email, name);
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error(err);
      setError(lang === 'en' ? `Login failed: ${err.message}` : `உள்நுழைவு தோல்வியுற்றது: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickDemo = async (role: UserRole) => {
    setError('');
    setLoading(true);
    try {
      let profile;
      if (role === 'supervisor') {
        profile = await authenticateAndGetProfile('supervisor', '9876543210', 'Selvam Swamy');
      } else if (role === 'hr') {
        profile = await authenticateAndGetProfile('hr', 'deepak.hr@igogroup.com', 'Deepak HR Officer');
      } else {
        profile = await authenticateAndGetProfile('admin', 'igobackend2@gmail.com', 'CEO Office Admin');
      }
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error(err);
      setError(lang === 'en' ? `Bypass login failed: ${err.message}` : `உள்நுழைவு தோல்வியுற்றது: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="w-full max-w-md mx-auto glass-card rounded-[28px] shadow-xl overflow-hidden text-slate-800 border border-white/50 animate-fadeIn">
      {/* Visual Header */}
      <div className="p-6 bg-slate-950 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 opacity-30 blur-2xl"></div>
        <div className="inline-flex p-3 bg-indigo-600 rounded-full text-white mb-3 shadow-lg shadow-indigo-500/20 relative z-10">
          <Shield className="w-6 h-6 stroke-[2]" />
        </div>
        <h1 className="text-xl font-black font-sans tracking-tight uppercase text-white leading-none relative z-10">
          {getTranslation('appName', lang)}
        </h1>
        <p className="text-[9px] text-indigo-400 font-bold mt-1.5 uppercase tracking-widest font-sans relative z-10">
          {getTranslation('portalSubtitle', lang)}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Toggle Mode Buttons */}
        <div className="flex bg-slate-100/80 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50" id="login-mode-tabs">
          <button
            id="tab-supervisor"
            type="button"
            className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMode === 'supervisor'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => { setLoginMode('supervisor'); setError(''); }}
          >
            <Phone className="w-3.5 h-3.5" />
            {getTranslation('roleSupervisor', lang)}
          </button>
          <button
            id="tab-staff"
            type="button"
            className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMode === 'staff'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => { setLoginMode('staff'); setError(''); }}
          >
            <Mail className="w-3.5 h-3.5" />
            {lang === 'en' ? 'Internal Staff' : 'உள் பணியாளர்'}
          </button>
        </div>

        {error && (
          <div id="login-error-alert" className="p-3.5 bg-rose-50 border border-rose-200/70 rounded-2xl text-rose-700 text-xs flex items-start gap-2.5 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Supervisor Mobile Phone + OTP Form */}
        {loginMode === 'supervisor' && (
          <div id="supervisor-login-form" className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {getTranslation('mobileNumber', lang)}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 text-xs font-black">+91</span>
                    <input
                      id="input-phone"
                      type="tel"
                      maxLength={10}
                      placeholder={getTranslation('enterPhone', lang)}
                      className="w-full pl-11 pr-4 py-2.5 bg-white/70 border border-slate-200/80 focus:border-indigo-600 rounded-xl text-slate-900 font-bold text-xs focus:outline-none tracking-wider placeholder-slate-400 focus:ring-4 focus:ring-indigo-100 transition-all font-sans"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <button
                  id="btn-send-otp"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-wider text-[11px] rounded-xl transition-all shadow-md cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      {getTranslation('sendOtp', lang)}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {getTranslation('otpCode', lang)}
                  </label>
                  <input
                    id="input-otp"
                    type="text"
                    maxLength={6}
                    placeholder={getTranslation('enterOtp', lang)}
                    className="w-full px-4 py-2.5 bg-white/70 border border-slate-200/80 focus:border-indigo-600 rounded-xl text-center text-slate-900 font-bold text-lg focus:outline-none tracking-widest placeholder-slate-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-[10px] text-slate-500 font-bold">SMS sent to +91 {phoneNumber}</span>
                    <button
                      type="button"
                      className="text-[10px] text-indigo-700 hover:text-indigo-900 font-black uppercase tracking-wider"
                      onClick={() => setOtpSent(false)}
                    >
                      {lang === 'en' ? 'Change Phone' : 'எண்ணை மாற்றவும்'}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-verify-login"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[11px] rounded-xl transition-all shadow-md cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      {getTranslation('verifyLogin', lang)}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Staff Email/Password Form */}
        {loginMode === 'staff' && (
          <form onSubmit={handleStaffLogin} className="space-y-4" id="staff-login-form">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {getTranslation('emailAddress', lang)}
              </label>
              <input
                id="input-email"
                type="email"
                placeholder="eg. deepak.hr@igogroup.com"
                className="w-full px-4 py-2.5 bg-white/70 border border-slate-200/80 focus:border-indigo-600 rounded-xl text-slate-900 font-bold text-xs focus:outline-none placeholder-slate-400 focus:ring-4 focus:ring-indigo-100 transition-all font-sans"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {getTranslation('password', lang)}
              </label>
              <input
                id="input-password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white/70 border border-slate-200/80 focus:border-indigo-600 rounded-xl text-slate-900 font-bold text-xs focus:outline-none placeholder-slate-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              id="btn-staff-login"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-wider text-[11px] rounded-xl transition-all shadow-md cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  {getTranslation('loginBtn', lang)}
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Demo Bypass Access Section */}
        <div className="mt-8 pt-6 border-t border-slate-200/60" id="demo-quick-bypass">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center mb-3">
            ⚡ {getTranslation('demoBypass', lang)}
          </h3>
          <div className="space-y-2">
            <button
              id="demo-btn-supervisor"
              type="button"
              className="w-full flex items-center justify-between p-3 bg-white/60 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-2xl text-left transition-all text-xs cursor-pointer group"
              onClick={() => triggerQuickDemo('supervisor')}
            >
              <div>
                <span className="font-extrabold text-slate-800">Selvam Swamy</span>
                <span className="block text-[9px] text-indigo-600 font-extrabold uppercase tracking-widest mt-0.5">Area Supervisor (Madurai, TN)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
            </button>
            <button
              id="demo-btn-hr"
              type="button"
              className="w-full flex items-center justify-between p-3 bg-white/60 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-2xl text-left transition-all text-xs cursor-pointer group"
              onClick={() => triggerQuickDemo('hr')}
            >
              <div>
                <span className="font-extrabold text-slate-800">Deepak Kumar</span>
                <span className="block text-[9px] text-indigo-600 font-extrabold uppercase tracking-widest mt-0.5">Project / HR Team (Pan-India)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
            </button>
            <button
              id="demo-btn-admin"
              type="button"
              className="w-full flex items-center justify-between p-3 bg-white/60 hover:bg-rose-50/40 border border-slate-200/80 hover:border-rose-300 rounded-2xl text-left transition-all text-xs cursor-pointer group"
              onClick={() => triggerQuickDemo('admin')}
            >
              <div>
                <span className="font-extrabold text-slate-800">CEO Office Rep</span>
                <span className="block text-[9px] text-rose-600 font-extrabold uppercase tracking-widest mt-0.5">Admin & CEO (Pan-India Stats)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-rose-600 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
