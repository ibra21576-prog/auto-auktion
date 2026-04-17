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
import { Auction, Bid, ChatMessage, PaymentRecord } from '@/types';

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
  return { id: snap.id, ...snap.data() } as Auction;
}

export async function getActiveAuctions() {
  const q = query(
    collection(db, 'auctions'),
    where('status', 'in', ['active', 'upcoming']),
    where('approved', '==', true),
    orderBy('endTime', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Auction);
}

export async function getAuctionsBySeller(sellerId: string) {
  const q = query(
    collection(db, 'auctions'),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Auction);
}

export async function getAllAuctions() {
  const q = query(collection(db, 'auctions'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Auction);
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
      callback({ id: snap.id, ...snap.data() } as Auction);
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
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Auction));
  });
}

// ─── Bids ────────────────────────────────────────────────

export async function placeBid(auctionId: string, bid: Omit<Bid, 'id'>) {
  // Add bid to subcollection
  const bidRef = await addDoc(collection(db, 'auctions', auctionId, 'bids'), {
    ...bid,
    timestamp: serverTimestamp(),
  });

  // Update auction with new highest bid
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

// ─── Payments ────────────────────────────────────────────

export async function createPaymentRecord(record: Omit<PaymentRecord, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'payments'), {
    ...record,
    createdAt: serverTimestamp(),
  });
  return ref.id;
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
