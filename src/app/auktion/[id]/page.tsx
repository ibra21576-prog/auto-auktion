'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuctionUpdate, startOrGetConversation } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { Auction } from '@/types';
import CountdownTimer from '@/components/CountdownTimer';
import BidSection from '@/components/BidSection';
import LiveChat from '@/components/LiveChat';
import Link from 'next/link';
import {
  FiArrowLeft, FiMapPin, FiCalendar, FiActivity, FiShare2, FiHeart,
  FiInfo, FiLoader, FiChevronLeft, FiChevronRight, FiImage, FiMessageSquare,
} from 'react-icons/fi';

export default function AuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null | 'not-found'>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [contactLoading, setContactLoading] = useState(false);

  async function contactSeller() {
    if (!user) {
      router.push(`/login?redirect=/auktion/${id}`);
      return;
    }
    if (auction && auction !== 'not-found' && user.uid === auction.sellerId) return;
    if (!auction || auction === 'not-found') return;
    setContactLoading(true);
    try {
      const convoId = await startOrGetConversation({
        me: { uid: user.uid, displayName: user.displayName || user.email },
        other: {
          uid: auction.sellerId,
          displayName: auction.sellerCompany || auction.sellerName,
        },
        auction: { id: auction.id, title: auction.car.title },
      });
      router.push(`/postfach/${convoId}`);
    } catch (err) {
      console.error('[ContactSeller]', err);
      setContactLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuctionUpdate(id, (data) => {
      setAuction(data);
    });
    // If auction doesn't exist, onAuctionUpdate won't call callback
    // Set a timeout to mark as not-found
    const timer = setTimeout(() => {
      setAuction(prev => prev === null ? 'not-found' : prev);
    }, 5000);
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [id]);

  if (auction === null) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center gap-4">
        <FiLoader className="w-8 h-8 text-accent animate-spin" />
        <p className="text-muted text-sm">Auktion wird geladen...</p>
      </div>
    );
  }

  if (auction === 'not-found') {
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
  const images = car.images && car.images.length > 0 ? car.images : [];
  const hasImages = images.length > 0;

  function prevImage() {
    setImageIndex(i => (i - 1 + images.length) % images.length);
  }

  function nextImage() {
    setImageIndex(i => (i + 1) % images.length);
  }

  const specs = [
    { label: 'Marke', value: car.make },
    { label: 'Modell', value: car.model },
    { label: 'Baujahr', value: car.year?.toString() },
    { label: 'Kilometerstand', value: `${car.mileage?.toLocaleString('de-DE')} km` },
    { label: 'Kraftstoff', value: car.fuelType },
    { label: 'Getriebe', value: car.transmission },
    { label: 'Leistung', value: car.power },
    { label: 'Farbe', value: car.color },
  ].filter(s => s.value && s.value !== 'undefined');

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
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="space-y-2">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-card-bg border border-card-border">
              {hasImages ? (
                <img
                  src={images[imageIndex]}
                  alt={car.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted">
                  <FiImage className="w-12 h-12" />
                  <p className="text-sm">Keine Fotos vorhanden</p>
                </div>
              )}

              {/* Status Overlay */}
              <div className="absolute top-4 left-4">
                {auction.status === 'active' && (
                  <span className="flex items-center gap-1.5 bg-success/90 text-white text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
                {auction.status === 'upcoming' && (
                  <span className="flex items-center gap-1.5 bg-accent/90 text-black text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                    BALD
                  </span>
                )}
                {auction.status === 'ended' && (
                  <span className="bg-muted/80 text-white text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                    BEENDET
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

              {/* Gallery Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white">
                    {imageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      i === imageIndex ? 'border-accent' : 'border-card-border opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Timer */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{car.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
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
                  {car.mileage?.toLocaleString('de-DE')} km
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

          {/* Specs */}
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <FiInfo className="w-4 h-4 text-accent" />
              Fahrzeugdaten
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {specs.map((spec) => (
                <div key={spec.label}>
                  <p className="text-xs text-muted">{spec.label}</p>
                  <p className="text-sm font-semibold mt-0.5">{spec.value}</p>
                </div>
              ))}
            </div>

            {car.description && (
              <div className="pt-4 border-t border-card-border">
                <p className="text-xs text-muted mb-2">Beschreibung</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{car.description}</p>
              </div>
            )}

            {car.damages && (
              <div className="mt-4 pt-4 border-t border-card-border">
                <p className="text-xs text-muted mb-2">Bekannte Mängel / Schäden</p>
                <p className="text-sm text-foreground leading-relaxed">{car.damages}</p>
              </div>
            )}

            {car.features && car.features.length > 0 && (
              <div className="mt-4 pt-4 border-t border-card-border">
                <p className="text-xs text-muted mb-3">Ausstattung</p>
                <div className="flex flex-wrap gap-2">
                  {car.features.map((f) => (
                    <span key={f} className="text-xs bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {car.vin && (
              <div className="mt-4 pt-4 border-t border-card-border">
                <p className="text-xs text-muted mb-1">FIN / VIN</p>
                <p className="text-sm font-mono text-foreground">{car.vin}</p>
              </div>
            )}
          </div>

          {/* Seller Info */}
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                {(auction.sellerCompany || auction.sellerName).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{auction.sellerCompany || auction.sellerName}</p>
                <p className="text-xs text-muted">Verifizierter Händler</p>
              </div>
              {user?.uid !== auction.sellerId && (
                <button
                  type="button"
                  onClick={contactSeller}
                  disabled={contactLoading}
                  className="inline-flex items-center gap-1.5 bg-input-bg border border-card-border hover:border-accent/60 disabled:opacity-50 text-foreground text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  {contactLoading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiMessageSquare className="w-3.5 h-3.5" />}
                  Kontaktieren
                </button>
              )}
            </div>
          </div>

          {/* Chat - Mobile */}
          <div className="lg:hidden">
            <LiveChat auctionId={auction.id} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <BidSection auction={auction} />
          <div className="hidden lg:block">
            <LiveChat auctionId={auction.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
