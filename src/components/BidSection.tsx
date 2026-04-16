'use client';

import { useState, useEffect } from 'react';
import { Auction, Bid } from '@/types';
import { FiTrendingUp, FiDollarSign, FiAlertCircle, FiCreditCard, FiLock } from 'react-icons/fi';
import Link from 'next/link';

interface BidSectionProps {
  auction: Auction;
}

const mockBidHistory: Bid[] = [
  { id: 'b1', auctionId: '1', userId: 'u3', userName: 'MaxM.',    amount: 89500, timestamp: new Date(Date.now() - 120000), isAutoBid: false },
  { id: 'b2', auctionId: '1', userId: 'u5', userName: 'ThomasK.', amount: 88000, timestamp: new Date(Date.now() - 300000), isAutoBid: false },
  { id: 'b3', auctionId: '1', userId: 'u3', userName: 'MaxM.',    amount: 86500, timestamp: new Date(Date.now() - 600000), isAutoBid: false },
  { id: 'b4', auctionId: '1', userId: 'u7', userName: 'StefanW.', amount: 84000, timestamp: new Date(Date.now() - 900000), isAutoBid: false },
  { id: 'b5', auctionId: '1', userId: 'u2', userName: 'AnnaL.',   amount: 82000, timestamp: new Date(Date.now() - 1200000), isAutoBid: false },
];

const BUYER_FEE = 250;

export default function BidSection({ auction }: BidSectionProps) {
  // In production: get from useAuth()
  // Simulate: toggle paymentVerified to test both states
  const [paymentVerified] = useState(false);
  const [isLoggedIn] = useState(true);

  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState<Bid[]>(mockBidHistory);
  const [currentBid, setCurrentBid] = useState(auction.currentBid || auction.startPrice);
  const [showFlash, setShowFlash] = useState(false);
  const [error, setError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);

  const minBid = currentBid + 500;

  const quickBids = [
    { label: '+500 €',   amount: currentBid + 500  },
    { label: '+1.000 €', amount: currentBid + 1000 },
    { label: '+2.500 €', amount: currentBid + 2500 },
    { label: '+5.000 €', amount: currentBid + 5000 },
  ];

  function flash() {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 1000);
  }

  function handleBid(amount?: number) {
    const bidValue = amount || parseInt(bidAmount.replace(/\D/g, ''));
    if (!bidValue || bidValue < minBid) {
      setError(`Mindestgebot: ${minBid.toLocaleString('de-DE')} €`);
      return;
    }
    setError('');
    const newBid: Bid = {
      id: `b${Date.now()}`,
      auctionId: auction.id,
      userId: 'currentUser',
      userName: 'Du',
      amount: bidValue,
      timestamp: new Date(),
      isAutoBid: false,
    };
    setBids(prev => [newBid, ...prev]);
    setCurrentBid(bidValue);
    setBidAmount('');
    flash();
    setBidSuccess(true);
    setTimeout(() => setBidSuccess(false), 3000);
  }

  // Simulate incoming bids
  useEffect(() => {
    if (auction.status !== 'active') return;
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const names = ['MaxM.', 'AnnaL.', 'StefanW.', 'ThomasK.', 'ChrisP.'];
        const name = names[Math.floor(Math.random() * names.length)];
        const increment = [500, 1000, 1500][Math.floor(Math.random() * 3)];
        setCurrentBid(prev => {
          const newAmount = prev + increment;
          setBids(prevBids => [{
            id: `b${Date.now()}`, auctionId: auction.id,
            userId: `u${Math.random()}`, userName: name,
            amount: newAmount, timestamp: new Date(), isAutoBid: false,
          }, ...prevBids]);
          flash();
          return newAmount;
        });
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [auction.id, auction.status]);

  return (
    <div className="space-y-4">
      {/* Current Bid */}
      <div className={`bg-card-bg border border-card-border rounded-xl p-5 ${showFlash ? 'bid-flash' : ''}`}>
        <p className="text-sm text-muted mb-1">Aktuelles Höchstgebot</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-bold text-accent">
            {currentBid.toLocaleString('de-DE')}
          </span>
          <span className="text-xl text-accent">€</span>
        </div>
        <p className="text-xs text-muted mt-2">
          Höchstbietender: <span className="text-foreground">{bids[0]?.userName || auction.highestBidderName}</span>
        </p>

        {/* Buyer fee notice */}
        {auction.status === 'active' && (
          <div className="mt-3 pt-3 border-t border-card-border">
            <p className="text-xs text-muted">
              Gesamtkosten bei Gewinn:{' '}
              <span className="text-foreground font-semibold">
                {(currentBid + BUYER_FEE).toLocaleString('de-DE')} €
              </span>
              <span className="text-muted"> (inkl. {BUYER_FEE} € Käufergebühr)</span>
            </p>
          </div>
        )}
      </div>

      {/* Bid Input or Payment Gate */}
      {auction.status === 'active' && (
        <div className="bg-card-bg border border-card-border rounded-xl p-5">
          {!isLoggedIn ? (
            // Not logged in
            <div className="text-center py-2">
              <FiLock className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted mb-4">Melden Sie sich an, um mitzubieten.</p>
              <div className="flex gap-2">
                <Link href="/login" className="flex-1 text-center py-2.5 border border-card-border text-sm text-muted hover:text-foreground rounded-lg transition-colors">
                  Anmelden
                </Link>
                <Link href="/registrieren" className="flex-1 text-center py-2.5 bg-accent hover:bg-accent-hover text-black font-bold text-sm rounded-lg transition-colors">
                  Registrieren
                </Link>
              </div>
            </div>
          ) : !paymentVerified ? (
            // Logged in but no payment method
            <div>
              <div className="flex items-start gap-3 mb-4">
                <FiCreditCard className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-accent">Zahlungsmethode erforderlich</p>
                  <p className="text-xs text-muted mt-1">
                    Hinterlegen Sie eine Karte, um mitzubieten. Belastung nur bei Auktionsgewinn:
                    Zuschlag + <strong className="text-foreground">250 € Käufergebühr</strong>.
                  </p>
                </div>
              </div>
              <Link
                href="/konto?tab=zahlung"
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                <FiCreditCard className="w-4 h-4" />
                Zahlungsmethode hinterlegen
              </Link>
            </div>
          ) : (
            // Ready to bid
            <>
              {bidSuccess && (
                <div className="mb-3 bg-success/20 border border-success/30 text-success text-xs px-3 py-2 rounded-lg font-medium">
                  Gebot erfolgreich abgegeben! Sie bieten {bids[0]?.amount.toLocaleString('de-DE')} €.
                </div>
              )}
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4 text-accent" />
                Gebot abgeben
              </p>
              {/* Quick Bids */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {quickBids.map(qb => (
                  <button key={qb.amount} onClick={() => handleBid(qb.amount)}
                    className="text-sm bg-input-bg hover:bg-accent/20 border border-card-border hover:border-accent/50 text-foreground py-2 rounded-lg transition-all">
                    {qb.label}
                  </button>
                ))}
              </div>
              {/* Custom Bid */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                  <input type="text" value={bidAmount}
                    onChange={e => { setError(''); setBidAmount(e.target.value); }}
                    placeholder={`Min. ${minBid.toLocaleString('de-DE')} €`}
                    className="w-full bg-input-bg border border-card-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                    onKeyDown={e => e.key === 'Enter' && handleBid()} />
                </div>
                <button onClick={() => handleBid()}
                  className="bg-accent hover:bg-accent-hover text-black font-bold px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap">
                  Bieten
                </button>
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-danger text-xs mt-2">
                  <FiAlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              )}
              <p className="text-xs text-muted mt-2 text-center">
                Bei Gewinn: {(minBid + BUYER_FEE).toLocaleString('de-DE')} € (inkl. 250 € Gebühr)
              </p>
            </>
          )}
        </div>
      )}

      {/* Bid History */}
      <div className="bg-card-bg border border-card-border rounded-xl p-5">
        <p className="text-sm font-semibold mb-3">Gebotsverlauf</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {bids.map((bid, i) => (
            <div key={bid.id}
              className={`flex items-center justify-between text-sm py-2 ${i < bids.length - 1 ? 'border-b border-card-border' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                  {bid.userName.charAt(0)}
                </div>
                <span className={bid.userName === 'Du' ? 'text-accent font-semibold' : 'text-muted'}>
                  {bid.userName}
                </span>
              </div>
              <span className="font-mono font-semibold">{bid.amount.toLocaleString('de-DE')} €</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
