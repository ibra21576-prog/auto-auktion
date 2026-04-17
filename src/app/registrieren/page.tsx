'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiUser, FiZap, FiBriefcase, FiPhone, FiLoader } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

function firebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Diese E-Mail-Adresse ist bereits registriert.';
    case 'auth/invalid-email':
      return 'Ungültige E-Mail-Adresse.';
    case 'auth/weak-password':
      return 'Passwort zu schwach. Mindestens 6 Zeichen verwenden.';
    case 'auth/network-request-failed':
      return 'Netzwerkfehler. Bitte Verbindung prüfen.';
    default:
      return 'Registrierung fehlgeschlagen. Bitte erneut versuchen.';
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [role, setRole] = useState<UserRole>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }
    if (form.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen haben.');
      return;
    }
    if (role === 'dealer' && !form.companyName.trim()) {
      setError('Firmenname ist erforderlich.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(form.email, form.password, form.name, role, form.companyName || undefined);
      // Always go to email verification page first
      router.replace('/verifizierung');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || '';
      setError(firebaseErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <FiZap className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold">Auto<span className="text-accent">Bid</span></span>
          </Link>
          <p className="text-sm text-muted">Konto erstellen und loslegen</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { key: 'buyer' as UserRole,  label: 'Käufer',  desc: 'Bieten & kaufen' },
            { key: 'dealer' as UserRole, label: 'Händler', desc: 'Autos einstellen' },
          ].map(r => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                role === r.key
                  ? 'border-accent bg-accent/10'
                  : 'border-card-border bg-card-bg hover:border-muted'
              }`}
            >
              <p className={`font-semibold text-sm ${role === r.key ? 'text-accent' : 'text-foreground'}`}>{r.label}</p>
              <p className="text-xs text-muted mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">Name *</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input name="name" type="text" value={form.name} onChange={handleChange} required
                autoComplete="name"
                placeholder="Ihr vollständiger Name"
                className="w-full bg-input-bg border border-card-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
            </div>
          </div>

          {role === 'dealer' && (
            <>
              <div>
                <label className="block text-xs text-muted mb-1.5">Firmenname *</label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                  <input name="companyName" type="text" value={form.companyName} onChange={handleChange} required
                    placeholder="AutoHaus Muster GmbH"
                    className="w-full bg-input-bg border border-card-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Telefon</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                    placeholder="+49 89 123456"
                    className="w-full bg-input-bg border border-card-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-muted mb-1.5">E-Mail *</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                autoComplete="email"
                placeholder="ihre@email.de"
                className="w-full bg-input-bg border border-card-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Passwort *</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6}
                autoComplete="new-password"
                placeholder="Mindestens 6 Zeichen"
                className="w-full bg-input-bg border border-card-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Passwort bestätigen *</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                autoComplete="new-password"
                placeholder="Passwort wiederholen"
                className="w-full bg-input-bg border border-card-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
            </div>
          </div>

          {error && (
            <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
          )}

          {role === 'dealer' && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
              <p className="text-xs text-accent font-semibold">Händler-Hinweis</p>
              <p className="text-xs text-muted mt-0.5">Ihr Konto wird nach Admin-Prüfung freigeschaltet (i.d.R. 24h).</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
            {loading
              ? <><FiLoader className="w-4 h-4 animate-spin" /> Wird erstellt…</>
              : 'Konto erstellen'
            }
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          Bereits registriert?{' '}
          <Link href="/login" className="text-accent hover:underline font-medium">Anmelden</Link>
        </p>
        <p className="text-center text-xs text-muted mt-2">
          Mit der Registrierung akzeptieren Sie unsere{' '}
          <span className="text-accent cursor-pointer">AGB</span> und{' '}
          <span className="text-accent cursor-pointer">Datenschutzrichtlinie</span>.
        </p>
      </div>
    </div>
  );
}
