'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAllAuctions, getPendingDealers, getAllUsers, getAllPayments,
  approveAuction, rejectAuction, deleteAuction, forceEndAuction,
  approveDealer, rejectDealer, updateUserRole,
} from '@/lib/firestore';
import { Auction, User, PaymentRecord, UserRole } from '@/types';
import {
  FiShield, FiCheckCircle, FiXCircle, FiUsers, FiList,
  FiDollarSign, FiTrendingUp, FiEye, FiLoader, FiImage,
  FiTrash2, FiStopCircle, FiRefreshCw, FiSearch, FiCreditCard,
  FiUserCheck, FiAlertTriangle,
} from 'react-icons/fi';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type Tab = 'overview' | 'auctions' | 'dealers' | 'users' | 'payments';
type AuctionFilter = 'all' | 'pending' | 'active' | 'ended' | 'cancelled';

function useConfirm() {
  return (message: string) => typeof window !== 'undefined' && window.confirm(message);
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const confirm = useConfirm();

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [dealers, setDealers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [auctionFilter, setAuctionFilter] = useState<AuctionFilter>('all');
  const [userSearch, setUserSearch] = useState('');
  const [working, setWorking] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [auctionData, dealerData, userData, paymentData] = await Promise.all([
      getAllAuctions(),
      getPendingDealers(),
      getAllUsers(),
      getAllPayments(),
    ]);
    setAuctions(auctionData);
    setDealers(dealerData);
    setUsers(userData);
    setPayments(paymentData);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') loadData();
  }, [user, loadData]);

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex justify-center">
        <FiLoader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <FiShield className="w-12 h-12 text-muted mx-auto mb-4" />
        <p className="text-lg font-semibold mb-2">Kein Zugriff</p>
        <p className="text-muted text-sm">Diese Seite ist nur für Administratoren.</p>
      </div>
    );
  }

  const pendingAuctions = auctions.filter(a => a.status === 'pending');
  const activeAuctions  = auctions.filter(a => a.status === 'active');
  const endedAuctions   = auctions.filter(a => a.status === 'ended' || a.status === 'sold');
  const totalVolume     = auctions.reduce((sum, a) => sum + (a.currentBid || 0), 0);
  const totalRevenue    = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.buyerFee || 0), 0);

  const filteredAuctions = auctionFilter === 'all'
    ? auctions
    : auctions.filter(a => a.status === auctionFilter);

  const filteredUsers = userSearch
    ? users.filter(u =>
        (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.companyName || '').toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  async function handleApproveAuction(id: string) {
    setWorking(id);
    await approveAuction(id);
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'active', approved: true } : a));
    setWorking(null);
  }

  async function handleRejectAuction(id: string) {
    if (!confirm('Auktion wirklich ablehnen?')) return;
    setWorking(id);
    await rejectAuction(id);
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    setWorking(null);
  }

  async function handleEndAuction(id: string) {
    if (!confirm('Auktion wirklich sofort beenden?')) return;
    setWorking(id);
    await forceEndAuction(id);
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'ended' } : a));
    setWorking(null);
  }

  async function handleDeleteAuction(id: string) {
    if (!confirm('Auktion ENDGÜLTIG löschen? Das kann nicht rückgängig gemacht werden.')) return;
    setWorking(id);
    await deleteAuction(id);
    setAuctions(prev => prev.filter(a => a.id !== id));
    setWorking(null);
  }

  async function handleApproveDealer(uid: string) {
    setWorking(uid);
    await approveDealer(uid);
    setDealers(prev => prev.filter(d => d.uid !== uid));
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, verified: true } : u));
    setWorking(null);
  }

  async function handleRejectDealer(uid: string) {
    if (!confirm('Händler-Antrag ablehnen? Nutzer wird zu Käufer zurückgestuft.')) return;
    setWorking(uid);
    await rejectDealer(uid);
    setDealers(prev => prev.filter(d => d.uid !== uid));
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: 'buyer', verified: false } : u));
    setWorking(null);
  }

  async function handleChangeRole(uid: string, newRole: UserRole) {
    if (uid === user!.uid) return;
    if (!confirm(`Rolle auf "${newRole}" ändern?`)) return;
    setWorking(uid);
    const verified = newRole === 'admin' ? true : newRole === 'buyer' ? true : undefined;
    await updateUserRole(uid, newRole, verified);
    setUsers(prev => prev.map(u => u.uid === uid
      ? { ...u, role: newRole, verified: verified ?? u.verified }
      : u));
    if (newRole !== 'dealer') {
      setDealers(prev => prev.filter(d => d.uid !== uid));
    }
    setWorking(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-danger/20 rounded-xl flex items-center justify-center">
            <FiShield className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Kontrollzentrum</h1>
            <p className="text-muted text-sm">Vollständige Plattform-Verwaltung</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-2 bg-card-bg border border-card-border hover:border-muted text-sm text-muted hover:text-foreground rounded-lg transition-colors"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Aktualisieren
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { icon: FiList,        label: 'Auktionen',     value: auctions.length,                                    color: 'text-foreground' },
          { icon: FiTrendingUp,  label: 'Live',           value: activeAuctions.length,                              color: 'text-success'    },
          { icon: FiAlertTriangle, label: 'Ausstehend',  value: pendingAuctions.length,                              color: pendingAuctions.length > 0 ? 'text-accent' : 'text-muted' },
          { icon: FiUsers,       label: 'Nutzer',         value: users.length,                                       color: 'text-foreground' },
          { icon: FiDollarSign,  label: 'Umsatz Gebote',  value: `${(totalVolume / 1000).toFixed(1)}k €`,            color: 'text-accent'     },
          { icon: FiCreditCard,  label: 'Gebühren',       value: `${totalRevenue.toLocaleString('de-DE')} €`,        color: 'text-accent'     },
        ].map((s, i) => (
          <div key={i} className="bg-card-bg border border-card-border rounded-xl p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card-bg border border-card-border rounded-xl p-1 mb-6 overflow-x-auto">
        {[
          { key: 'overview' as Tab, label: 'Übersicht',  count: 0 },
          { key: 'auctions' as Tab, label: 'Auktionen',  count: pendingAuctions.length },
          { key: 'dealers'  as Tab, label: 'Händler',    count: dealers.length },
          { key: 'users'    as Tab, label: 'Nutzer',     count: 0 },
          { key: 'payments' as Tab, label: 'Zahlungen',  count: 0 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key ? 'bg-accent text-black' : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-black/20 text-black' : 'bg-accent/20 text-accent'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Action Alerts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingAuctions.length > 0 && (
              <button
                onClick={() => { setActiveTab('auctions'); setAuctionFilter('pending'); }}
                className="text-left bg-accent/10 border border-accent/30 hover:border-accent rounded-xl p-4 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FiAlertTriangle className="w-4 h-4 text-accent" />
                  <p className="text-sm font-semibold text-accent">
                    {pendingAuctions.length} Auktion{pendingAuctions.length !== 1 ? 'en' : ''} ausstehend
                  </p>
                </div>
                <p className="text-xs text-muted">Warten auf Freigabe →</p>
              </button>
            )}
            {dealers.length > 0 && (
              <button
                onClick={() => setActiveTab('dealers')}
                className="text-left bg-accent/10 border border-accent/30 hover:border-accent rounded-xl p-4 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FiUserCheck className="w-4 h-4 text-accent" />
                  <p className="text-sm font-semibold text-accent">
                    {dealers.length} Händler-Antrag{dealers.length !== 1 ? 'e' : ''}
                  </p>
                </div>
                <p className="text-xs text-muted">Prüfen und freigeben →</p>
              </button>
            )}
            {pendingAuctions.length === 0 && dealers.length === 0 && (
              <div className="col-span-full bg-success/10 border border-success/20 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-success" />
                  <p className="text-sm font-semibold text-success">Keine offenen Aufgaben</p>
                </div>
                <p className="text-xs text-muted mt-1">Alle Freigaben bearbeitet.</p>
              </div>
            )}
          </div>

          {/* Live Auctions */}
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h2 className="font-semibold text-sm mb-4">Aktuelle Live-Auktionen</h2>
            {activeAuctions.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">Keine aktiven Auktionen.</p>
            ) : (
              <div className="space-y-2">
                {activeAuctions.slice(0, 8).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-card-border last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex items-center gap-1 text-xs text-success font-semibold flex-shrink-0">
                        <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                        LIVE
                      </span>
                      <span className="text-sm truncate">{a.car.title}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-accent font-mono text-sm">{(a.currentBid || 0).toLocaleString('de-DE')} €</span>
                      <span className="text-muted text-xs">{a.bidCount || 0} Gebote</span>
                      <Link href={`/auktion/${a.id}`} className="text-muted hover:text-foreground">
                        <FiEye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payments */}
          {payments.length > 0 && (
            <div className="bg-card-bg border border-card-border rounded-xl p-5">
              <h2 className="font-semibold text-sm mb-4">Letzte Zahlungen</h2>
              <div className="space-y-2">
                {payments.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-card-border last:border-0 text-sm">
                    <span className="text-muted">Auktion #{p.auctionId.slice(0, 8)}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{p.totalAmount?.toLocaleString('de-DE')} €</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.status === 'succeeded' ? 'bg-success/20 text-success'
                        : p.status === 'failed'  ? 'bg-danger/20 text-danger'
                        : 'bg-accent/20 text-accent'
                      }`}>
                        {p.status === 'succeeded' ? 'Bezahlt' : p.status === 'failed' ? 'Fehler' : 'Offen'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auctions Tab */}
      {activeTab === 'auctions' && (
        <div className="space-y-4">
          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: 'all'       as AuctionFilter, label: 'Alle',        count: auctions.length },
              { key: 'pending'   as AuctionFilter, label: 'Ausstehend',  count: pendingAuctions.length },
              { key: 'active'    as AuctionFilter, label: 'Live',        count: activeAuctions.length },
              { key: 'ended'     as AuctionFilter, label: 'Beendet',     count: endedAuctions.length },
              { key: 'cancelled' as AuctionFilter, label: 'Storniert',   count: auctions.filter(a => a.status === 'cancelled').length },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setAuctionFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all whitespace-nowrap ${
                  auctionFilter === f.key
                    ? 'bg-accent border-accent text-black font-semibold'
                    : 'bg-card-bg border-card-border text-muted hover:text-foreground hover:border-muted'
                }`}
              >
                {f.label}
                <span className={`${auctionFilter === f.key ? 'text-black/60' : 'text-muted'}`}>
                  ({f.count})
                </span>
              </button>
            ))}
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            {filteredAuctions.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm">Keine Auktionen in dieser Kategorie.</div>
            ) : (
              <div className="divide-y divide-card-border">
                {filteredAuctions.map(a => {
                  const hasImage = a.car.images && a.car.images.length > 0;
                  const isWorking = working === a.id;
                  return (
                    <div key={a.id} className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-input-bg flex-shrink-0 flex items-center justify-center">
                          {hasImage
                            ? <img src={a.car.images[0]} alt={a.car.title} className="w-full h-full object-cover" />
                            : <FiImage className="w-4 h-4 text-muted" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{a.car.title}</p>
                          <p className="text-xs text-muted truncate">
                            {a.sellerCompany || a.sellerName} · Start: {(a.startPrice || 0).toLocaleString('de-DE')} € ·
                            Aktuell: <span className="text-accent">{(a.currentBid || 0).toLocaleString('de-DE')} €</span> ·
                            {a.bidCount || 0} Gebote
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.status === 'active'    ? 'bg-success/20 text-success'
                          : a.status === 'pending' ? 'bg-accent/20 text-accent'
                          : a.status === 'cancelled' ? 'bg-danger/20 text-danger'
                          : a.status === 'sold'    ? 'bg-success/20 text-success'
                          : 'bg-muted/20 text-muted'
                        }`}>
                          {a.status === 'active' ? 'Live'
                            : a.status === 'pending' ? 'Ausstehend'
                            : a.status === 'cancelled' ? 'Abgelehnt'
                            : a.status === 'ended' ? 'Beendet'
                            : a.status === 'sold' ? 'Verkauft'
                            : a.status}
                        </span>

                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveAuction(a.id)} disabled={!!isWorking}
                              className="p-1.5 bg-success/20 hover:bg-success/30 text-success rounded-lg transition-colors disabled:opacity-50"
                              title="Freigeben">
                              {isWorking ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleRejectAuction(a.id)} disabled={!!isWorking}
                              className="p-1.5 bg-danger/20 hover:bg-danger/30 text-danger rounded-lg transition-colors disabled:opacity-50"
                              title="Ablehnen">
                              <FiXCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {a.status === 'active' && (
                          <button onClick={() => handleEndAuction(a.id)} disabled={!!isWorking}
                            className="p-1.5 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg transition-colors disabled:opacity-50"
                            title="Sofort beenden">
                            <FiStopCircle className="w-4 h-4" />
                          </button>
                        )}
                        <Link href={`/auktion/${a.id}`} className="p-1.5 text-muted hover:text-foreground transition-colors" title="Ansehen">
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDeleteAuction(a.id)} disabled={!!isWorking}
                          className="p-1.5 text-muted hover:text-danger transition-colors disabled:opacity-50"
                          title="Löschen">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dealers Tab */}
      {activeTab === 'dealers' && (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border">
            <h2 className="font-semibold text-sm">Ausstehende Händler-Anträge</h2>
          </div>
          {dealers.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              <FiCheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
              Alle Händler-Anträge bearbeitet.
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {dealers.map(d => {
                const isWorking = working === d.uid;
                return (
                  <div key={d.uid} className="flex items-center justify-between px-5 py-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent flex-shrink-0">
                        {(d.displayName || d.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.companyName || d.displayName}</p>
                        <p className="text-xs text-muted truncate">{d.displayName} · {d.email}</p>
                        {d.phone && <p className="text-xs text-muted">Tel: {d.phone}</p>}
                        {d.createdAt && (
                          <p className="text-xs text-muted">
                            Registriert: {new Date(d.createdAt).toLocaleDateString('de-DE')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleApproveDealer(d.uid)} disabled={!!isWorking}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success/20 hover:bg-success/30 text-success text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                        {isWorking ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheckCircle className="w-3.5 h-3.5" />}
                        Freigeben
                      </button>
                      <button onClick={() => handleRejectDealer(d.uid)} disabled={!!isWorking}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/20 hover:bg-danger/30 text-danger text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                        <FiXCircle className="w-3.5 h-3.5" />
                        Ablehnen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Name, E-Mail oder Firma suchen..."
              className="w-full bg-card-bg border border-card-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Alle Nutzer</h2>
              <span className="text-xs text-muted">{filteredUsers.length} von {users.length}</span>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-muted text-sm">Keine Nutzer gefunden.</div>
            ) : (
              <div className="divide-y divide-card-border">
                {filteredUsers.map(u => {
                  const isWorking = working === u.uid;
                  const isMe = u.uid === user.uid;
                  return (
                    <div key={u.uid} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          u.role === 'admin' ? 'bg-danger/20 text-danger'
                          : u.role === 'dealer' ? 'bg-accent/20 text-accent'
                          : 'bg-input-bg text-muted'
                        }`}>
                          {(u.displayName || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {u.displayName || u.email}
                            {isMe && <span className="ml-1.5 text-[10px] text-accent">(Sie)</span>}
                          </p>
                          <p className="text-xs text-muted truncate">{u.email}</p>
                          {u.companyName && <p className="text-xs text-muted truncate">{u.companyName}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {u.verified && (
                          <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">✓ verif.</span>
                        )}
                        {u.paymentVerified && (
                          <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">💳 zahl.</span>
                        )}
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.uid, e.target.value as UserRole)}
                          disabled={isMe || !!isWorking}
                          className={`text-xs px-2 py-1 rounded-lg border focus:outline-none focus:border-accent transition-colors disabled:opacity-50 ${
                            u.role === 'admin' ? 'bg-danger/10 border-danger/30 text-danger'
                            : u.role === 'dealer' ? 'bg-accent/10 border-accent/30 text-accent'
                            : 'bg-input-bg border-card-border text-foreground'
                          }`}
                        >
                          <option value="buyer">Käufer</option>
                          <option value="dealer">Händler</option>
                          <option value="admin">Admin</option>
                        </select>
                        {isWorking && <FiLoader className="w-3.5 h-3.5 animate-spin text-muted" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Alle Zahlungen</h2>
            <span className="text-xs text-muted">{payments.length} Transaktionen</span>
          </div>
          {payments.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              <FiCreditCard className="w-10 h-10 mx-auto mb-3 text-muted" />
              Noch keine Zahlungen.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border">
                    {['Auktion', 'Käufer', 'Zuschlag', 'Gebühr', 'Gesamt', 'Status', 'Datum'].map(h => (
                      <th key={h} className="text-left text-xs text-muted px-5 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.id} className={`${i < payments.length - 1 ? 'border-b border-card-border' : ''} hover:bg-input-bg/50`}>
                      <td className="px-5 py-3">
                        <Link href={`/auktion/${p.auctionId}`} className="text-accent hover:underline font-mono text-xs">
                          #{p.auctionId.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted text-xs font-mono">{p.buyerId.slice(0, 8)}</td>
                      <td className="px-5 py-3 font-mono">{p.bidAmount?.toLocaleString('de-DE')} €</td>
                      <td className="px-5 py-3 font-mono text-muted">{p.buyerFee} €</td>
                      <td className="px-5 py-3 font-mono font-semibold text-accent">{p.totalAmount?.toLocaleString('de-DE')} €</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'succeeded' ? 'bg-success/20 text-success'
                          : p.status === 'failed'  ? 'bg-danger/20 text-danger'
                          : 'bg-accent/20 text-accent'
                        }`}>
                          {p.status === 'succeeded' ? 'Bezahlt' : p.status === 'failed' ? 'Fehler'
                            : p.status === 'processing' ? 'In Bearbeitung' : 'Ausstehend'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted text-xs">
                        {p.createdAt ? new Date(p.createdAt as unknown as Date).toLocaleDateString('de-DE') : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
