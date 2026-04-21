'use client';

import Link from 'next/link';
import { Auction } from '@/types';
import CountdownTimer from './CountdownTimer';
import { FiMapPin, FiUsers, FiImage } from 'react-icons/fi';

export default function AuctionCard({ auction }: { auction: Auction }) {
  const { car, currentBid, startPrice, bidCount, status, endTime } = auction;
  const displayPrice = currentBid > 0 ? currentBid : startPrice;
  const hasImage = car.images && car.images.length > 0;

  return (
    <Link href={`/auktion/${auction.id}`} className="group block focus:outline-none">
      <article className="relative bg-card-bg border border-card-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40">

        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-input-bg">
          {hasImage ? (
            <img
              src={car.images[0]}
              alt={car.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted">
              <FiImage className="w-8 h-8 opacity-30" />
              <p className="text-xs opacity-50">Kein Foto</p>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            {status === 'active' ? (
              <span className="flex items-center gap-1.5 bg-success/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            ) : status === 'upcoming' ? (
              <span className="flex items-center gap-1.5 bg-accent/90 text-black text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg">
                BALD
              </span>
            ) : (
              <span className="bg-black/60 text-muted text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                BEENDET
              </span>
            )}
          </div>

          {/* Countdown on image */}
          {status === 'active' && (
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <CountdownTimer endTime={endTime} />
            </div>
          )}

          {/* Image count pill */}
          {car.images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
              {car.images.length} Fotos
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1 text-[15px]">
            {car.title}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <FiMapPin className="w-3 h-3 flex-shrink-0" />
              {car.location}
            </span>
            <span className="text-card-border">·</span>
            <span>{car.year}</span>
            <span className="text-card-border">·</span>
            <span>{car.mileage.toLocaleString('de-DE')} km</span>
          </div>

          {/* Price + bids */}
          <div className="flex items-end justify-between pt-2 border-t border-card-border">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">
                {currentBid > 0 ? 'Aktuelles Gebot' : 'Startpreis'}
              </p>
              <p className="text-xl font-black text-accent leading-none">
                {displayPrice.toLocaleString('de-DE')} €
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted bg-input-bg px-2.5 py-1.5 rounded-lg">
              <FiUsers className="w-3.5 h-3.5" />
              <span>{bidCount}</span>
            </div>
          </div>
        </div>

        {/* Accent line at bottom — shows on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/0 via-accent to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </article>
    </Link>
  );
}
