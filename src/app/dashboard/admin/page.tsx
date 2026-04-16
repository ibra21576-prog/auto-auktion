'use client';

import { useState } from 'react';
import { mockAuctions } from '@/lib/mock-data';
import { Auction } from '@/types';
import { FiShield, FiCheckCircle, FiXCircle, FiUsers, FiList, FiDollarSign, FiTrendingUp, FiEye } from 'react-icons/fi';
import Link from 'next/link';

// Mock pending dealers
const mockPendingDealers = [
  { uid: 'd1', displayName: 'Klaus Müller', email: 'k.mueller@autohaus.de', companyName: 'AutoHaus Müller GmbH', createdAt: new Date(Date.now() - 86400000) },
  { uid: 'd2', displayName: 'Sarah Fischer', email: 's.fischer@premiumcars.de', companyName: 'Premium Cars Fischer', createdAt: new Date(Date.now() - 172800000) },
];

export default function AdminDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>(mockAuctions);
  const [pendingDealers, setPendingDealers] = useState(mockPendingDealers);
  const [activeTab, setActiveTab] = useState<'overview' | 'auctions' | 'dealers'>('overview');

  const pendingAuctions = auctions.filter(a => a.status === 'pending');
  const activeAuctions  = auctions.filter(a => a.status === 'active');
  const totalBids       = auctions.reduce((sum, a) => sum + a.bidCount, 0);
  const totalVolume     = auctions.reduce((sum, a) => sum + a.currentBid, 0);

  function approveAuction(id: string) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'active', approved: true } : a));
  }
  function rejectAuction(id: string) {
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
  }
  function approveDealer(uid: string) {
    setPendingDealers(prev => prev.filter(d => d.uid !== uid));
  }
  function rejectDealer(uid: string) {
    setPendingDealers(prev => prev.filter(d => d.uid !== uid));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-danger/20 rounded-xl flex items-center justify-center">
          <FiShield className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted text-sm">Plattform-Verwaltung</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: FiList,       label: 'Alle Auktionen', value: auctions.length,                             color: 'text-foreground' },
          { icon: FiTrendingUp, label: 'Live',            value: activeAuctions.length,                       color: 'text-success'    },
          { icon: FiDollarSign, label: 'Gesamtvolumen',   value: `${(totalVolume/1000).toFixed(0)}k €`,       color: 'text-accent'     },
          { icon: FiUsers,      label: 'Händler aussteh.', value: pendingDealers.length,                      color: pendingDealers.length > 0 ? 'text-accent' : 'text-muted' },
        ].map((s, i) => (
          <div key={i} className="bg-card-bg border border-card-border rounded-xl p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card-bg border border-card-border rounded-xl p-1 mb-6 w-fit">
        {[
          { key: 'overview', label: 'Übersicht' },
          { key: 'auctions', label: `Auktionen (${pendingAuctions.length} neu)` },
          { key: 'dealers',  label: `Händler (${pendingDealers.length} ausstehend)` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              activeTab === tab.key ? 'bg-accent text-black' : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h2 className="font-semibold text-sm mb-4">Aktuelle Auktionen</h2>
            <div className="space-y-3">
              {activeAuctions.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-card-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-success font-semibold">
                      <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                      LIVE
                    </span>
                    <span className="text-sm truncate max-w-[200px]">{a.car.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-accent font-mono text-sm">{a.currentBid.toLocaleString('de-DE')} €</span>
                    <span className="text-muted text-xs">{a.bidCount} Gebote</span>
                    <Link href={`/auktion/${a.id}`} className="text-muted hover:text-foreground">
                      <FiEye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auctions Approval */}
      {activeTab === 'auctions' && (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border">
            <h2 className="font-semibold text-sm">Auktionen freigeben</h2>
          </div>
          <div className="divide-y divide-card-border">
            {auctions.map(a => (
              <div key={a.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <img src={a.car.images[0]} alt={a.car.title} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-medium">{a.car.title}</p>
                    <p className="text-xs text-muted">von {a.sellerName} · Start: {a.startPrice.toLocaleString('de-DE')} €</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.status === 'active' ? 'bg-success/20 text-success'
                    : a.status === 'pending' ? 'bg-accent/20 text-accent'
                    : a.status === 'cancelled' ? 'bg-danger/20 text-danger'
                    : 'bg-muted/20 text-muted'
                  }`}>
                    {a.status === 'active' ? 'Live' : a.status === 'pending' ? 'Ausstehend' : a.status === 'cancelled' ? 'Abgelehnt' : a.status}
                  </span>
                  {(a.status === 'pending') && (
                    <>
                      <button onClick={() => approveAuction(a.id)} className="p-1.5 bg-success/20 hover:bg-success/30 text-success rounded-lg transition-colors" title="Freigeben">
                        <FiCheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => rejectAuction(a.id)} className="p-1.5 bg-danger/20 hover:bg-danger/30 text-danger rounded-lg transition-colors" title="Ablehnen">
                        <FiXCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <Link href={`/auktion/${a.id}`} className="p-1.5 text-muted hover:text-foreground transition-colors">
                    <FiEye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dealer Approvals */}
      {activeTab === 'dealers' && (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border">
            <h2 className="font-semibold text-sm">Händler-Anträge</h2>
          </div>
          {pendingDealers.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              Alle Händler-Anträge bearbeitet.
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {pendingDealers.map(d => (
                <div key={d.uid} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">
                      {d.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.companyName}</p>
                      <p className="text-xs text-muted">{d.displayName} · {d.email}</p>
                      <p className="text-xs text-muted">{new Date(d.createdAt).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => approveDealer(d.uid)} className="flex items-center gap-1.5 px-3 py-1.5 bg-success/20 hover:bg-success/30 text-success text-xs font-medium rounded-lg transition-colors">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      Freigeben
                    </button>
                    <button onClick={() => rejectDealer(d.uid)} className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/20 hover:bg-danger/30 text-danger text-xs font-medium rounded-lg transition-colors">
                      <FiXCircle className="w-3.5 h-3.5" />
                      Ablehnen
                    </button>
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
