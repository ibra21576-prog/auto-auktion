'use client';

import Link from 'next/link';
import { Auction } from '@/types';
import CountdownTimer from './CountdownTimer';
import { FiMapPin, FiUsers, FiImage } from 'react-icons/fi';

export default function AuctionCard({ auction }: { auction: Auction }) {
  const { car, currentBid, startPrice, bidCount, status, endTime } = auction;
  const displayPrice = currentBid > 0 ? currentBid : startPrice;
  const hasImage = car.images?.length > 0;

  return (
    <Link href={`/auktion/${auction.id}`} className="group block focus:outline-none">
      <article className="bg-card-bg border border-card-border rounded-xl overflow-hidden transition-all duration-200 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-0.5">

        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-input-bg">
          {hasImage ? (
            <img
              src={car.images[0]}
              alt={car.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted">
              <FiImage className="w-7 h-7 opacity-20" />
              <p className="text-[11px] opacity-40">Kein Foto</p>
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Status badge */}
          <div className="absolute top-2.5 left-2.5">
            {status === 'active' ? (
              <span className="inline-flex items-center gap-1 bg-success text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
              </span>
            ) : status === 'upcoming' ? (
              <span className="inline-flex items-center gap-1 bg-accent text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                DEMNÄCHST
              </span>
            ) : (
              <span className="bg-black/60 text-muted text-[11px] font-bold px-2.5 py-1 rounded-md">
                BEENDET
              </span>
            )}
          </div>

          {/* Countdown */}
          {status === 'active' && (
            <div className="absolute bottom-2.5 right-2.5">
              <div className="bg-black/80 backdrop-blur-sm text-white text-[11px] font-mono px-2 py-1 rounded">
                <CountdownTimer endTime={endTime} />
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3.5">
          <h3 className="font-semibold text-[13px] text-foreground line-clamp-1 group-hover:text-accent transition-colors mb-1.5">
            {car.title}
          </h3>

          <div className="flex items-center gap-2 text-[11px] text-muted mb-3">
            <span className="flex items-center gap-0.5"><FiMapPin className="w-2.5 h-2.5" />{car.location}</span>
            <span className="text-card-border">·</span>
            <span>{car.year}</span>
            <span className="text-card-border">·</span>
            <span>{car.mileage.toLocaleString('de-DE')} km</span>
          </div>

          <div className="flex items-center justify-between border-t border-card-border pt-3">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">
                {currentBid > 0 ? 'Gebot' : 'Start'}
              </p>
              <p className="text-base font-black text-accent leading-none">
                {displayPrice.toLocaleString('de-DE')} €
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted">
              <FiUsers className="w-3 h-3" />
              <span>{bidCount}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
