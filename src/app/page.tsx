'use client';

import { useState, useEffect } from 'react';
import { onActiveAuctions } from '@/lib/firestore';
import { Auction } from '@/types';
import AuctionCard from '@/components/AuctionCard';
import Link from 'next/link';
import {
  FiSearch, FiZap, FiShield, FiTrendingUp,
  FiArrowRight, FiFilter,
} from 'react-icons/fi';

type FilterType = 'all' | 'active' | 'upcoming';

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const unsubscribe = onActiveAuctions((data) => {
      setAuctions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = auctions.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.car.title.toLowerCase().includes(q) ||
      a.car.make.toLowerCase().includes(q) ||
      a.car.model.toLowerCase().includes(q) ||
      a.car.location.toLowerCase().includes(q);
    const matchesFilter = filter === 'all' || a.status === filter;
    return matchesSearch && matchesFilter;
  });

  const activeCount   = auctions.filter(a => a.status === 'active').length;
  const upcomingCount = auctions.filter(a => a.status === 'upcoming').length;
  const totalBids     = auctions.reduce((sum, a) => sum + (a.bidCount || 0), 0);
  const topBid        = auctions.reduce((max, a) => Math.max(max, a.currentBid || 0), 0);

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          {/* Live badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 text-accent text-sm font-semibold px-5 py-2 rounded-full">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              {loading ? '…' : activeCount > 0
                ? `${activeCount} Live-Auktion${activeCount !== 1 ? 'en' : ''} gerade aktiv`
                : 'Premium Auto-Auktionen'}
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-foreground">Exklusive Autos.</span>
            <br />
            <span className="bg-gradient-to-r from-accent via-accent-light to-accent bg-clip-text text-transparent animate-gradient">
              Live versteigert.
            </span>
          </h1>

          <p className="text-center text-muted text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Bieten Sie in Echtzeit auf sorgfältig geprüfte Fahrzeuge.
            Transparent, sicher und direkt vom Händler.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/40 to-accent-light/40 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
              <div className="relative flex items-center bg-card-bg border border-card-border group-focus-within:border-accent/60 rounded-2xl overflow-hidden transition-colors">
                <FiSearch className="absolute left-5 text-muted w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Marke, Modell, Ort…"
                  className="flex-1 bg-transparent pl-14 pr-5 py-4 text-base focus:outline-none placeholder:text-muted"
                />
                <button className="m-2 bg-accent hover:bg-accent-hover text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0">
                  Suchen
                </button>
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-sm text-muted">
            {[
              { icon: FiShield,     label: 'Verifizierte Händler' },
              { icon: FiZap,        label: 'Echtzeit-Gebote'      },
              { icon: FiTrendingUp, label: 'Faire Marktpreise'    },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-accent" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      {!loading && auctions.length > 0 && (
        <section className="border-y border-card-border bg-card-bg/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-card-border">
              {[
                { value: activeCount,   label: 'Live jetzt',      accent: true },
                { value: upcomingCount, label: 'Bald verfügbar'               },
                { value: totalBids,     label: 'Gebote gesamt'                },
                {
                  value: topBid > 0 ? `${topBid.toLocaleString('de-DE')} €` : '—',
                  label: 'Höchstgebot',
                },
              ].map((s, i) => (
                <div key={i} className="py-5 px-6 text-center">
                  <p className={`text-2xl sm:text-3xl font-black ${s.accent ? 'text-accent' : 'text-foreground'}`}>
                    {s.value}
                  </p>
                  <p className="text-xs text-muted mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Auction grid ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Header + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {filter === 'active' ? 'Live Auktionen' : filter === 'upcoming' ? 'Demnächst' : 'Alle Fahrzeuge'}
            </h2>
            <p className="text-sm text-muted mt-1">
              {filtered.length} Fahrzeug{filtered.length !== 1 ? 'e' : ''} gefunden
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-muted" />
            {([
              { key: 'all'      as FilterType, label: 'Alle'    },
              { key: 'active'   as FilterType, label: '🔴 Live'  },
              { key: 'upcoming' as FilterType, label: '🕐 Bald'  },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === key
                    ? 'bg-accent text-black shadow-lg shadow-accent/20'
                    : 'bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-accent/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Skeleton / grid / empty */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card-bg border border-card-border rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-input-bg" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-input-bg rounded w-3/4" />
                  <div className="h-3 bg-input-bg rounded w-1/2" />
                  <div className="h-6 bg-input-bg rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="text-center py-20">
            <FiSearch className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
            <p className="font-semibold mb-1">Keine Ergebnisse</p>
            <p className="text-sm text-muted">Versuche einen anderen Suchbegriff.</p>
            <button onClick={() => setSearch('')} className="mt-3 text-accent text-sm hover:underline">
              Suche zurücksetzen
            </button>
          </div>
        )}
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="border-t border-card-border bg-card-bg/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-12">
            Warum <span className="text-accent">AutoBid</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Echtzeit-Gebote',  desc: 'Biete live gegen andere Käufer — sekundengenaue Updates, kein Warten.' },
              { icon: '🔒', title: 'Sicher & geprüft', desc: 'Alle Händler werden manuell verifiziert. Zahlungen über Stripe abgesichert.' },
              { icon: '💎', title: 'Premium-Auswahl',  desc: 'Exklusive Fahrzeuge von geprüften Händlern — direkt, ohne Mittelsmänner.' },
            ].map((f) => (
              <div key={f.title} className="bg-card-bg border border-card-border rounded-2xl p-6 hover:border-accent/30 transition-colors group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold mb-2 group-hover:text-accent transition-colors">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-accent/15 via-card-bg to-card-bg border border-accent/20 p-8 sm:p-12 text-center">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-black mb-4">
              Fahrzeug einstellen &amp; verkaufen
            </h2>
            <p className="text-muted mb-8 max-w-lg mx-auto">
              Stelle dein Fahrzeug zur Live-Auktion ein. Direkt, transparent, fair.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/registrieren"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-8 py-3.5 rounded-xl text-sm transition-all hover:scale-105 shadow-lg shadow-accent/20"
              >
                Jetzt starten <FiArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/erstellen"
                className="inline-flex items-center gap-2 bg-card-bg border border-card-border hover:border-accent/40 text-foreground font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors"
              >
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
    <div className="text-center py-24">
      <div className="w-24 h-24 rounded-3xl bg-card-bg border border-card-border flex items-center justify-center mx-auto mb-8">
        <FiZap className="w-10 h-10 text-accent opacity-60" />
      </div>
      <h3 className="text-xl font-bold mb-2">Noch keine Auktionen</h3>
      <p className="text-sm text-muted max-w-sm mx-auto mb-8">
        Sei der Erste! Stelle jetzt dein Fahrzeug ein oder schaue bald wieder vorbei.
      </p>
      <Link
        href="/erstellen"
        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors"
      >
        Auto einstellen <FiArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
