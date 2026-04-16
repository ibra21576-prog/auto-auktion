'use client';

import { use } from 'react';
import { mockAuctions } from '@/lib/mock-data';
import CountdownTimer from '@/components/CountdownTimer';
import BidSection from '@/components/BidSection';
import LiveChat from '@/components/LiveChat';
import Link from 'next/link';
import { FiArrowLeft, FiMapPin, FiCalendar, FiActivity, FiShare2, FiHeart, FiInfo } from 'react-icons/fi';

export default function AuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const auction = mockAuctions.find((a) => a.id === id);

  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl font-bold mb-4">Auktion nicht gefunden</p>
        <Link href="/" className="text-accent hover:underline">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const { car } = auction;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Zurück zu Auktionen
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Car Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-card-bg border border-card-border">
            <img
              src={car.images[0]}
              alt={car.title}
              className="w-full h-full object-cover"
            />
            {/* Status Overlay */}
            <div className="absolute top-4 left-4">
              {auction.status === 'active' && (
                <span className="flex items-center gap-1.5 bg-success/90 text-white text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white p-2 rounded-full transition-colors">
                <FiHeart className="w-5 h-5" />
              </button>
              <button className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white p-2 rounded-full transition-colors">
                <FiShare2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Title & Timer */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{car.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <FiMapPin className="w-4 h-4" />
                  {car.location}
                </span>
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  {car.year}
                </span>
                <span className="flex items-center gap-1">
                  <FiActivity className="w-4 h-4" />
                  {car.mileage.toLocaleString('de-DE')} km
                </span>
              </div>
            </div>
            {auction.status === 'active' && (
              <div className="flex-shrink-0">
                <p className="text-xs text-muted mb-1.5 text-right">Endet in</p>
                <CountdownTimer endTime={auction.endTime} size="lg" />
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FiInfo className="w-4 h-4 text-accent" />
              Fahrzeugbeschreibung
            </h2>
            <p className="text-sm text-muted leading-relaxed">{car.description}</p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-card-border">
              {[
                { label: 'Marke', value: car.make },
                { label: 'Modell', value: car.model },
                { label: 'Baujahr', value: car.year.toString() },
                { label: 'Kilometerstand', value: `${car.mileage.toLocaleString('de-DE')} km` },
              ].map((spec) => (
                <div key={spec.label}>
                  <p className="text-xs text-muted">{spec.label}</p>
                  <p className="text-sm font-semibold mt-0.5">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                {auction.sellerName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold">{auction.sellerCompany || auction.sellerName}</p>
                <p className="text-xs text-muted">Verifizierter Händler</p>
              </div>
            </div>
          </div>

          {/* Chat - Mobile */}
          <div className="lg:hidden">
            <LiveChat auctionId={auction.id} />
          </div>
        </div>

        {/* Right Column - Bidding & Chat */}
        <div className="space-y-6">
          <BidSection auction={auction} />
          {/* Chat - Desktop */}
          <div className="hidden lg:block">
            <LiveChat auctionId={auction.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
