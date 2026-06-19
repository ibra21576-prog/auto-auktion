'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createAuction } from '@/lib/firestore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  FiUpload, FiCheck, FiInfo, FiAlertCircle, FiLoader, FiX, FiLock,
  FiChevronDown, FiCamera,
} from 'react-icons/fi';
import Link from 'next/link';

// ─── Static data ──────────────────────────────────────────────────────────────

const CAR_MAKES = [
  'Abarth', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Bugatti',
  'Chevrolet', 'Citroën', 'Cupra', 'Dacia', 'Dodge', 'DS', 'Ferrari', 'Fiat',
  'Ford', 'Genesis', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
  'Lamborghini', 'Land Rover', 'Lexus', 'Lotus', 'Maserati', 'Mazda', 'McLaren',
  'Mercedes-Benz', 'MINI', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche',
  'Renault', 'Rolls-Royce', 'SEAT', 'Skoda', 'Smart', 'Subaru', 'Suzuki',
  'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Sonstige',
];

const BODY_TYPES = [
  { value: 'Limousine',     icon: '🚗' },
  { value: 'Kombi',         icon: '🚙' },
  { value: 'SUV / Gelände', icon: '🛻' },
  { value: 'Coupé',         icon: '🏎️' },
  { value: 'Cabrio',        icon: '🚘' },
  { value: 'Van / Minibus', icon: '🚐' },
  { value: 'Kleinwagen',    icon: '🚗' },
  { value: 'Pick-up',       icon: '🛻' },
];

const COLORS = [
  { name: 'Weiß',       hex: '#F8FAFC' },
  { name: 'Silber',     hex: '#94A3B8' },
  { name: 'Grau',       hex: '#64748B' },
  { name: 'Schwarz',    hex: '#0F172A' },
  { name: 'Blau',       hex: '#2563EB' },
  { name: 'Dunkelblau', hex: '#1E3A8A' },
  { name: 'Rot',        hex: '#DC2626' },
  { name: 'Bordeaux',   hex: '#7F1D1D' },
  { name: 'Grün',       hex: '#16A34A' },
  { name: 'Gelb',       hex: '#EAB308' },
  { name: 'Orange',     hex: '#EA580C' },
  { name: 'Braun',      hex: '#92400E' },
  { name: 'Beige',      hex: '#D4B483' },
  { name: 'Gold',       hex: '#B45309' },
  { name: 'Violett',    hex: '#7C3AED' },
  { name: 'Sonstige',   hex: '#334155' },
];

const FEATURES_BY_CAT: Record<string, string[]> = {
  'Komfort': [
    'Klimaanlage', 'Klimaautomatik', 'Sitzheizung', 'Lenkradheizung',
    'Elektrische Sitze', 'Massagesitze', 'Panoramadach', 'Schiebedach',
    'Standheizung', 'Wärmepumpe',
  ],
  'Navigation & Infotainment': [
    'Navigationssystem', 'Apple CarPlay', 'Android Auto', 'Head-Up Display',
    'Digitalcockpit', 'Wireless Charging', 'Bluetooth', 'DAB+ Radio',
    'Harman Kardon', 'BOSE Sound', 'Bang & Olufsen',
  ],
  'Sicherheit & Assistenz': [
    'Rückfahrkamera', 'Einparkhilfe', '360°-Kamera', 'Toter-Winkel-Assistent',
    'Spurhalteassistent', 'Notbremsassistent', 'Tempomat', 'Adaptiver Tempomat',
    'Nachtsichtassistent', 'Verkehrszeichenerkennung',
  ],
  'Licht': [
    'LED Scheinwerfer', 'Matrix LED', 'Laserlicht', 'Xenon', 'Ambientebeleuchtung',
  ],
  'Fahrwerk & Antrieb': [
    'Sport-Fahrwerk', 'Adaptives Fahrwerk', 'Luftfederung',
    'Keramikbremsen', 'Launch Control', 'Sport-Differenzial',
  ],
  'Felgen': ['17" Felgen', '18" Felgen', '19" Felgen', '20" Felgen', '21" Felgen', '22" Felgen'],
  'Sonstiges': [
    'Anhängerkupplung', 'Dachreling', 'Elektrische Heckklappe',
    'Keyless Entry', 'Keyless Start', 'Start-Stopp-Automatik',
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Form = {
  make: string; model: string; variant: string; bodyType: string;
  year: string; firstRegMonth: string; firstRegYear: string;
  mileage: string; location: string; vin: string;
  fuelType: string; transmission: string; power: string;
  engineSize: string; cylinders: string; drive: string;
  doors: string; seats: string;
  color: string; colorType: string; interiorColor: string; interiorMaterial: string;
  condition: string; previousOwners: string;
  huMonth: string; huYear: string;
  serviceHistory: string; nonSmoker: string;
  consumption: string; co2: string; emissionClass: string;
  damages: string; description: string;
  startPrice: string; duration: string;
};

const INIT: Form = {
  make: '', model: '', variant: '', bodyType: '',
  year: '', firstRegMonth: '', firstRegYear: '',
  mileage: '', location: '', vin: '',
  fuelType: 'Benzin', transmission: 'Automatik', power: '',
  engineSize: '', cylinders: '', drive: '',
  doors: '', seats: '',
  color: '', colorType: 'Metallic', interiorColor: '', interiorMaterial: '',
  condition: '', previousOwners: '',
  huMonth: '', huYear: '',
  serviceHistory: '', nonSmoker: '',
  consumption: '', co2: '', emissionClass: 'Euro 6',
  damages: '', description: '',
  startPrice: '', duration: '24',
};

const STEPS = ['Fahrzeug', 'Technik', 'Zustand', 'Auktion'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ErstellenPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState<Form>(INIT);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/erstellen');
  }, [user, authLoading, router]);

  function upd(name: keyof Form, value: string) {
    setForm(p => ({ ...p, [name]: value }));
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    upd(e.target.name as keyof Form, e.target.value);
  }

  function toggleFeature(f: string) {
    setFeatures(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  }

  function addImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...imageFiles, ...Array.from(e.target.files || [])].slice(0, 20);
    setImageFiles(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }

  function removeImage(i: number) {
    const files = imageFiles.filter((_, idx) => idx !== i);
    setImageFiles(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }

  async function uploadImages(auctionId: string) {
    const urls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const r = ref(storage, `auctions/${auctionId}/${Date.now()}_${i}`);
      await uploadBytes(r, imageFiles[i]);
      urls.push(await getDownloadURL(r));
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const dur = parseInt(form.duration, 10);
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + dur * 3_600_000);
      const carId = `car_${Date.now()}`;
      const title = [form.year, form.make, form.model, form.variant].filter(Boolean).join(' ');

      const car: Record<string, unknown> = {
        id: carId, title,
        make: form.make, model: form.model,
        year: parseInt(form.year, 10),
        mileage: parseInt(form.mileage, 10),
        fuelType: form.fuelType, transmission: form.transmission,
        power: form.power, color: form.color,
        description: form.description,
        images: [], location: form.location,
        features,
      };
      const s = (k: string, v: string) => { if (v.trim()) car[k] = v.trim(); };
      const b = (k: string, v: string) => { if (v === 'ja') car[k] = true; else if (v === 'nein') car[k] = false; };
      s('variant', form.variant); s('bodyType', form.bodyType);
      if (form.firstRegMonth && form.firstRegYear)
        car.firstRegistration = `${form.firstRegMonth}/${form.firstRegYear}`;
      s('engineSize', form.engineSize); s('cylinders', form.cylinders);
      s('drive', form.drive); s('doors', form.doors); s('seats', form.seats);
      s('colorType', form.colorType); s('interiorColor', form.interiorColor);
      s('interiorMaterial', form.interiorMaterial); s('condition', form.condition);
      s('previousOwners', form.previousOwners);
      s('huMonth', form.huMonth); s('huYear', form.huYear);
      b('serviceHistory', form.serviceHistory); b('nonSmoker', form.nonSmoker);
      s('consumption', form.consumption); s('co2', form.co2);
      s('emissionClass', form.emissionClass);
      s('damages', form.damages); s('vin', form.vin);

      const isAuto = user.role === 'admin' || user.verified === true || user.role === 'buyer';
      const payload: Record<string, unknown> = {
        sellerId: user.uid, sellerName: user.displayName || user.email,
        car, startPrice: parseInt(form.startPrice, 10),
        currentBid: 0, minimumIncrement: 500, bidCount: 0,
        highestBidderId: '', highestBidderName: '',
        startTime, endTime,
        status: isAuto ? 'active' : 'pending',
        buyerFee: 250, approved: isAuto, winnerPaid: false,
      };
      if (user.companyName) payload.sellerCompany = user.companyName;

      const auctionId = await createAuction(payload as Parameters<typeof createAuction>[0]);
      if (imageFiles.length > 0) {
        const urls = await uploadImages(auctionId);
        const { updateAuction } = await import('@/lib/firestore');
        await updateAuction(auctionId, { car: { ...car, images: urls } } as Parameters<typeof updateAuction>[1]);
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitError('Fehler beim Einreichen. Bitte erneut versuchen.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="flex items-center justify-center py-32">
      <FiLoader className="w-8 h-8 text-accent animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <FiLock className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
      <h2 className="text-xl font-bold mb-2">Anmeldung erforderlich</h2>
      <p className="text-sm text-muted mb-5">Melde dich an, um ein Fahrzeug einzustellen.</p>
      <Link href="/login?redirect=/erstellen"
        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
        Jetzt anmelden
      </Link>
    </div>
  );

  if (submitted) {
    const live = user.role === 'admin' || user.verified === true;
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-success/15 border border-success/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiCheck className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{live ? 'Auktion ist live!' : 'Eingereicht!'}</h2>
        <p className="text-sm text-muted mb-8 max-w-xs mx-auto">
          {live
            ? 'Deine Auktion ist jetzt auf der Startseite sichtbar.'
            : 'Wird nach Admin-Prüfung freigeschaltet (i.d.R. 24h).'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
            Zur Startseite
          </Link>
          <button onClick={() => { setSubmitted(false); setStep(1); setForm(INIT); setFeatures([]); setImageFiles([]); setPreviews([]); }}
            className="inline-flex items-center justify-center gap-2 border border-card-border text-muted hover:text-foreground px-5 py-2.5 rounded-lg text-sm transition-colors">
            Weiteres Auto einstellen
          </button>
        </div>
      </div>
    );
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inp = "w-full bg-input-bg border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50";
  const lbl = "block text-xs font-medium text-muted mb-1.5";
  const card = "bg-card-bg border border-card-border rounded-xl p-5";

  function Sel({ name, value, opts, placeholder }: { name: keyof Form; value: string; opts: string[]; placeholder?: string }) {
    return (
      <div className="relative">
        <select name={name} value={value} onChange={onChange} className={`${inp} appearance-none pr-8`}>
          {placeholder && <option value="">{placeholder}</option>}
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
      </div>
    );
  }

  function YesNo({ label, name }: { label: string; name: 'serviceHistory' | 'nonSmoker' }) {
    const v = form[name];
    return (
      <div className="flex items-center justify-between py-3 border-b border-card-border last:border-0">
        <span className="text-sm text-muted">{label}</span>
        <div className="flex gap-1.5">
          {[['ja', 'Ja'], ['nein', 'Nein']] .map(([val, txt]) => (
            <button key={val} type="button" onClick={() => upd(name, v === val ? '' : val)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                v === val
                  ? val === 'ja' ? 'bg-success/20 text-success border border-success/40' : 'bg-danger/20 text-danger border border-danger/40'
                  : 'bg-input-bg text-muted border border-card-border hover:border-muted'
              }`}>
              {txt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const ok1 = () => form.make && form.model && form.year && form.mileage && form.location;
  const ok2 = () => !!(form.fuelType && form.transmission);
  const ok3 = () => form.description.trim().length >= 10;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-16">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Auto einstellen</h1>
        <p className="text-muted text-sm mt-1">Ausführliche Angaben erhöhen die Gebote erheblich.</p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <button type="button" onClick={() => done && setStep(s)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                    done   ? 'bg-success text-white cursor-pointer' :
                    active ? 'bg-accent text-white ring-4 ring-accent/20' :
                             'bg-input-bg text-muted border border-card-border'
                  }`}>
                  {done ? <FiCheck className="w-4 h-4" /> : s}
                </button>
                <span className={`ml-2 text-xs font-medium hidden sm:block ${active ? 'text-foreground' : 'text-muted'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mx-3 sm:mx-4 ${done ? 'bg-success' : 'bg-card-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Step 1: Fahrzeug ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Grunddaten</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Marke *</label>
                  <Sel name="make" value={form.make} opts={CAR_MAKES} placeholder="Marke wählen…" />
                </div>
                <div>
                  <label className={lbl}>Modell *</label>
                  <input name="model" value={form.model} onChange={onChange} placeholder="z.B. 911 Carrera S" className={inp} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Variante / Ausstattungslinie</label>
                  <input name="variant" value={form.variant} onChange={onChange} placeholder="z.B. GTS, AMG Line, M Sport…" className={inp} />
                </div>
              </div>
            </div>

            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Aufbauart</h2>
              <div className="grid grid-cols-4 gap-2">
                {BODY_TYPES.map(bt => (
                  <button key={bt.value} type="button"
                    onClick={() => upd('bodyType', form.bodyType === bt.value ? '' : bt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      form.bodyType === bt.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-card-border text-muted hover:border-muted hover:text-foreground'
                    }`}>
                    <span className="text-xl">{bt.icon}</span>
                    <span className="text-center leading-tight">{bt.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Zulassung & Laufleistung</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Baujahr *</label>
                  <input name="year" type="number" value={form.year} onChange={onChange} placeholder="2020" min="1960" max="2026" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Kilometerstand (km) *</label>
                  <input name="mileage" type="number" value={form.mileage} onChange={onChange} placeholder="25 000" min="0" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Erstzulassung Monat</label>
                  <Sel name="firstRegMonth" value={form.firstRegMonth}
                    opts={['01','02','03','04','05','06','07','08','09','10','11','12']}
                    placeholder="Monat" />
                </div>
                <div>
                  <label className={lbl}>Erstzulassung Jahr</label>
                  <input name="firstRegYear" type="number" value={form.firstRegYear} onChange={onChange} placeholder="2020" min="1960" max="2026" className={inp} />
                </div>
              </div>
            </div>

            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Standort & FIN</h2>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Standort *</label>
                  <input name="location" value={form.location} onChange={onChange} placeholder="z.B. München, Bayern" className={inp} />
                </div>
                <div>
                  <label className={lbl}>FIN / VIN</label>
                  <input name="vin" value={form.vin} onChange={onChange} placeholder="WP0ZZZ99ZTS392124" className={`${inp} font-mono tracking-wider`} />
                </div>
              </div>
            </div>

            <button type="button" onClick={() => ok1() && setStep(2)} disabled={!ok1()}
              className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Weiter — Technik →
            </button>
          </div>
        )}

        {/* ── Step 2: Technik ────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Motor & Antrieb</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Kraftstoff *</label>
                  <Sel name="fuelType" value={form.fuelType}
                    opts={['Benzin','Diesel','Elektro','Hybrid (Benzin)','Hybrid (Diesel)','Plug-in Hybrid','LPG / Autogas','Erdgas (CNG)','Wasserstoff']} />
                </div>
                <div>
                  <label className={lbl}>Getriebe *</label>
                  <Sel name="transmission" value={form.transmission}
                    opts={['Automatik','Manuell (Schaltgetriebe)','PDK / DSG','CVT','Sequenziell']} />
                </div>
                <div>
                  <label className={lbl}>Leistung (PS)</label>
                  <input name="power" value={form.power} onChange={onChange} placeholder="450" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Hubraum (ccm)</label>
                  <Sel name="engineSize" value={form.engineSize}
                    opts={['<1000','1000','1200','1400','1500','1600','1800','2000','2500','3000','3500','4000','4500','5000','5500','6000','>6000']}
                    placeholder="wählen…" />
                </div>
                <div>
                  <label className={lbl}>Zylinder</label>
                  <Sel name="cylinders" value={form.cylinders}
                    opts={['3','4','5','6','8','10','12','16','Wankel']}
                    placeholder="wählen…" />
                </div>
                <div>
                  <label className={lbl}>Antrieb</label>
                  <Sel name="drive" value={form.drive}
                    opts={['Vorderradantrieb','Hinterradantrieb','Allrad (permanent)','Allrad (zuschaltbar)']}
                    placeholder="wählen…" />
                </div>
              </div>
            </div>

            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Karosserie</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Türen</label>
                  <Sel name="doors" value={form.doors} opts={['2','3','4','5','6']} placeholder="wählen…" />
                </div>
                <div>
                  <label className={lbl}>Sitze</label>
                  <Sel name="seats" value={form.seats} opts={['2','4','5','6','7','8','9']} placeholder="wählen…" />
                </div>
              </div>
            </div>

            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Farbe & Innenraum</h2>
              <label className={lbl}>Außenfarbe</label>
              <div className="grid grid-cols-8 gap-2 mb-3">
                {COLORS.map(c => (
                  <button key={c.name} type="button" onClick={() => upd('color', c.name)} title={c.name}
                    className={`aspect-square rounded-lg border-2 transition-all ${
                      form.color === c.name ? 'border-accent scale-110 shadow-lg shadow-accent/30' : 'border-transparent hover:border-muted'
                    }`}
                    style={{ backgroundColor: c.hex }} />
                ))}
              </div>
              {form.color && (
                <p className="text-xs text-muted mb-4">
                  Gewählt: <span className="text-foreground font-medium">{form.color}</span>
                </p>
              )}
              <div className="flex gap-2 mb-4">
                {['Uni', 'Metallic', 'Perleffekt', 'Matt'].map(ct => (
                  <button key={ct} type="button" onClick={() => upd('colorType', ct)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      form.colorType === ct ? 'border-accent bg-accent/10 text-accent' : 'border-card-border text-muted hover:border-muted'
                    }`}>
                    {ct}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Innenfarbe</label>
                  <Sel name="interiorColor" value={form.interiorColor}
                    opts={['Schwarz','Beige / Creme','Braun','Grau','Anthrazit','Rot','Blau','Sonstige']}
                    placeholder="wählen…" />
                </div>
                <div>
                  <label className={lbl}>Innenmaterial</label>
                  <Sel name="interiorMaterial" value={form.interiorMaterial}
                    opts={['Stoff','Kunstleder','Teilleder','Leder','Alcantara','Velours']}
                    placeholder="wählen…" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 border border-card-border text-muted hover:text-foreground py-3.5 rounded-xl text-sm transition-colors">
                ← Zurück
              </button>
              <button type="button" onClick={() => ok2() && setStep(3)} disabled={!ok2()}
                className="flex-[2] bg-accent hover:bg-accent-hover text-white font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Weiter — Zustand →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Zustand & Ausstattung ─────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Fahrzeugzustand</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {['Neuwertig','Sehr gut','Gut','Befriedigend','Reparaturbedürftig'].map(c => (
                  <button key={c} type="button" onClick={() => upd('condition', form.condition === c ? '' : c)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                      form.condition === c
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-card-border text-muted hover:border-muted hover:text-foreground'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={lbl}>Anzahl Vorbesitzer</label>
                  <Sel name="previousOwners" value={form.previousOwners}
                    opts={['1','2','3','4','5','> 5']} placeholder="wählen…" />
                </div>
                <div>
                  <label className={lbl}>HU / TÜV</label>
                  <div className="flex gap-2">
                    <Sel name="huMonth" value={form.huMonth}
                      opts={['01','02','03','04','05','06','07','08','09','10','11','12']}
                      placeholder="MM" />
                    <input name="huYear" type="number" value={form.huYear} onChange={onChange}
                      placeholder="JJJJ" min="2024" max="2030" className={`${inp} w-24`} />
                  </div>
                </div>
              </div>
              <div className="border-t border-card-border pt-2">
                <YesNo label="Scheckheft gepflegt" name="serviceHistory" />
                <YesNo label="Nichtraucher-Fahrzeug" name="nonSmoker" />
              </div>
            </div>

            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Umwelt & Verbrauch</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Verbrauch (l/100km)</label>
                  <input name="consumption" value={form.consumption} onChange={onChange} placeholder="7.5" className={inp} />
                </div>
                <div>
                  <label className={lbl}>CO₂ (g/km)</label>
                  <input name="co2" value={form.co2} onChange={onChange} placeholder="172" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Emissionsklasse</label>
                  <Sel name="emissionClass" value={form.emissionClass}
                    opts={['Euro 1','Euro 2','Euro 3','Euro 4','Euro 5','Euro 6','Euro 6b','Euro 6c','Euro 6d','Euro 6d-TEMP']} />
                </div>
              </div>
            </div>

            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Ausstattung wählen</h2>
              <div className="space-y-5">
                {Object.entries(FEATURES_BY_CAT).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="text-[10px] font-bold text-muted/70 mb-2 uppercase tracking-widest">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map(f => (
                        <button key={f} type="button" onClick={() => toggleFeature(f)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                            features.includes(f)
                              ? 'border-accent bg-accent/15 text-accent'
                              : 'border-card-border text-muted hover:border-muted hover:text-foreground'
                          }`}>
                          {features.includes(f) && '✓ '}{f}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {features.length > 0 && (
                <p className="text-xs text-accent mt-4">{features.length} Merkmal{features.length !== 1 ? 'e' : ''} gewählt</p>
              )}
            </div>

            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Fotos</h2>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-card-border hover:border-accent/50 rounded-xl p-8 text-center transition-all group">
                <FiCamera className="w-8 h-8 text-muted group-hover:text-accent mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-muted group-hover:text-foreground transition-colors">Fotos hinzufügen</p>
                <p className="text-xs text-muted/50 mt-1">bis zu 20 · JPG, PNG, WEBP</p>
              </button>
              <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addImages} className="hidden" />

              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-input-bg group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-danger text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiX className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <div className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-white px-1.5 py-0.5 rounded-full">
                          Titelbild
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-card-border hover:border-accent/40 flex items-center justify-center transition-colors">
                    <FiUpload className="w-4 h-4 text-muted" />
                  </button>
                </div>
              )}
            </div>

            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Beschreibung & Mängel</h2>
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Fahrzeugbeschreibung *</label>
                  <textarea name="description" value={form.description} onChange={onChange} required rows={5}
                    placeholder="Beschreibe das Fahrzeug ausführlich: Zustand, Scheckheft, Besonderheiten, Grund des Verkaufs…"
                    className={`${inp} resize-none`} />
                  <p className={`text-xs mt-1 ${form.description.length < 10 ? 'text-muted/50' : 'text-success'}`}>
                    {form.description.length} Zeichen{form.description.length < 10 ? ' · min. 10' : ' ✓'}
                  </p>
                </div>
                <div>
                  <label className={lbl}>Bekannte Mängel / Schäden</label>
                  <textarea name="damages" value={form.damages} onChange={onChange} rows={2}
                    placeholder="Keine bekannten Mängel, oder: kleiner Kratzer an der Stoßstange hinten links…"
                    className={`${inp} resize-none`} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 border border-card-border text-muted hover:text-foreground py-3.5 rounded-xl text-sm transition-colors">
                ← Zurück
              </button>
              <button type="button" onClick={() => ok3() && setStep(4)} disabled={!ok3()}
                className="flex-[2] bg-accent hover:bg-accent-hover text-white font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Weiter — Auktion →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Auktionseinstellungen ──────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Auktionseinstellungen</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className={lbl}>Startpreis *</label>
                  <div className="relative">
                    <input name="startPrice" type="number" value={form.startPrice} onChange={onChange}
                      required placeholder="25 000" min="1" className={`${inp} pr-8`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={lbl}>Laufzeit</label>
                  <Sel name="duration" value={form.duration}
                    opts={['6','12','24','48','72']} />
                  <p className="text-xs text-muted mt-1">{form.duration} Stunden ab Veröffentlichung</p>
                </div>
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex gap-3">
              <FiInfo className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-foreground mb-0.5">Käufergebühr: 250 €</p>
                <p className="text-muted">Der Gewinner zahlt Auktionspreis + 250 € via Stripe. Für dich entstehen keine Kosten.</p>
              </div>
            </div>

            {/* Zusammenfassung */}
            <div className={card}>
              <h2 className="text-xs font-bold text-accent mb-4 uppercase tracking-widest">Zusammenfassung</h2>
              {previews[0] && (
                <div className="aspect-[16/7] rounded-lg overflow-hidden mb-4">
                  <img src={previews[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                {([
                  ['Fahrzeug',   [form.year, form.make, form.model, form.variant].filter(Boolean).join(' ')],
                  ['Kilometer',  form.mileage ? `${Number(form.mileage).toLocaleString('de-DE')} km` : '—'],
                  ['Kraftstoff', form.fuelType],
                  ['Getriebe',   form.transmission],
                  form.bodyType ? ['Aufbauart', form.bodyType] : [],
                  form.color    ? ['Farbe', `${form.color}${form.colorType ? ', ' + form.colorType : ''}`] : [],
                  form.condition ? ['Zustand', form.condition] : [],
                  ['Standort',   form.location],
                  ['Fotos',      `${imageFiles.length}`],
                  ['Ausstattung',`${features.length} Merkmale`],
                  ['Startpreis', form.startPrice ? `${Number(form.startPrice).toLocaleString('de-DE')} €` : '—'],
                  ['Laufzeit',   `${form.duration} Stunden`],
                ] as string[][]).filter(a => a.length > 0).map(([k, v], i) => (
                  <div key={i} className="contents">
                    <span className="text-xs text-muted">{k}</span>
                    <span className={`text-xs font-medium ${k === 'Startpreis' ? 'text-accent font-bold' : 'text-foreground'}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-2 bg-danger/10 border border-danger/30 text-danger text-xs px-4 py-3 rounded-xl">
                <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)}
                className="flex-1 border border-card-border text-muted hover:text-foreground py-3.5 rounded-xl text-sm transition-colors">
                ← Zurück
              </button>
              <button type="submit" disabled={submitting || !form.startPrice}
                className="flex-[2] bg-accent hover:bg-accent-hover text-white font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {submitting && <FiLoader className="w-4 h-4 animate-spin" />}
                {submitting ? 'Wird hochgeladen…' :
                  (user.role === 'admin' || user.verified === true) ? 'Jetzt veröffentlichen' : 'Zur Prüfung einreichen'}
              </button>
            </div>

            {!(user.role === 'admin' || user.verified === true) && (
              <p className="text-xs text-muted text-center">
                Auktionen werden nach Admin-Prüfung (i.d.R. 24h) freigeschaltet.
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
