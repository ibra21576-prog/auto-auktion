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
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole, companyName?: string) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
          // First time — create user doc
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

    const newUser: Omit<User, 'uid'> = {
      email,
      displayName: name,
      role,
      companyName: role === 'dealer' ? companyName : undefined,
      paymentVerified: false,
      verified: role === 'buyer', // Buyers are auto-verified, dealers need admin approval
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
  }

  async function updateUser(data: Partial<User>) {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    setUser(prev => prev ? { ...prev, ...data } : null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, updateUser }}>
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
