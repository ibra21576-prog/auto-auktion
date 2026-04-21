'use client';

import { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiLoader, FiCheckCircle, FiShield } from 'react-icons/fi';

// ── Inner form — rendered inside <Elements> ──────────────────────────────────
function StripeForm({
  onSuccess,
  customerId,
}: {
  onSuccess: () => void;
  customerId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !user) return;
    setSaving(true);
    setError('');

    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/konto?tab=zahlung`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Fehler beim Speichern der Zahlungsmethode.');
      setSaving(false);
      return;
    }

    // Mark user as payment-verified in Firestore
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        paymentVerified: true,
        stripeCustomerId: customerId,
      });
      await updateUser({ paymentVerified: true, stripeCustomerId: customerId });
      onSuccess();
    } catch (err) {
      console.error('[PaymentForm] Firestore update error:', err);
      setError('Karte gespeichert, aber Profil konnte nicht aktualisiert werden. Bitte Seite neu laden.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: { billingDetails: { email: user?.email || '' } },
        }}
      />

      {error && (
        <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <p className="text-xs text-muted flex items-center gap-1.5">
        <FiShield className="w-3.5 h-3.5 flex-shrink-0" />
        Verschlüsselt & sicher via Stripe. Keine Zahlungsdaten auf unseren Servern.
      </p>

      <button
        type="submit"
        disabled={!stripe || !elements || saving}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {saving && <FiLoader className="w-4 h-4 animate-spin" />}
        {saving ? 'Wird gespeichert…' : 'Zahlungsmethode speichern'}
      </button>
    </form>
  );
}

// ── Outer component — fetches SetupIntent then mounts Elements ───────────────
export default function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch('/api/stripe/create-setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.displayName || user.email,
            userId: user.uid,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setClientSecret(data.clientSecret);
        setCustomerId(data.customerId);
      } catch (err) {
        console.error('[PaymentForm] SetupIntent fetch failed:', err);
        setFetchError('Stripe ist momentan nicht verfügbar. Bitte später erneut versuchen.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  function handleSuccess() {
    setDone(true);
    onSuccess();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <FiLoader className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5">
        {fetchError}
      </p>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <FiCheckCircle className="w-10 h-10 text-success" />
        <p className="font-semibold text-sm">Zahlungsmethode gespeichert!</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#f59e0b',
            colorBackground: '#1a1a1a',
            colorText: '#f5f5f5',
            borderRadius: '8px',
          },
        },
      }}
    >
      <StripeForm onSuccess={handleSuccess} customerId={customerId} />
    </Elements>
  );
}
