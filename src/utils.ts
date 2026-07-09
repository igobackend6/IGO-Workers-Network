import { writeBatch } from 'firebase/firestore';
import { db, auth, collection, doc, getDocs, setDoc, isSandbox, initLocalStorageDb } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { UserProfile } from './types';
import { INITIAL_PROJECTS, INITIAL_SUPERVISORS, INITIAL_WORKERS, INITIAL_DEPLOYMENTS } from './data';

/**
 * Compresses an image on the client-side using the HTML5 Canvas API
 * to optimize data usage before storing or uploading.
 */
export function compressImage(base64Str: string, maxWidth = 450, maxHeight = 450, quality = 0.65): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Save as low-bandwidth JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

/**
 * Seeds initial structured data if the Firestore collections are currently empty.
 * This ensures the application is immediately usable and fully featured.
 */
export async function seedDatabaseIfEmpty() {
  if (isSandbox()) {
    console.log("Running in local sandbox mode, skipping Cloud Firestore seeding.");
    return;
  }
  try {
    const projectsSnap = await getDocs(collection(db, 'projects'));
    if (projectsSnap.empty) {
      console.log("Seeding Firestore with initial mock data...");
      const batch = writeBatch(db);

      // 1. Seed Projects
      INITIAL_PROJECTS.forEach((proj) => {
        batch.set(doc(db, 'projects', proj.id), proj);
      });

      // 2. Seed Supervisors
      INITIAL_SUPERVISORS.forEach((sup) => {
        batch.set(doc(db, 'supervisors', sup.id), sup);
        
        // Also register roles for them
        batch.set(doc(db, 'roles', sup.id), {
          uid: sup.id,
          role: "supervisor",
          name: sup.name
        });
      });

      // 3. Seed Workers
      INITIAL_WORKERS.forEach((worker) => {
        batch.set(doc(db, 'workers', worker.id), worker);
      });

      // 4. Seed Deployments
      INITIAL_DEPLOYMENTS.forEach((dep) => {
        batch.set(doc(db, 'deployments', dep.id), dep);
      });

      // 5. Seed some initial roles for staff
      batch.set(doc(db, 'roles', 'hr-staff-1'), {
        uid: 'hr-staff-1',
        role: 'hr',
        name: 'Deepak HR Officer'
      });
      batch.set(doc(db, 'roles', 'admin-staff-1'), {
        uid: 'admin-staff-1',
        role: 'admin',
        name: 'CEO Office Admin'
      });

      await batch.commit();
      console.log("Seeding complete!");
    } else {
      console.log("Database already seeded.");
    }
  } catch (error) {
    console.error("Failed to seed initial database:", error);
  }
}

/**
 * Automatically authenticates and registers users dynamically inside Firebase Auth
 * while safely mapping them to their corresponding role documents in Firestore.
 */
export async function authenticateAndGetProfile(
  role: 'supervisor' | 'hr' | 'admin',
  emailOrPhone: string,
  name: string
): Promise<UserProfile> {
  const defaultPassword = "Password123!";
  const adminEmail = "igobackend2@gmail.com";
  
  let authEmail = "";
  let supervisorId: string | undefined = undefined;
  let cleanPhone = "";
  
  if (role === 'admin') {
    authEmail = adminEmail;
  } else if (role === 'hr') {
    authEmail = emailOrPhone.includes('@') ? emailOrPhone : 'deepak.hr@igogroup.com';
  } else {
    cleanPhone = emailOrPhone.replace(/\D/g, '');
    if (cleanPhone === '9876543210' || !cleanPhone) {
      authEmail = 'super-1@igogroup.com';
      supervisorId = 'super-1';
    } else {
      authEmail = `phone_${cleanPhone}@igogroup.com`;
      supervisorId = `super-${cleanPhone}`;
    }
  }

  // If already flagged or running sandbox mode, bypass actual firebase calls immediately
  if (isSandbox()) {
    return runSandboxFallback(role, emailOrPhone, name, cleanPhone);
  }

  try {
    // 1. Ensure Admin is authenticated first to perform initial seeding and write the roles
    let adminUid = "";
    try {
      const cred = await signInWithEmailAndPassword(auth, adminEmail, defaultPassword);
      adminUid = cred.user.uid;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
        const cred = await createUserWithEmailAndPassword(auth, adminEmail, defaultPassword);
        adminUid = cred.user.uid;
      } else {
        throw err;
      }
    }

    // Now seed database while logged in as Admin
    await seedDatabaseIfEmpty();

    // Set Admin's role document
    await setDoc(doc(db, 'roles', adminUid), {
      uid: adminUid,
      role: 'admin',
      name: 'CEO Office Admin',
      email: adminEmail
    }, { merge: true });

    if (role === 'admin') {
      return {
        uid: adminUid,
        email: adminEmail,
        name: 'CEO Office Admin',
        role: 'admin'
      };
    }

    // 2. Authenticate or create the target user
    let targetUid = "";
    try {
      const cred = await signInWithEmailAndPassword(auth, authEmail, defaultPassword);
      targetUid = cred.user.uid;
    } catch (err: any) {
      const cred = await createUserWithEmailAndPassword(auth, authEmail, defaultPassword);
      targetUid = cred.user.uid;
    }

    // 3. Set the role document using Admin session
    await signInWithEmailAndPassword(auth, adminEmail, defaultPassword);

    const rolesRef = doc(db, 'roles', targetUid);
    const roleDoc: any = {
      uid: targetUid,
      role: role,
      name: name,
      email: authEmail
    };
    if (supervisorId) {
      roleDoc.supervisorId = supervisorId;
      
      // Also write supervisor record
      const supRef = doc(db, 'supervisors', supervisorId);
      await setDoc(supRef, {
        id: supervisorId,
        name: name,
        phone: cleanPhone || '9876543210',
        assignedState: 'Tamil Nadu',
        assignedDistrict: 'Madurai',
        workerCount: 5,
        lastActiveAt: new Date().toISOString()
      }, { merge: true });
    }

    await setDoc(rolesRef, roleDoc, { merge: true });

    // 4. Finally, sign back in as target user to complete login
    await signInWithEmailAndPassword(auth, authEmail, defaultPassword);

    const profile: UserProfile = {
      uid: targetUid,
      name: name,
      role: role,
      ...(role === 'supervisor' ? {
        assignedState: 'Tamil Nadu',
        assignedDistrict: 'Madurai'
      } : {})
    };
    if (authEmail.includes('@')) {
      profile.email = authEmail;
    } else {
      profile.phone = emailOrPhone;
    }
    return profile;

  } catch (error: any) {
    console.error("Firebase authentication mapping failed, falling back to local sandbox:", error);
    return runSandboxFallback(role, emailOrPhone, name, cleanPhone);
  }
}

function runSandboxFallback(
  role: 'supervisor' | 'hr' | 'admin',
  emailOrPhone: string,
  name: string,
  cleanPhone: string
): UserProfile {
  localStorage.setItem('igo_sandbox_mode', 'true');
  initLocalStorageDb();

  let mockUid = `offline-${role}`;
  if (role === 'supervisor') {
    mockUid = cleanPhone === '9876543210' || !cleanPhone ? 'super-1' : `super-${cleanPhone}`;
  } else if (role === 'hr') {
    mockUid = 'hr-staff-1';
  } else {
    mockUid = 'admin-staff-1';
  }

  return {
    uid: mockUid,
    name: name,
    role: role,
    email: role !== 'supervisor' ? (emailOrPhone.includes('@') ? emailOrPhone : 'deepak.hr@igogroup.com') : undefined,
    phone: role === 'supervisor' ? (cleanPhone || '9876543210') : undefined,
    assignedState: 'Tamil Nadu',
    assignedDistrict: 'Madurai',
    isSandbox: true
  };
}
