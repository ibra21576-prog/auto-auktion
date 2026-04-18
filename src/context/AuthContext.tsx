'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  emailVerified: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole, companyName?: string) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadEmailVerified: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setEmailVerified(firebaseUser.emailVerified);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
          const newUser: Omit<User, 'uid'> = {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
            role: 'buyer',
            paymentVerified: false,
            verified: false,
            createdAt: new Date(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
          });
          setUser({ uid: firebaseUser.uid, ...newUser });
        }
      } else {
        setUser(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string, name: string, role: UserRole, companyName?: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Send verification email — non-critical, don't block registration if it fails
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('[signUp] Verification email failed (non-critical):', e);
    }

    const newUser: Omit<User, 'uid'> = {
      email,
      displayName: name,
      role,
      companyName: role === 'dealer' ? companyName : undefined,
      paymentVerified: false,
      verified: role === 'buyer',
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
    });
    setUser({ uid: cred.user.uid, ...newUser });
  }

  async function signInWithGoogle(role: UserRole = 'buyer') {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Google accounts are always verified
    setEmailVerified(true);

    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      const newUser: Omit<User, 'uid'> = {
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || undefined,
        role,
        paymentVerified: false,
        verified: role === 'buyer',
        createdAt: new Date(),
      };
      await setDoc(doc(db, 'users', result.user.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
      });
      setUser({ uid: result.user.uid, ...newUser });
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setUser(null);
    setEmailVerified(false);
  }

  async function updateUser(data: Partial<User>) {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    setUser(prev => prev ? { ...prev, ...data } : null);
  }

  async function resendVerificationEmail() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Nicht angemeldet.');
    await sendEmailVerification(firebaseUser);
  }

  async function reloadEmailVerified(): Promise<boolean> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return false;
    await reload(firebaseUser);
    setEmailVerified(firebaseUser.emailVerified);
    return firebaseUser.emailVerified;
  }

  return (
    <AuthContext.Provider value={{
      user, emailVerified, loading,
      signIn, signUp, signInWithGoogle, signOut,
      updateUser, resendVerificationEmail, reloadEmailVerified,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
