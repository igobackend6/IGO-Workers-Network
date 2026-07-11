import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getTranslation } from '../translations';
import { UserProfile } from '../types';
import { Mail, ChevronLeft, UserCheck, AlertTriangle, Crown } from 'lucide-react';

interface AdminLoginViewProps {
  lang: 'en' | 'ta';
  onLoginSuccess: (user: UserProfile) => void;
  onBack: () => void;
}

// Strict allowlist: only these two accounts may ever access CEO & Admin / Pan-India Stats.
// This is defense-in-depth on top of the fact that only these 2 accounts exist in Firebase Auth.
const ALLOWED_ADMIN_EMAILS = ['admin@igogroups.com', 'ceo@igogroups.in'];

export default function AdminLoginView({ lang, onLoginSuccess, onBack }: AdminLoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === 'en' ? 'Please fill in all fields' : 'தயவுசெய்து அனைத்து புலங்களையும் நிரப்பவும்');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!ALLOWED_ADMIN_EMAILS.includes(normalizedEmail)) {
      setError(lang === 'en' ? 'This email is not authorized for CEO & Admin access.' : 'இந்த மின்னஞ்சல் நிர்வாக அணுகலுக்கு அங்கீகரிக்கப்படவில்லை.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const roleSnap = await getDoc(doc(db, 'roles', cred.user.uid));
      const roleData = roleSnap.exists() ? (roleSnap.data() as any) : null;

      if (!roleData || roleData.role !== 'admin') {
        await signOut(auth);
        setError(lang === 'en' ? 'This account is not authorized for CEO & Admin access.' : 'இந்த கணக்கு நிர்வாக அணுகலுக்கு அங்கீகரிக்கப்படவில்லை.');
        return;
      }

      onLoginSuccess({
        uid: cred.user.uid,
        email: cred.user.email || normalizedEmail,
        name: roleData.name || 'Admin',
        role: 'admin',
      });
    } catch (err: any) {
      console.error(err);
      setError(lang === 'en' ? 'Invalid email or password.' : 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      id="admin-login-container"
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
            <Crown className="w-4 h-4 text-rose-400" />
            {getTranslation('roleAdmin', lang)}
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
              id="admin-login-error-alert"
              className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 font-semibold animate-shake"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleLogin}
          className="space-y-4"
          id="admin-login-form"
        >
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {getTranslation('emailAddress', lang)}
            </label>
            <div className="relative group">
              <Mail className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
              <input
                id="input-email"
                type="email"
                placeholder="admin@igogroups.com"
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/15 focus:border-rose-500 rounded-xl text-white font-bold text-xs focus:outline-none placeholder-slate-500 focus:ring-4 focus:ring-rose-500/20 transition-all font-sans"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {getTranslation('password', lang)}
            </label>
            <input
              id="input-password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 focus:border-rose-500 rounded-xl text-white font-bold text-xs focus:outline-none placeholder-slate-500 focus:ring-4 focus:ring-rose-500/20 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <motion.button
            id="btn-staff-login"
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="btn-sheen w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider text-[11px] rounded-xl transition-colors shadow-md cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                {getTranslation('loginBtn', lang)}
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </motion.div>
  );
}
