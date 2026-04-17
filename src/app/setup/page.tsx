'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiShield, FiCheckCircle, FiAlertCircle, FiLoader, FiLock } from 'react-icons/fi';

type SetupState = 'loading' | 'already-done' | 'needs-login' | 'ready' | 'success' | 'error';

export default function SetupPage() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<SetupState>('loading');
  const [working, setWorking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    checkBootstrap();
  }, [authLoading, user]);

  async function checkBootstrap() {
    try {
      const snap = await getDoc(doc(db, 'settings', 'adminBootstrapped'));
      if (snap.exists()) {
        setState('already-done');
        return;
      }
      setState(user ? 'ready' : 'needs-login');
    } catch {
      setState(user ? 'ready' : 'needs-login');
    }
  }

  async function claimAdmin() {
    if (!user) return;
    setWorking(true);
    setErrorMsg('');
    try {
      // Double-check no one claimed admin in the meantime
      const snap = await getDoc(doc(db, 'settings', 'adminBootstrapped'));
      if (snap.exists()) {
        setState('already-done');
        return;
      }

      // Promote user to admin
      await updateDoc(doc(db, 'users', user.uid), {
        role: 'admin',
        verified: true,
      });

      // Set the bootstrap flag so this page becomes inert
      await setDoc(doc(db, 'settings', 'adminBootstrapped'), {
        adminUid: user.uid,
        adminEmail: user.email,
        createdAt: serverTimestamp(),
      });

      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  }

  if (authLoading || state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Already done */}
        {state === 'already-done' && (
          <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center">
            <FiShield className="w-12 h-12 text-success mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Setup abgeschlossen</h1>
            <p className="text-sm text-muted mb-6">Ein Administrator wurde bereits eingerichtet.</p>
            <Link href="/dashboard/admin" className="inline-block bg-accent hover:bg-accent-hover text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Zum Admin-Dashboard
            </Link>
          </div>
        )}

        {/* Needs login */}
        {state === 'needs-login' && (
          <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center">
            <FiLock className="w-12 h-12 text-accent mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Anmeldung erforderlich</h1>
            <p className="text-sm text-muted mb-6">Melden Sie sich an, um sich als Administrator einzurichten.</p>
            <Link href="/login?redirect=/setup" className="inline-block bg-accent hover:bg-accent-hover text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Zum Login
            </Link>
          </div>
        )}

        {/* Ready to claim */}
        {state === 'ready' && (
          <div className="bg-card-bg border border-card-border rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <FiShield className="w-8 h-8 text-accent" />
              </div>
              <h1 className="text-xl font-bold">Admin einrichten</h1>
              <p className="text-sm text-muted mt-2">
                Kein Administrator vorhanden. Klicke unten, um dich als ersten Administrator einzurichten.
              </p>
            </div>

            <div className="bg-input-bg rounded-xl p-4 mb-6 space-y-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Dein Konto</p>
              <p className="text-sm font-medium">{user?.displayName || '–'}</p>
              <p className="text-sm text-muted">{user?.email}</p>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted">
                  Diese Seite funktioniert nur <strong className="text-foreground">einmalig</strong> beim ersten Start.
                  Danach ist sie dauerhaft gesperrt.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4 text-xs text-danger">
                Fehler: {errorMsg}
              </div>
            )}

            <button
              onClick={claimAdmin}
              disabled={working}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {working
                ? <><FiLoader className="w-4 h-4 animate-spin" /> Wird eingerichtet…</>
                : <><FiShield className="w-4 h-4" /> Ich bin der Administrator</>
              }
            </button>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center">
            <FiCheckCircle className="w-14 h-14 text-success mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Administrator eingerichtet!</h1>
            <p className="text-sm text-muted mb-2">
              Dein Konto <strong className="text-foreground">{user?.email}</strong> hat jetzt vollen Admin-Zugriff.
            </p>
            <p className="text-xs text-muted mb-6">Bitte lade die Seite neu, damit die Änderung wirksam wird.</p>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/admin" className="bg-accent hover:bg-accent-hover text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors text-center">
                Zum Admin-Dashboard
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Seite neu laden
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
