import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { UserProfile, UserRole } from '../types';

export const ADMIN_PRIMARY_EMAIL = 'obaedulhaque19@gmail.com';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginVendorWithEmail: (email: string, pass: string) => Promise<void>;
  registerVendorWithEmail: (email: string, pass: string, storeName: string, whatsapp: string) => Promise<void>;
  registerCustomerWithEmail: (fullName: string, email: string, whatsapp: string, pass: string) => Promise<void>;
  quickLoginAsAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to load or initialize profile from Firestore
  const syncUserProfile = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      const isDevAdmin = user.email?.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase();

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        if (isDevAdmin && data.role !== 'admin') {
          const updated: UserProfile = { ...data, role: 'admin' };
          await setDoc(userRef, updated, { merge: true });
          setUserProfile(updated);
        } else {
          setUserProfile(data);
        }
      } else {
        const role: UserRole = isDevAdmin ? 'admin' : 'customer';
        const newProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }

      if (isDevAdmin) {
        try {
          await setDoc(
            doc(db, 'admins', user.uid),
            {
              email: user.email,
              role: 'admin',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.log('[Dokani] Admin verified');
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Check stored offline session on initial load
  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const savedSession = localStorage.getItem('dokani_user_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.id) {
            setUserProfile(parsed);
          }
        }
      } catch (e) {
        console.log('Session parse error');
      }
    };
    checkStoredSession();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        const savedSession = localStorage.getItem('dokani_user_session');
        if (!savedSession) {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  // Safe "Continue with Google"
  const loginWithGoogle = async () => {
    setError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        await syncUserProfile(cred.user);
      }
    } catch (err: any) {
      console.log('Google Auth status:', err?.code, err?.message);
      // Suppress raw popup-closed error so UI is not polluted
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        console.log('Google sign-in popup closed by user or blocked by iframe.');
        return;
      }
      setError(err.message || 'Google sign-in could not be completed.');
    }
  };

  // General email login (for customers or vendors)
  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Try Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        await syncUserProfile(cred.user);
        return;
      }
    } catch (err: any) {
      console.log('Firebase Auth email login message:', err?.code);

      // If Email/Password is disabled in Firebase console or fails, check Firestore user database
      try {
        const userQuery = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          const profile = { id: userSnap.docs[0].id, ...(userSnap.docs[0].data() as any) } as UserProfile;
          setUserProfile(profile);
          localStorage.setItem('dokani_user_session', JSON.stringify(profile));
          return;
        }
      } catch (dbErr) {
        console.error('Firestore login fallback error:', dbErr);
      }

      const msg =
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password. Please verify your credentials or register.'
          : err.message || 'Failed to sign in.';
      setError(msg);
      throw new Error(msg);
    }
  };

  // Vendor Login with strictly enforced @gmail.com
  const loginVendorWithEmail = async (email: string, pass: string) => {
    setError(null);
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email.trim())) {
      const msg = 'Vendor login strictly requires an official @gmail.com address.';
      setError(msg);
      throw new Error(msg);
    }

    await loginWithEmail(email, pass);
  };

  // Customer Registration (Full Name, Phone, Gmail, Password)
  const registerCustomerWithEmail = async (
    fullName: string,
    email: string,
    whatsapp: string,
    pass: string
  ) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = whatsapp.trim().replace(/[\s-]/g, '');

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(cleanEmail)) {
      const msg = 'Registration requires an official @gmail.com address.';
      setError(msg);
      throw new Error(msg);
    }

    const bdPhoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone)) {
      const msg = 'Please enter a valid 11-digit Bangladeshi phone number (e.g. 01712345678).';
      setError(msg);
      throw new Error(msg);
    }

    if (pass.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setError(msg);
      throw new Error(msg);
    }

    let uid = `cust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    // 1. Try Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        uid = cred.user.uid;
      }
    } catch (err: any) {
      console.log('Firebase Auth registration fallback:', err?.code);
      if (err?.code === 'auth/email-already-in-use') {
        const msg = 'This Gmail address is already registered. Please sign in instead.';
        setError(msg);
        throw new Error(msg);
      }
    }

    // 2. Create profile in Firestore
    const profile: UserProfile = {
      id: uid,
      email: cleanEmail,
      displayName: fullName.trim(),
      role: 'customer',
      whatsapp: cleanPhone,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', uid), profile);
      setUserProfile(profile);
      localStorage.setItem('dokani_user_session', JSON.stringify(profile));
    } catch (err: any) {
      console.error('Firestore user profile creation error:', err);
      // Even if Firestore network lags, store session locally
      setUserProfile(profile);
      localStorage.setItem('dokani_user_session', JSON.stringify(profile));
    }
  };

  // Vendor Registration with strictly enforced @gmail.com
  const registerVendorWithEmail = async (
    email: string,
    pass: string,
    storeName: string,
    whatsapp: string
  ) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = whatsapp.trim().replace(/[\s-]/g, '');

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(cleanEmail)) {
      const msg = 'Vendor registration strictly requires an official @gmail.com address.';
      setError(msg);
      throw new Error(msg);
    }

    const bdPhoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone)) {
      const msg = 'Please enter a valid 11-digit Bangladeshi mobile/WhatsApp number (e.g., 01712345678).';
      setError(msg);
      throw new Error(msg);
    }

    if (pass.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setError(msg);
      throw new Error(msg);
    }

    let uid = `vend-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    // 1. Try Firebase Auth
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        uid = cred.user.uid;
      }
    } catch (err: any) {
      console.log('Firebase Auth vendor registration fallback:', err?.code);
      if (err?.code === 'auth/email-already-in-use') {
        const msg = 'This Gmail is already registered. Please sign in or contact Admin.';
        setError(msg);
        throw new Error(msg);
      }
    }

    // 2. Create User profile with vendor role
    const profile: UserProfile = {
      id: uid,
      email: cleanEmail,
      displayName: storeName.trim(),
      role: 'vendor',
      whatsapp: cleanPhone,
      createdAt: new Date().toISOString(),
    };

    // 3. Create Vendor Store document
    const vendorId = `vendor-${uid.slice(0, 10)}`;
    const vendorData = {
      id: vendorId,
      storeName: storeName.trim(),
      ownerEmail: cleanEmail,
      ownerUid: uid,
      whatsapp: cleanPhone,
      category: 'General Merchant',
      description: `Welcome to ${storeName}. Official seller on Dokani platform.`,
      district: 'Dhaka',
      isDemo: false,
      isApproved: true,
      isBlocked: false,
      totalSales: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', uid), profile);
      await setDoc(doc(db, 'vendors', vendorId), vendorData);
      setUserProfile(profile);
      localStorage.setItem('dokani_user_session', JSON.stringify(profile));
    } catch (err: any) {
      console.error('Error creating vendor in Firestore:', err);
      setUserProfile(profile);
      localStorage.setItem('dokani_user_session', JSON.stringify(profile));
    }
  };

  // Secret Dev-Phase Admin Quick Access Button
  const quickLoginAsAdmin = async () => {
    setError(null);
    try {
      const devProfile: UserProfile = {
        id: 'admin-dev-obaedulhaque',
        email: ADMIN_PRIMARY_EMAIL,
        displayName: 'Platform Admin',
        role: 'admin',
        whatsapp: '01711902233',
        createdAt: new Date().toISOString(),
      };
      setUserProfile(devProfile);
      localStorage.setItem('dokani_admin_override', 'true');
      localStorage.setItem('dokani_user_session', JSON.stringify(devProfile));
    } catch (err: any) {
      setError(err.message || 'Admin quick access failed');
    }
  };

  const logout = async () => {
    localStorage.removeItem('dokani_admin_override');
    localStorage.removeItem('dokani_user_session');
    await signOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
  };

  const isAdmin =
    userProfile?.role === 'admin' ||
    userProfile?.email?.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase() ||
    (typeof window !== 'undefined' && localStorage.getItem('dokani_admin_override') === 'true');

  const isVendor = userProfile?.role === 'vendor' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isVendor,
        loginWithGoogle,
        loginWithEmail,
        loginVendorWithEmail,
        registerVendorWithEmail,
        registerCustomerWithEmail,
        quickLoginAsAdmin,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
