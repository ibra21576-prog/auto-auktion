'use client';

import { useState, useEffect } from 'react';
import { onActiveAuctions } from '@/lib/firestore';
import { Auction } from '@/types';
import AuctionCard from '@/components/AuctionCard';
import Link from 'next/link';
import { FiSearch, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

type FilterType = 'all' | 'active' | 'upcoming';

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const unsub = onActiveAuctions((data) => { setAuctions(data); setLoading(false); });
    return () => unsub();
  }, []);

  const filtered = auctions.filter((a) => {
    const q = search.toLowerCase();
    const hit = a.car.title.toLowerCase().includes(q) || a.car.make.toLowerCase().includes(q) ||
      a.car.model.toLowerCase().includes(q) || a.car.location.toLowerCase().includes(q);
    return hit && (filter === 'all' || a.status === filter);
  });

  const live    = auctions.filter(a => a.status === 'active').length;
  const soon    = auctions.filter(a => a.status === 'upcoming').length;
  const bids    = auctions.reduce((s, a) => s + (a.bidCount || 0), 0);
  const topBid  = auctions.reduce((m, a) => Math.max(m, a.currentBid || 0), 0);

  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#080F20] to-background border-b border-card-border">
        <div className="absolute inset-0 hero-grid opacity-60" />
        {/* Blue glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            {/* Label */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                {live > 0 ? `${live} Live-Auktion${live !== 1 ? 'en' : ''} aktiv` : 'Professionelle Fahrzeugauktionen'}
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
              <span className="text-foreground">Der professionelle Marktplatz</span>
              <br />
              <span className="text-accent">für Fahrzeugauktionen.</span>
            </h1>

            <p className="text-muted text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
              Kaufen und verkaufen Sie geprüfte Fahrzeuge im Live-Auktionsverfahren.
              Transparent, sicher und direkt.
            </p>

            {/* Search */}
            <div className="flex max-w-lg gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Marke, Modell oder Ort…"
                  className="w-full bg-input-bg border border-card-border text-sm pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors placeholder:text-muted"
                />
              </div>
              <button className="bg-accent hover:bg-accent-hover text-white font-semibold px-5 py-3 rounded-lg text-sm transition-colors flex-shrink-0">
                Suchen
              </button>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              {['Geprüfte Händler', 'Echtzeit-Gebote', 'Sichere Zahlung via Stripe'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-muted">
                  <FiCheckCircle className="w-3.5 h-3.5 text-accent" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      {!loading && auctions.length > 0 && (
        <section className="border-b border-card-border bg-card-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-card-border">
              {[
                { v: live,  l: 'Live jetzt',   blue: true  },
                { v: soon,  l: 'Demnächst'                 },
                { v: bids,  l: 'Gebote gesamt'             },
                { v: topBid > 0 ? `${topBid.toLocaleString('de-DE')} €` : '—', l: 'Höchstgebot' },
              ].map((s, i) => (
                <div key={i} className="py-4 px-6 text-center">
                  <p className={`text-xl sm:text-2xl font-black ${s.blue ? 'text-accent' : 'text-foreground'}`}>{s.v}</p>
                  <p className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Listings ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold">
              {filter === 'active' ? 'Live Auktionen' : filter === 'upcoming' ? 'Demnächst' : 'Aktuelle Fahrzeuge'}
            </h2>
            {!loading && <p className="text-xs text-muted mt-0.5">{filtered.length} Fahrzeug{filtered.length !== 1 ? 'e' : ''}</p>}
          </div>

          <div className="flex items-center gap-1.5 bg-card-bg border border-card-border rounded-lg p-1">
            {([
              { key: 'all'      as FilterType, label: 'Alle'    },
              { key: 'active'   as FilterType, label: '● Live'  },
              { key: 'upcoming' as FilterType, label: '○ Bald'  },
            ]).map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  filter === key ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-foreground'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card-bg border border-card-border rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-input-bg" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3.5 bg-input-bg rounded w-3/4" />
                  <div className="h-3 bg-input-bg rounded w-1/2" />
                  <div className="h-5 bg-input-bg rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(a => <AuctionCard key={a.id} auction={a} />)}
          </div>
        ) : auctions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="text-center py-16 border border-card-border rounded-xl bg-card-bg">
            <FiSearch className="w-10 h-10 text-muted mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">Keine Ergebnisse für „{search}"</p>
            <button onClick={() => setSearch('')} className="mt-2 text-accent text-sm hover:underline">Suche zurücksetzen</button>
          </div>
        )}
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-t border-card-border bg-card-bg/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-lg mb-10">
            <h2 className="text-2xl font-extrabold mb-2">So funktioniert AutoBid</h2>
            <p className="text-sm text-muted">Kaufen und verkaufen in drei einfachen Schritten.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { n: '01', title: 'Registrieren',   desc: 'Kostenloses Konto anlegen. Für Händler: Fahrzeuge einstellen. Für Käufer: Sofort mitbieten.' },
              { n: '02', title: 'Live bieten',     desc: 'Sekundengenaue Echtzeit-Gebote auf geprüfte Fahrzeuge. Transparente Preisfindung.' },
              { n: '03', title: 'Sicher bezahlen', desc: 'Gewinner zahlen per Stripe — direkt, sicher und vollständig abgesichert.' },
            ].map(s => (
              <div key={s.n} className="bg-card-bg border border-card-border rounded-xl p-6 hover:border-accent/30 transition-colors">
                <span className="text-4xl font-black text-accent/20 block mb-3 leading-none">{s.n}</span>
                <h3 className="font-bold mb-2 text-foreground">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="border-t border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="bg-gradient-to-r from-accent/10 via-card-bg to-card-bg border border-accent/15 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold mb-1">Fahrzeug einstellen?</h2>
              <p className="text-sm text-muted">Registriere dich als Händler und schalte deine Auktionen live — in Minuten.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/registrieren"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors whitespace-nowrap">
                Jetzt starten <FiArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/erstellen"
                className="inline-flex items-center gap-2 bg-card-bg border border-card-border hover:border-accent/40 text-foreground font-semibold px-6 py-3 rounded-lg text-sm transition-colors whitespace-nowrap">
                Auto einstellen
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border border-card-border rounded-xl bg-card-bg">
      <div className="w-16 h-16 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
        <span className="text-2xl">🚗</span>
      </div>
      <h3 className="font-bold mb-1">Noch keine Auktionen</h3>
      <p className="text-sm text-muted mb-6 max-w-xs mx-auto">Stelle als Erster dein Fahrzeug ein und starte die Auktion.</p>
      <Link href="/erstellen"
        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
        Auto einstellen <FiArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
