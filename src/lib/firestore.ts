import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Auction, Bid, ChatMessage, PaymentRecord, User } from '@/types';

// ─── Timestamp normalization ──────────────────────────────

function toDate(ts: unknown): Date {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  if (ts instanceof Timestamp) return ts.toDate();
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
    return new Date((ts as { seconds: number }).seconds * 1000);
  }
  return new Date(ts as string | number);
}

function normalizeAuction(data: Record<string, unknown>, id: string): Auction {
  return {
    ...data,
    id,
    startTime: toDate(data.startTime),
    endTime: toDate(data.endTime),
    createdAt: toDate(data.createdAt),
  } as Auction;
}

// ─── Auctions ────────────────────────────────────────────

export async function createAuction(data: Omit<Auction, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'auctions'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAuction(id: string) {
  const snap = await getDoc(doc(db, 'auctions', id));
  if (!snap.exists()) return null;
  return normalizeAuction(snap.data(), snap.id);
}

export async function getActiveAuctions() {
  const q = query(
    collection(db, 'auctions'),
    where('status', 'in', ['active', 'upcoming']),
    where('approved', '==', true),
    orderBy('endTime', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => normalizeAuction(d.data(), d.id));
}

export async function getAuctionsBySeller(sellerId: string) {
  const q = query(
    collection(db, 'auctions'),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => normalizeAuction(d.data(), d.id));
}

export async function getAllAuctions() {
  const q = query(collection(db, 'auctions'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => normalizeAuction(d.data(), d.id));
}

export async function updateAuction(id: string, data: Partial<Auction>) {
  await updateDoc(doc(db, 'auctions', id), data as Record<string, unknown>);
}

export async function approveAuction(id: string) {
  await updateDoc(doc(db, 'auctions', id), {
    approved: true,
    status: 'active',
  });
}

export async function rejectAuction(id: string) {
  await updateDoc(doc(db, 'auctions', id), { status: 'cancelled' });
}

export async function deleteAuction(id: string) {
  await deleteDoc(doc(db, 'auctions', id));
}

export async function forceEndAuction(id: string) {
  await updateDoc(doc(db, 'auctions', id), { status: 'ended' });
}

export async function endAuction(id: string, winnerId: string) {
  await updateDoc(doc(db, 'auctions', id), {
    status: 'ended',
    winnerId,
  });
}

// ─── Real-time listeners ─────────────────────────────────

export function onAuctionUpdate(id: string, callback: (auction: Auction) => void) {
  return onSnapshot(doc(db, 'auctions', id), (snap) => {
    if (snap.exists()) {
      callback(normalizeAuction(snap.data(), snap.id));
    }
  });
}

export function onActiveAuctions(callback: (auctions: Auction[]) => void) {
  const q = query(
    collection(db, 'auctions'),
    where('approved', '==', true),
    where('status', 'in', ['active', 'upcoming']),
    orderBy('endTime', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => normalizeAuction(d.data(), d.id)));
  });
}

export function onAuctionsBySeller(sellerId: string, callback: (auctions: Auction[]) => void) {
  const q = query(
    collection(db, 'auctions'),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => normalizeAuction(d.data(), d.id)));
  });
}

// ─── Bids ────────────────────────────────────────────────

export async function placeBid(auctionId: string, bid: Omit<Bid, 'id'>) {
  const bidRef = await addDoc(collection(db, 'auctions', auctionId, 'bids'), {
    ...bid,
    timestamp: serverTimestamp(),
  });

  await updateDoc(doc(db, 'auctions', auctionId), {
    currentBid: bid.amount,
    highestBidderId: bid.userId,
    highestBidderName: bid.userName,
    bidCount: increment(1),
  });

  return bidRef.id;
}

export function onBids(auctionId: string, callback: (bids: Bid[]) => void) {
  const q = query(
    collection(db, 'auctions', auctionId, 'bids'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Bid));
  });
}

// ─── Chat ────────────────────────────────────────────────

export async function sendChatMessage(auctionId: string, message: Omit<ChatMessage, 'id'>) {
  await addDoc(collection(db, 'auctions', auctionId, 'chat'), {
    ...message,
    timestamp: serverTimestamp(),
  });
}

export function onChatMessages(auctionId: string, callback: (messages: ChatMessage[]) => void) {
  const q = query(
    collection(db, 'auctions', auctionId, 'chat'),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ChatMessage));
  });
}

// ─── Users / Dealers ─────────────────────────────────────

export async function getPendingDealers(): Promise<User[]> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'dealer'),
    where('verified', '==', false)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }) as User);
}

export async function approveDealer(uid: string) {
  await updateDoc(doc(db, 'users', uid), { verified: true });
}

export async function rejectDealer(uid: string) {
  await updateDoc(doc(db, 'users', uid), { role: 'buyer', verified: false });
}

export async function getAllUsers(): Promise<User[]> {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }) as User);
}

export async function updateUserRole(uid: string, role: User['role'], verified?: boolean) {
  const data: Record<string, unknown> = { role };
  if (verified !== undefined) data.verified = verified;
  await updateDoc(doc(db, 'users', uid), data);
}

// ─── Payments ────────────────────────────────────────────

export async function createPaymentRecord(record: Omit<PaymentRecord, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'payments'), {
    ...record,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAllPayments(): Promise<PaymentRecord[]> {
  const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentRecord);
}

export async function getPaymentsByBuyer(buyerId: string) {
  const q = query(
    collection(db, 'payments'),
    where('buyerId', '==', buyerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentRecord);
}
