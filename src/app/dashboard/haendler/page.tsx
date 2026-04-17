'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { onAuctionsBySeller } from '@/lib/firestore';
import { Auction } from '@/types';
import {
  FiPlus, FiEye, FiClock, FiCheckCircle, FiTrendingUp,
  FiDollarSign, FiList, FiLoader, FiImage,
} from 'react-icons/fi';

const statusLabel: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Entwurf',    color: 'text-muted'    },
  pending:   { label: 'Ausstehend', color: 'text-accent'   },
  upcoming:  { label: 'Geplant',    color: 'text-accent'   },
  active:    { label: 'Live',       color: 'text-success'  },
  ended:     { label: 'Beendet',    color: 'text-muted'    },
  sold:      { label: 'Verkauft',   color: 'text-success'  },
  cancelled: { label: 'Storniert',  color: 'text-danger'   },
};

export default function HaendlerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onAuctionsBySeller(user.uid, (data) => {
      setAuctions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex justify-center">
        <FiLoader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted">Bitte <Link href="/login" className="text-accent underline">anmelden</Link></p>
      </div>
    );
  }

  const totalRevenue = auctions
    .filter(a => a.status === 'sold')
    .reduce((sum, a) => sum + a.currentBid, 0);
  const activeCount = auctions.filter(a => a.status === 'active').length;
  const soldCount   = auctions.filter(a => a.status === 'sold').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Händler-Dashboard</h1>
          <p className="text-muted text-sm mt-1">{user.companyName || user.displayName}</p>
        </div>
        <Link
          href="/erstellen"
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <FiPlus className="w-4 h-4" />
          Auto einstellen
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: FiList,        label: 'Auktionen gesamt', value: auctions.length,                             color: 'text-foreground' },
          { icon: FiTrendingUp,  label: 'Live',             value: activeCount,                                  color: 'text-success'    },
          { icon: FiCheckCircle, label: 'Verkauft',         value: soldCount,                                    color: 'text-accent'     },
          { icon: FiDollarSign,  label: 'Erlös',            value: `${totalRevenue.toLocaleString('de-DE')} €`,  color: 'text-accent'     },
        ].map((s, i) => (
          <div key={i} className="bg-card-bg border border-card-border rounded-xl p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Auction Table */}
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border">
          <h2 className="font-semibold text-sm">Meine Fahrzeuge</h2>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <FiLoader className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : auctions.length === 0 ? (
          <div className="py-16 text-center">
            <FiList className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">Noch keine Auktionen.</p>
            <Link href="/erstellen" className="text-accent text-sm hover:underline mt-1 inline-block">
              Erstes Auto einstellen →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  {['Fahrzeug', 'Status', 'Aktuelles Gebot', 'Gebote', 'Endet', 'Aktionen'].map(h => (
                    <th key={h} className="text-left text-xs text-muted px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auctions.map((a, i) => {
                  const st = statusLabel[a.status] || { label: a.status, color: 'text-muted' };
                  const hasImage = a.car.images && a.car.images.length > 0;
                  return (
                    <tr key={a.id} className={`${i < auctions.length - 1 ? 'border-b border-card-border' : ''} hover:bg-input-bg/50 transition-colors`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-input-bg flex-shrink-0 flex items-center justify-center">
                            {hasImage
                              ? <img src={a.car.images[0]} alt={a.car.title} className="w-full h-full object-cover" />
                              : <FiImage className="w-4 h-4 text-muted" />
                            }
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[180px]">{a.car.title}</p>
                            <p className="text-xs text-muted">{a.car.year} · {a.car.mileage?.toLocaleString('de-DE')} km</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${st.color}`}>
                          {a.status === 'active' && <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />}
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono font-semibold text-accent">
                        {a.currentBid > 0 ? `${a.currentBid.toLocaleString('de-DE')} €` : '–'}
                      </td>
                      <td className="px-5 py-3 text-muted">{a.bidCount || 0}</td>
                      <td className="px-5 py-3 text-muted text-xs">
                        {new Date(a.endTime).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/auktion/${a.id}`} className="p-1.5 text-muted hover:text-foreground transition-colors inline-block" title="Ansehen">
                          <FiEye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification hint */}
      {!user.verified && (
        <div className="mt-6 bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-3">
          <FiClock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-accent">Händler-Verifizierung ausstehend</p>
            <p className="text-xs text-muted mt-1">Ihre Auktionen werden nach Admin-Freigabe veröffentlicht.</p>
          </div>
        </div>
      )}
    </div>
  );
}
