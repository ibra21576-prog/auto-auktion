'use client';

import Link from 'next/link';
import { Auction } from '@/types';
import CountdownTimer from './CountdownTimer';
import { FiMapPin, FiUsers, FiClock, FiImage } from 'react-icons/fi';

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const { car, currentBid, startPrice, bidCount, status, endTime } = auction;
  const displayPrice = currentBid > 0 ? currentBid : startPrice;

  return (
    <Link href={`/auktion/${auction.id}`} className="group block">
      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-input-bg">
          {car.images && car.images.length > 0 ? (
            <img
              src={car.images[0]}
              alt={car.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted">
              <FiImage className="w-8 h-8" />
              <p className="text-xs">Kein Foto</p>
            </div>
          )}
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {status === 'active' ? (
              <span className="flex items-center gap-1.5 bg-success/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            ) : status === 'upcoming' ? (
              <span className="flex items-center gap-1.5 bg-accent/90 text-black text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                <FiClock className="w-3 h-3" />
                BALD
              </span>
            ) : (
              <span className="bg-muted/80 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                BEENDET
              </span>
            )}
          </div>
          {/* Timer */}
          {status === 'active' && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <CountdownTimer endTime={endTime} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {car.title}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted">
            <span className="flex items-center gap-1">
              <FiMapPin className="w-3 h-3" />
              {car.location}
            </span>
            <span>{car.year}</span>
            <span>{car.mileage.toLocaleString('de-DE')} km</span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-card-border">
            <div>
              <p className="text-xs text-muted">
                {currentBid > 0 ? 'Aktuelles Gebot' : 'Startpreis'}
              </p>
              <p className="text-lg font-bold text-accent">
                {displayPrice.toLocaleString('de-DE')} €
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted">
              <FiUsers className="w-3.5 h-3.5" />
              <span>{bidCount} Gebote</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
