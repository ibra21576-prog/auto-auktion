'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiMail, FiCheckCircle, FiLoader, FiRefreshCw } from 'react-icons/fi';

export default function VerifizierungPage() {
  const router = useRouter();
  const { user, emailVerified, reloadEmailVerified, resendVerificationEmail, signOut } = useAuth();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkLoading, setCheckLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  // Auto-check every 4 seconds
  useEffect(() => {
    if (emailVerified) {
      router.replace('/');
      return;
    }
    const interval = setInterval(async () => {
      const verified = await reloadEmailVerified();
      if (verified) router.replace('/');
    }, 4000);
    return () => clearInterval(interval);
  }, [emailVerified, reloadEmailVerified, router]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleResend() {
    setResendLoading(true);
    setError('');
    setResendSuccess(false);
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      setResendCooldown(60);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      if (code === 'auth/too-many-requests') {
        setError('Zu viele Anfragen. Bitte warte eine Minute.');
      } else {
        setError('Fehler beim Senden. Bitte erneut versuchen.');
      }
    } finally {
      setResendLoading(false);
    }
  }

  async function handleCheck() {
    setCheckLoading(true);
    const verified = await reloadEmailVerified();
    setCheckLoading(false);
    if (verified) {
      router.replace('/');
    } else {
      setError('E-Mail noch nicht bestätigt. Bitte überprüfe deinen Posteingang (auch Spam).');
    }
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted text-sm mb-4">Bitte zuerst anmelden.</p>
          <Link href="/login" className="text-accent hover:underline text-sm">Zum Login →</Link>
        </div>
      </div>
    );
  }

  if (emailVerified) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <FiCheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <p className="font-bold">E-Mail bestätigt!</p>
          <Link href="/" className="text-accent hover:underline text-sm mt-2 inline-block">Zur Startseite →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center">

          {/* Icon */}
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FiMail className="w-8 h-8 text-accent" />
          </div>

          <h1 className="text-xl font-bold mb-2">E-Mail bestätigen</h1>
          <p className="text-sm text-muted mb-1">
            Wir haben eine Bestätigungs-E-Mail an
          </p>
          <p className="text-sm font-semibold mb-5">{user.email}</p>

          <p className="text-xs text-muted mb-6">
            Klicke auf den Link in der E-Mail. Schaue auch im Spam-Ordner nach.
            Diese Seite aktualisiert sich automatisch.
          </p>

          {/* Auto-checking indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted mb-6">
            <FiLoader className="w-3.5 h-3.5 animate-spin" />
            Wird automatisch geprüft…
          </div>

          {error && (
            <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}
          {resendSuccess && (
            <p className="text-success text-xs bg-success/10 border border-success/20 rounded-lg px-3 py-2 mb-4">
              E-Mail erneut gesendet!
            </p>
          )}

          {/* Manually check button */}
          <button
            onClick={handleCheck}
            disabled={checkLoading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mb-3"
          >
            {checkLoading
              ? <><FiLoader className="w-4 h-4 animate-spin" /> Prüfe…</>
              : <><FiCheckCircle className="w-4 h-4" /> Ich habe bestätigt</>
            }
          </button>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0}
            className="w-full bg-input-bg border border-card-border hover:border-muted disabled:opacity-50 text-foreground font-medium py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            {resendLoading
              ? <><FiLoader className="w-4 h-4 animate-spin" /> Wird gesendet…</>
              : resendCooldown > 0
                ? `Erneut senden (${resendCooldown}s)`
                : <><FiRefreshCw className="w-4 h-4" /> E-Mail erneut senden</>
            }
          </button>

          <button
            onClick={() => signOut()}
            className="mt-4 text-xs text-muted hover:text-foreground transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
