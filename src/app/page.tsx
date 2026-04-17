'use client';

import { useState, useEffect } from 'react';
import { onActiveAuctions } from '@/lib/firestore';
import { Auction } from '@/types';
import AuctionCard from '@/components/AuctionCard';
import { FiSearch, FiFilter, FiZap, FiClock, FiLoader } from 'react-icons/fi';

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
    const matchesSearch =
      a.car.title.toLowerCase().includes(search.toLowerCase()) ||
      a.car.make.toLowerCase().includes(search.toLowerCase()) ||
      a.car.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || a.status === filter;
    return matchesSearch && matchesFilter;
  });

  const activeCount = auctions.filter(a => a.status === 'active').length;
  const totalBids = auctions.reduce((sum, a) => sum + (a.bidCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          {loading ? '...' : `${activeCount} Live Auktionen`}
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
          Premium Auto-Auktionen
          <br />
          <span className="text-accent">in Echtzeit</span>
        </h1>
        <p className="text-muted max-w-lg mx-auto">
          Bieten Sie live auf exklusive Fahrzeuge. Transparent, schnell und sicher.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">{activeCount}</p>
          <p className="text-xs text-muted">Live</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{totalBids}</p>
          <p className="text-xs text-muted">Gebote</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{auctions.length}</p>
          <p className="text-xs text-muted">Fahrzeuge</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Marke, Modell oder Ort suchen..."
            className="w-full bg-card-bg border border-card-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all' as FilterType, label: 'Alle', icon: FiFilter },
            { key: 'active' as FilterType, label: 'Live', icon: FiZap },
            { key: 'upcoming' as FilterType, label: 'Bald', icon: FiClock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-accent text-black'
                  : 'bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-muted'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Auction Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <FiLoader className="w-8 h-8 text-accent animate-spin" />
          <p className="text-muted text-sm">Auktionen werden geladen...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-full bg-card-bg border border-card-border flex items-center justify-center mx-auto mb-6">
            <FiZap className="w-8 h-8 text-muted" />
          </div>
          <p className="text-lg font-semibold mb-2">Noch keine Auktionen</p>
          <p className="text-sm text-muted max-w-xs mx-auto">
            Aktuell sind keine Fahrzeuge gelistet. Schauen Sie bald wieder vorbei oder stellen Sie selbst ein Fahrzeug ein.
          </p>
        </div>
      ) : (
        <div className="text-center py-20">
          <FiSearch className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">Keine Auktionen gefunden.</p>
          <p className="text-sm text-muted mt-1">Versuche einen anderen Suchbegriff.</p>
        </div>
      )}
    </div>
  );
}
