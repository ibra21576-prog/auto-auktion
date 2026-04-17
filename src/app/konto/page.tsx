'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getPaymentsByBuyer } from '@/lib/firestore';
import { PaymentRecord } from '@/types';
import {
  FiCreditCard, FiUser, FiCheckCircle, FiAlertCircle,
  FiShield, FiPackage, FiLoader, FiLock,
} from 'react-icons/fi';

export default function KontoPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profil' | 'zahlung' | 'kaeufe'>('profil');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'zahlung') setActiveTab('zahlung');
  }, []);

  useEffect(() => {
    if (activeTab === 'kaeufe' && user) {
      setPaymentsLoading(true);
      getPaymentsByBuyer(user.uid).then(data => {
        setPayments(data);
        setPaymentsLoading(false);
      });
    }
  }, [activeTab, user]);

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 flex justify-center">
        <FiLoader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <FiLock className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Nicht angemeldet</h2>
        <p className="text-muted text-sm mb-4">Bitte melden Sie sich an, um Ihr Konto zu verwalten.</p>
        <Link href="/login" className="text-accent hover:underline text-sm">Zum Login →</Link>
      </div>
    );
  }

  const roleLabel = user.role === 'buyer' ? 'Käufer' : user.role === 'dealer' ? 'Händler' : 'Admin';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
          {(user.displayName || user.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.displayName || user.email}</h1>
          <p className="text-sm text-muted">{user.email}</p>
          <span className="text-xs bg-card-border text-muted px-2 py-0.5 rounded-full mt-1 inline-block">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card-bg border border-card-border rounded-xl p-1 mb-6 w-fit">
        {[
          { key: 'profil',  label: 'Profil',      icon: FiUser       },
          { key: 'zahlung', label: 'Zahlung',      icon: FiCreditCard },
          { key: 'kaeufe',  label: 'Meine Käufe', icon: FiPackage    },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              activeTab === tab.key ? 'bg-accent text-black' : 'text-muted hover:text-foreground'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profil */}
      {activeTab === 'profil' && (
        <div className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-sm">Profilinformationen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Name',   value: user.displayName || '–' },
              { label: 'E-Mail', value: user.email },
              ...(user.companyName ? [{ label: 'Unternehmen', value: user.companyName }] : []),
              ...(user.phone      ? [{ label: 'Telefon',     value: user.phone      }] : []),
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-muted mb-1">{f.label}</p>
                <p className="text-sm font-medium">{f.value}</p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-card-border space-y-2">
            <div className="flex items-center gap-2">
              {user.verified
                ? <><FiCheckCircle className="w-4 h-4 text-success" /><span className="text-xs text-success font-medium">Konto verifiziert</span></>
                : <><FiAlertCircle className="w-4 h-4 text-accent" /><span className="text-xs text-accent font-medium">Verifizierung ausstehend</span></>
              }
            </div>
            <div className="flex items-center gap-2">
              {user.paymentVerified
                ? <><FiCheckCircle className="w-4 h-4 text-success" /><span className="text-xs text-success font-medium">Zahlungsmethode hinterlegt</span></>
                : <><FiAlertCircle className="w-4 h-4 text-muted" /><span className="text-xs text-muted">Keine Zahlungsmethode hinterlegt</span></>
              }
            </div>
          </div>
        </div>
      )}

      {/* Zahlung */}
      {activeTab === 'zahlung' && (
        <div className="space-y-4">
          {!user.paymentVerified ? (
            <div className="bg-card-bg border border-accent/30 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-5">
                <FiAlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-accent text-sm">Zahlungsmethode erforderlich</p>
                  <p className="text-xs text-muted mt-1">
                    Um auf Auktionen bieten zu können, müssen Sie eine Zahlungsmethode hinterlegen.
                    Diese wird nur belastet, wenn Sie eine Auktion gewinnen (Zuschlagspreis + 250 € Käufergebühr).
                  </p>
                </div>
              </div>

              <div className="bg-input-bg border border-card-border rounded-xl p-5 mb-4">
                <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <FiCreditCard className="w-4 h-4 text-accent" />
                  Zahlungsmethode hinzufügen
                </p>
                {/* Stripe Elements would be mounted here in production */}
                <div className="space-y-3">
                  <div className="bg-card-bg border border-card-border rounded-lg px-3 py-3">
                    <p className="text-xs text-muted">Kartennummer</p>
                    <p className="text-sm text-muted italic mt-0.5">•••• •••• •••• ••••</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card-bg border border-card-border rounded-lg px-3 py-3">
                      <p className="text-xs text-muted">Ablaufdatum</p>
                      <p className="text-sm text-muted italic mt-0.5">MM / JJ</p>
                    </div>
                    <div className="bg-card-bg border border-card-border rounded-lg px-3 py-3">
                      <p className="text-xs text-muted">CVC</p>
                      <p className="text-sm text-muted italic mt-0.5">•••</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted mt-3 flex items-center gap-1">
                  <FiShield className="w-3 h-3" />
                  Verschlüsselt & sicher via Stripe. Keine Zahlungsdaten auf unseren Servern.
                </p>
              </div>

              <button className="w-full bg-accent hover:bg-accent-hover text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
                Zahlungsmethode speichern
              </button>

              <div className="mt-4 bg-input-bg rounded-xl p-4">
                <p className="text-xs font-semibold mb-2">So funktioniert es:</p>
                <ul className="text-xs text-muted space-y-1.5">
                  <li>✓ Karte wird <strong className="text-foreground">nicht</strong> sofort belastet</li>
                  <li>✓ Nur bei Auktionsgewinn: Zuschlag + 250 € Käufergebühr</li>
                  <li>✓ Automatische Belastung nach Auktionsende</li>
                  <li>✓ Rechnung per E-Mail nach Zahlung</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-card-bg border border-card-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center">
                    <FiCreditCard className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Zahlungsmethode hinterlegt</p>
                    <p className="text-xs text-muted">Wird nur bei Gewinn einer Auktion belastet</p>
                  </div>
                </div>
                <span className="text-xs text-success font-semibold flex items-center gap-1">
                  <FiCheckCircle className="w-3.5 h-3.5" /> Aktiv
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Käufe */}
      {activeTab === 'kaeufe' && (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border">
            <h2 className="font-semibold text-sm">Gewonnene Auktionen</h2>
          </div>
          {paymentsLoading ? (
            <div className="py-12 flex justify-center">
              <FiLoader className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center">
              <FiPackage className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">Noch keine Käufe.</p>
              <Link href="/" className="text-accent text-sm hover:underline mt-1 inline-block">
                Jetzt bieten →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {payments.map(p => (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/auktion/${p.auctionId}`} className="text-sm font-medium hover:text-accent transition-colors">
                      Auktion #{p.auctionId.slice(0, 8)}
                    </Link>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      p.status === 'succeeded' ? 'bg-success/20 text-success'
                      : p.status === 'failed'  ? 'bg-danger/20 text-danger'
                      : 'bg-accent/20 text-accent'
                    }`}>
                      {p.status === 'succeeded' ? 'Bezahlt' : p.status === 'failed' ? 'Fehlgeschlagen' : 'Ausstehend'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                    <span>Zuschlag: <span className="text-foreground font-mono">{p.bidAmount?.toLocaleString('de-DE')} €</span></span>
                    <span>Gebühr: <span className="text-foreground font-mono">{p.buyerFee} €</span></span>
                    <span>Gesamt: <span className="text-accent font-mono font-semibold">{p.totalAmount?.toLocaleString('de-DE')} €</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
