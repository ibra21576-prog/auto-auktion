'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createAuction } from '@/lib/firestore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FiUpload, FiCheck, FiInfo, FiAlertCircle, FiLoader, FiX, FiLock } from 'react-icons/fi';
import Link from 'next/link';

const FEATURES = [
  'Klimaanlage', 'Navi', 'Leder', 'Panoramadach', 'Sitzheizung', 'Rückfahrkamera',
  'Head-Up Display', 'LED Scheinwerfer', 'Sport-Fahrwerk', 'Sportauspuff',
  '20" Felgen', 'Harman Kardon', 'BOSE Sound', 'PDK/DSG', 'Launch Control',
];

export default function ErstellenPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [form, setForm] = useState({
    make: '', model: '', year: '', mileage: '',
    fuelType: 'Benzin', transmission: 'Automatik', power: '', color: '',
    vin: '', damages: '', description: '', location: '',
    startPrice: '', duration: '24',
  });

  // Redirect if not a dealer or admin
  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'dealer' && user.role !== 'admin'))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleFeature(f: string) {
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newFiles = [...imageFiles, ...files].slice(0, 20);
    setImageFiles(newFiles);
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setImagePreview(previews);
  }

  function removeImage(index: number) {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreview(newFiles.map(f => URL.createObjectURL(f)));
  }

  function canAdvanceStep1() {
    return form.make && form.model && form.year && form.mileage && form.location;
  }

  function canAdvanceStep2() {
    return form.description.trim().length > 0;
  }

  async function uploadImages(auctionId: string): Promise<string[]> {
    if (imageFiles.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const storageRef = ref(storage, `auctions/${auctionId}/${Date.now()}_${i}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const durationHours = parseInt(form.duration, 10);
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
      const carId = `car_${Date.now()}`;

      // Create auction doc first to get ID, then upload images
      const auctionId = await createAuction({
        sellerId: user.uid,
        sellerName: user.displayName || user.email,
        sellerCompany: user.companyName,
        car: {
          id: carId,
          title: `${form.year} ${form.make} ${form.model}`,
          make: form.make,
          model: form.model,
          year: parseInt(form.year, 10),
          mileage: parseInt(form.mileage, 10),
          fuelType: form.fuelType,
          transmission: form.transmission,
          power: form.power,
          color: form.color,
          description: form.description,
          images: [], // will update after upload
          location: form.location,
          vin: form.vin || undefined,
          damages: form.damages || undefined,
          features: selectedFeatures,
        },
        startPrice: parseInt(form.startPrice, 10),
        currentBid: 0,
        minimumIncrement: 500,
        bidCount: 0,
        highestBidderId: '',
        highestBidderName: '',
        startTime,
        endTime,
        status: 'pending',
        buyerFee: 250,
        approved: false,
        winnerPaid: false,
      });

      // Upload images and update the auction
      if (imageFiles.length > 0) {
        const imageUrls = await uploadImages(auctionId);
        const { updateAuction } = await import('@/lib/firestore');
        await updateAuction(auctionId, {
          car: {
            id: carId,
            title: `${form.year} ${form.make} ${form.model}`,
            make: form.make,
            model: form.model,
            year: parseInt(form.year, 10),
            mileage: parseInt(form.mileage, 10),
            fuelType: form.fuelType,
            transmission: form.transmission,
            power: form.power,
            color: form.color,
            description: form.description,
            images: imageUrls,
            location: form.location,
            vin: form.vin || undefined,
            damages: form.damages || undefined,
            features: selectedFeatures,
          },
        });
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitError('Fehler beim Einreichen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-4">
        <FiLoader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== 'dealer' && user.role !== 'admin')) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <FiLock className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Kein Zugriff</h2>
        <p className="text-muted text-sm mb-4">Nur verifizierte Händler können Fahrzeuge einstellen.</p>
        <Link href="/registrieren" className="text-accent hover:underline text-sm">
          Als Händler registrieren
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheck className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Auktion eingereicht!</h2>
        <p className="text-muted text-sm mb-6">Wird nach Admin-Prüfung freigeschaltet. Das dauert in der Regel bis zu 24 Stunden.</p>
        <Link
          href="/dashboard/haendler"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Zum Dashboard
        </Link>
      </div>
    );
  }

  const inputCls = "w-full bg-input-bg border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors";
  const labelCls = "block text-xs text-muted mb-1.5";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Auto einstellen</h1>
      <p className="text-muted text-sm mb-6">Stellen Sie Ihr Fahrzeug zur Live-Auktion ein.</p>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
              onClick={() => step > s && setStep(s)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                step === s ? 'bg-accent text-black' : step > s ? 'bg-success text-black cursor-pointer' : 'bg-card-border text-muted'
              }`}
            >
              {step > s ? <FiCheck className="w-4 h-4" /> : s}
            </button>
            {i < 2 && <div className={`h-0.5 flex-1 mx-1 ${step > s ? 'bg-success' : 'bg-card-border'}`} />}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted -mt-5 mb-8 px-1">
        <span className={step >= 1 ? 'text-foreground font-medium' : ''}>Fahrzeugdaten</span>
        <span className={step >= 2 ? 'text-foreground font-medium' : ''}>Fotos & Details</span>
        <span className={step >= 3 ? 'text-foreground font-medium' : ''}>Auktionsset.</span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Fahrzeugdaten */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-card-bg border border-card-border rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-accent">Fahrzeugdaten</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Marke *</label>
                  <input name="make" value={form.make} onChange={handleChange} required placeholder="Porsche" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Modell *</label>
                  <input name="model" value={form.model} onChange={handleChange} required placeholder="911 Carrera S" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Baujahr *</label>
                  <input name="year" type="number" value={form.year} onChange={handleChange} required placeholder="2020" min="1900" max="2026" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kilometerstand (km) *</label>
                  <input name="mileage" type="number" value={form.mileage} onChange={handleChange} required placeholder="25000" min="0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kraftstoff *</label>
                  <select name="fuelType" value={form.fuelType} onChange={handleChange} className={inputCls}>
                    {['Benzin', 'Diesel', 'Elektro', 'Hybrid', 'LPG'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Getriebe *</label>
                  <select name="transmission" value={form.transmission} onChange={handleChange} className={inputCls}>
                    {['Automatik', 'Manuell', 'PDK/DSG', 'CVT'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Leistung (PS)</label>
                  <input name="power" value={form.power} onChange={handleChange} placeholder="450 PS" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Farbe</label>
                  <input name="color" value={form.color} onChange={handleChange} placeholder="GT-Silber Metallic" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Standort *</label>
                <input name="location" value={form.location} onChange={handleChange} required placeholder="München" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>FIN / VIN (optional)</label>
                <input name="vin" value={form.vin} onChange={handleChange} placeholder="WP0ZZZ99ZTS392124" className={inputCls} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => canAdvanceStep1() && setStep(2)}
              disabled={!canAdvanceStep1()}
              className="w-full bg-accent hover:bg-accent-hover text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter →
            </button>
          </div>
        )}

        {/* Step 2: Fotos & Beschreibung */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-card-bg border border-card-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-accent mb-4">Fotos</h2>
              <label className="cursor-pointer block">
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  imagePreview.length === 0 ? 'border-card-border hover:border-accent/50' : 'border-accent/30'
                }`}>
                  <FiUpload className="w-8 h-8 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted">Fotos hochladen (max. 20)</p>
                  <p className="text-xs text-muted mt-1">JPG, PNG, WEBP bis 10 MB</p>
                </div>
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              </label>

              {imagePreview.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {imagePreview.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-input-bg group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-danger text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                          Titelbild
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card-bg border border-card-border rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-accent">Beschreibung & Zustand</h2>
              <div>
                <label className={labelCls}>Fahrzeugbeschreibung *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Beschreiben Sie das Fahrzeug: Ausstattung, Zustand, Scheckheft, Besitzer..."
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>Bekannte Mängel / Schäden</label>
                <textarea
                  name="damages"
                  value={form.damages}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Keine bekannten Mängel, oder beschreiben Sie vorhandene Schäden..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            <div className="bg-card-bg border border-card-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-accent mb-3">Ausstattung</h2>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFeature(f)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                      selectedFeatures.includes(f)
                        ? 'border-accent bg-accent/20 text-accent'
                        : 'border-card-border text-muted hover:border-muted'
                    }`}
                  >
                    {selectedFeatures.includes(f) ? '✓ ' : ''}{f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-card-border text-muted hover:text-foreground py-3 rounded-xl text-sm transition-colors">
                ← Zurück
              </button>
              <button
                type="button"
                onClick={() => canAdvanceStep2() && setStep(3)}
                disabled={!canAdvanceStep2()}
                className="flex-1 bg-accent hover:bg-accent-hover text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Auktionseinstellungen */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="bg-card-bg border border-card-border rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-accent">Auktionseinstellungen</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Startpreis (€) *</label>
                  <input name="startPrice" type="number" value={form.startPrice} onChange={handleChange} required placeholder="50000" min="1" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Laufzeit *</label>
                  <select name="duration" value={form.duration} onChange={handleChange} className={inputCls}>
                    {[['6', '6 Stunden'], ['12', '12 Stunden'], ['24', '24 Stunden'], ['48', '48 Stunden'], ['72', '72 Stunden']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-input-bg border border-card-border rounded-xl p-4">
              <div className="flex items-start gap-2">
                <FiInfo className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted space-y-1">
                  <p className="font-semibold text-foreground">Käufergebühr: 250 € pro Auktion</p>
                  <p>Der Gewinner zahlt den Zuschlagspreis + 250 € Käufergebühr via Stripe.</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {form.startPrice && (
              <div className="bg-card-bg border border-accent/30 rounded-xl p-4">
                <p className="text-xs font-semibold text-accent mb-2">Zusammenfassung</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                  <span className="text-muted">Fahrzeug</span>
                  <span>{form.year} {form.make} {form.model}</span>
                  <span className="text-muted">Kilometerstand</span>
                  <span>{Number(form.mileage).toLocaleString('de-DE')} km</span>
                  <span className="text-muted">Standort</span>
                  <span>{form.location}</span>
                  <span className="text-muted">Fotos</span>
                  <span>{imageFiles.length} Foto{imageFiles.length !== 1 ? 's' : ''}</span>
                  <span className="text-muted">Startpreis</span>
                  <span className="text-accent font-semibold">{Number(form.startPrice).toLocaleString('de-DE')} €</span>
                  <span className="text-muted">Laufzeit</span>
                  <span>{form.duration} Stunden</span>
                </div>
              </div>
            )}

            {submitError && (
              <div className="flex items-start gap-2 bg-danger/10 border border-danger/30 text-danger text-xs px-3 py-2.5 rounded-lg">
                <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 border border-card-border text-muted hover:text-foreground py-3 rounded-xl text-sm transition-colors">
                ← Zurück
              </button>
              <button
                type="submit"
                disabled={submitting || !form.startPrice}
                className="flex-1 bg-accent hover:bg-accent-hover text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <FiLoader className="w-4 h-4 animate-spin" />}
                {submitting ? 'Wird hochgeladen...' : 'Zur Prüfung einreichen'}
              </button>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted">
              <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <p>Auktionen werden nach Admin-Prüfung (i.d.R. innerhalb von 24h) veröffentlicht.</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
