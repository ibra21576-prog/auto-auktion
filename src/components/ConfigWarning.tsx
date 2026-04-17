'use client';

import { firebaseConfigured } from '@/lib/firebase';
import { FiAlertTriangle } from 'react-icons/fi';

export default function ConfigWarning() {
  if (firebaseConfigured) return null;

  return (
    <div className="bg-danger/20 border-b border-danger/40 text-danger px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <p className="font-bold">Firebase nicht konfiguriert</p>
          <p className="opacity-90 mt-0.5">
            Auf Render unter <strong>Environment</strong> müssen die 6 Variablen{' '}
            <code className="bg-black/30 px-1 py-0.5 rounded">NEXT_PUBLIC_FIREBASE_*</code>{' '}
            aus der Firebase Console (→ Projekteinstellungen → Deine Apps) eingetragen werden.
            Login und Registrierung funktionieren erst danach.
          </p>
        </div>
      </div>
    </div>
  );
}
