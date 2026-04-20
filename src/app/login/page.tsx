'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiMail, FiLock, FiZap, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

function firebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-Mail oder Passwort falsch.';
    case 'auth/too-many-requests':
      return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.';
    case 'auth/user-disabled':
      return 'Dieses Konto wurde deaktiviert.';
    case 'auth/network-request-failed':
      return 'Netzwerkfehler. Bitte Verbindung prüfen.';
    case 'auth/operation-not-allowed':
      return 'E-Mail/Passwort-Login ist in Firebase nicht aktiviert.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Firebase API-Key ist ungültig.';
    case 'auth/unauthorized-domain':
      return 'Diese Domain ist in Firebase nicht autorisiert.';
    default:
      return '';
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, emailVerified, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerifyHint, setShowVerifyHint] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user && emailVerified) router.replace(redirect);
    if (user && !emailVerified) setShowVerifyHint(true);
  }, [user, emailVerified, redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowVerifyHint(false);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      console.error('[Login] Firebase error:', err);
      const code = (err as { code?: string }).code || '';
      const msg = (err as { message?: string }).message || '';
      const friendly = firebaseErrorMessage(code);
      const detail = [code, msg].filter(Boolean).join(' — ');
      setError(friendly || detail || 'Unbekannter Fehler.');
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle('buyer');
      router.replace(redirect);
    } catch (err: unknown) {
      console.error('[Login/Google] Firebase error:', err);
      const code = (err as { code?: string }).code || '';
      const msg = (err as { message?: string }).message || '';
      const friendly = firebaseErrorMessage(code);
      const detail = [code, msg].filter(Boolean).join(' — ');
      setError(friendly || detail || 'Google-Anmeldung fehlgeschlagen.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-xs text-muted mb-1.5">E-Mail</label>
        <div className="relative">
          <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="ihre@email.de"
            className="w-full bg-input-bg border border-card-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted block mb-1.5">Passwort</label>
        <div className="relative">
          <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full bg-input-bg border border-card-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {showVerifyHint && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-accent font-semibold">E-Mail noch nicht bestätigt</p>
            <p className="text-xs text-muted mt-0.5">
              Bitte bestätige deine E-Mail-Adresse.{' '}
              <Link href="/verifizierung" className="text-accent underline">Zur Bestätigung →</Link>
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || googleLoading}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
      >
        {loading ? <><FiLoader className="w-4 h-4 animate-spin" /> Anmelden…</> : 'Anmelden'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-card-border" /></div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card-bg px-3 text-muted">oder</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading || googleLoading}
        className="w-full bg-input-bg border border-card-border hover:border-muted disabled:opacity-50 text-foreground font-medium py-2.5 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
      >
        {googleLoading
          ? <FiLoader className="w-4 h-4 animate-spin" />
          : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )
        }
        Mit Google anmelden
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <FiZap className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold">Auto<span className="text-accent">Bid</span></span>
          </Link>
          <p className="text-sm text-muted">Melden Sie sich an, um mitzubieten</p>
        </div>

        <Suspense fallback={<div className="bg-card-bg border border-card-border rounded-xl p-6 flex justify-center"><FiLoader className="w-5 h-5 animate-spin text-accent" /></div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-muted mt-4">
          Noch kein Konto?{' '}
          <Link href="/registrieren" className="text-accent hover:underline font-medium">Registrieren</Link>
        </p>
      </div>
    </div>
  );
}
