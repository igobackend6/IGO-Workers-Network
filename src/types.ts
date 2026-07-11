export type UserRole = 'supervisor' | 'hr' | 'admin';

export interface UserProfile {
  uid: string;
  email?: string;
  phone?: string;
  name: string;
  role: UserRole;
  assignedState?: string;
  assignedDistrict?: string;
  isSandbox?: boolean;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  age: number;
  homeState: string;
  homeDistrict: string;
  skill: string;
  idProofType: string;
  idProofPhotoUrl: string; // Can be a base64 string during offline registration
  profilePhotoUrl: string; // Can be a base64 string during offline registration
  availability: 'available' | 'deployed' | 'unavailable';
  supervisorId: string;
  createdAt: string;
  lastUpdatedAt: string;
  status: 'active' | 'archived';
  pendingSync?: boolean;
  errorSync?: boolean;
}

export interface Supervisor {
  id: string;
  name: string;
  phone: string;
  assignedState: string;
  assignedDistrict: string;
  workerCount: number;
  lastActiveAt: string;
  profilePhotoUrl?: string;
  idProofType?: string;
  idProofPhotoUrl?: string;
}

export interface RequiredSkill {
  skill: string;
  count: number;
}

export interface Project {
  id: string;
  name: string;
  locationState: string;
  locationDistrict: string;
  status: 'active' | 'completed' | 'on-hold';
  requiredSkills: RequiredSkill[];
  assignedSupervisorId?: string;
}

export interface Deployment {
  id: string;
  workerId: string;
  projectId: string;
  requestedBy: string; // HR name or ID
  status: 'requested' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
}

export interface VerificationLog {
  id: string;
  workerId: string;
  checkedBy: string;
  checkedAt: string;
  result: 'pass' | 'fail' | 'pending';
  notes: string;
}

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    ta: string;
  };
}
