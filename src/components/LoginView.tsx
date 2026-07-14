import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import RoleSelectView from './RoleSelectView';
import SupervisorLoginView from './SupervisorLoginView';
import HrLoginView from './HrLoginView';
import AdminLoginView from './AdminLoginView';
import CeoLoginView from './CeoLoginView';

interface LoginViewProps {
  lang: 'en' | 'ta';
  onLoginSuccess: (user: UserProfile) => void;
  onBackToHome?: () => void;
}

type LoginStage = 'roleSelect' | UserRole;

export default function LoginView({ lang, onLoginSuccess, onBackToHome }: LoginViewProps) {
  const [stage, setStage] = useState<LoginStage>('roleSelect');

  if (stage === 'supervisor') {
    return <SupervisorLoginView lang={lang} onLoginSuccess={onLoginSuccess} onBack={() => setStage('roleSelect')} />;
  }
  if (stage === 'hr') {
    return <HrLoginView lang={lang} onLoginSuccess={onLoginSuccess} onBack={() => setStage('roleSelect')} />;
  }
  if (stage === 'admin') {
    return <AdminLoginView lang={lang} onLoginSuccess={onLoginSuccess} onBack={() => setStage('roleSelect')} />;
  }
  if (stage === 'ceo') {
    return <CeoLoginView lang={lang} onLoginSuccess={onLoginSuccess} onBack={() => setStage('roleSelect')} />;
  }

  return <RoleSelectView lang={lang} onSelectRole={setStage} onBackToHome={onBackToHome} />;
}
