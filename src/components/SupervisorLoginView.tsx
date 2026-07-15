import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';
import { getTranslation } from '../translations';
import { UserProfile } from '../types';
import { Phone, ChevronRight, ChevronLeft, UserCheck, AlertTriangle, UserRound } from 'lucide-react';

interface SupervisorLoginViewProps {
  lang: 'en' | 'ta';
  onLoginSuccess: (user: UserProfile) => void;
  onBack: () => void;
}

interface VerifyOtpResponse {
  customToken: string;
  name: string;
  assignedState?: string;
  assignedDistrict?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data as T;
}

export default function SupervisorLoginView({ lang, onLoginSuccess, onBack }: SupervisorLoginViewProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(lang === 'en' ? 'Please enter your full name' : 'உங்கள் முழுப் பெயரை உள்ளிடவும்');
      return;
    }
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError(lang === 'en' ? 'Please enter a valid 10-digit mobile number' : 'தயவுசெய்து செல்லுபடியாகும் 10-இலக்க கைபேசி எண்ணை உள்ளிடவும்');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await postJson('/api/supervisor/send-otp', { phone: phoneNumber });
      setOtpSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || (lang === 'en' ? 'Could not send OTP.' : 'ஒடிபி அனுப்ப முடியவில்லை.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError(lang === 'en' ? 'Please enter the 6-digit OTP code' : 'தயவுசெய்து 6-இலக்க ஒடிபி குறியீட்டை உள்ளிடவும்');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await postJson<VerifyOtpResponse>('/api/supervisor/verify-otp', {
        phone: phoneNumber,
        otp: otpCode,
        name: name.trim(),
      });
      const { customToken, name: resolvedName, assignedState, assignedDistrict } = result;
      const cred = await signInWithCustomToken(auth, customToken);

      onLoginSuccess({
        uid: cred.user.uid,
        name: resolvedName,
        role: 'supervisor',
        phone: phoneNumber,
        assignedState,
        assignedDistrict,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || (lang === 'en' ? 'Verification failed.' : 'சரிபார்ப்பு தோல்வியுற்றது.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      id="supervisor-login-container"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md mx-auto glass-card rounded-[28px] shadow-2xl shadow-black/40 overflow-hidden text-slate-100 border border-white/10"
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-back-to-roles"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            {getTranslation('phoneLogin', lang)}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              id="supervisor-login-error-alert"
              className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 font-semibold animate-shake"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.form
              key="phone-step"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {lang === 'en' ? 'Full Name' : 'முழு பெயர்'}
                </label>
                <div className="relative group">
                  <UserRound className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    id="input-supervisor-name"
                    type="text"
                    placeholder={lang === 'en' ? 'eg. Selvam Swamy' : 'எ.கா. செல்வம் சாமி'}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/15 focus:border-emerald-500 rounded-xl text-white font-bold text-xs focus:outline-none placeholder-slate-500 focus:ring-4 focus:ring-emerald-500/20 transition-all font-sans"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {getTranslation('mobileNumber', lang)}
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-3 text-slate-500 text-xs font-black group-focus-within:text-emerald-400 transition-colors">+91</span>
                  <input
                    id="input-phone"
                    type="tel"
                    maxLength={10}
                    placeholder={getTranslation('enterPhone', lang)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/15 focus:border-emerald-500 rounded-xl text-white font-bold text-xs focus:outline-none tracking-wider placeholder-slate-500 focus:ring-4 focus:ring-emerald-500/20 transition-all font-sans"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
              </div>

              <motion.button
                id="btn-send-otp"
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-sheen w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-[11px] rounded-xl transition-colors shadow-md cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    {getTranslation('sendOtp', lang)}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="otp-step"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {getTranslation('otpCode', lang)}
                </label>
                <input
                  id="input-otp"
                  type="text"
                  maxLength={6}
                  placeholder={getTranslation('enterOtp', lang)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/15 focus:border-emerald-500 rounded-xl text-center text-white font-bold text-lg focus:outline-none tracking-widest placeholder-slate-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <div className="flex justify-between items-center mt-2 px-1">
                  <span className="text-[10px] text-slate-400 font-bold">SMS sent to +91 {phoneNumber}</span>
                  <button
                    type="button"
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-black uppercase tracking-wider cursor-pointer"
                    onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                  >
                    {lang === 'en' ? 'Change Phone' : 'எண்ணை மாற்றவும்'}
                  </button>
                </div>
              </div>

              <motion.button
                id="btn-verify-login"
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-sheen w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-[11px] rounded-xl transition-colors shadow-md cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    {getTranslation('verifyLogin', lang)}
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
