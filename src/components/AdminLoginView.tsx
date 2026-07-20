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

// Strict allowlist: only this account may ever access the Admin Portal.
// This is defense-in-depth on top of the fact that only this account exists in Firebase Auth.
const ALLOWED_ADMIN_EMAILS = ['admin@igogroups.com'];

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

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
      setError(lang === 'en' ? 'This email is not authorized for Admin Portal access.' : 'இந்த மின்னஞ்சல் நிர்வாக போர்டல் அணுகலுக்கு அங்கீகரிக்கப்படவில்லை.');
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
        setError(lang === 'en' ? 'This account is not authorized for Admin Portal access.' : 'இந்த கணக்கு நிர்வாக போர்டல் அணுகலுக்கு அங்கீகரிக்கப்படவில்லை.');
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
      transition={springTransition}
      className="w-full max-w-md mx-auto bento-surface rounded-[2rem] overflow-hidden text-slate-900"
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-back-to-roles"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-900/8 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Crown className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
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
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start gap-2.5 font-semibold animate-shake"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" strokeWidth={1.5} />
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
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {getTranslation('emailAddress', lang)}
            </label>
            <div className="relative group">
              <Mail className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 group-focus-within:text-emerald-600 transition-colors" strokeWidth={1.5} />
              <input
                id="input-email"
                type="email"
                placeholder="admin@igogroups.com"
                className="w-full pl-9 pr-4 py-2.5 surface-input rounded-xl text-slate-900 font-bold text-xs focus:outline-none placeholder-slate-400 transition-all font-sans"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {getTranslation('password', lang)}
            </label>
            <input
              id="input-password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 surface-input rounded-xl text-slate-900 font-bold text-xs focus:outline-none placeholder-slate-400 transition-all"
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
            className="btn-sheen w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-[11px] rounded-xl transition-colors shadow-sm cursor-pointer flex justify-center items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" strokeWidth={1.5} />
                {getTranslation('loginBtn', lang)}
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </motion.div>
  );
}
