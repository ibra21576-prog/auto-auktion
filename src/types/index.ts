export type UserRole = 'buyer' | 'dealer' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  companyName?: string;       // For dealers
  phone?: string;
  address?: string;
  stripeCustomerId?: string;  // Stripe customer ID
  paymentMethodId?: string;   // Default payment method
  paymentVerified: boolean;   // Has valid payment method on file
  verified: boolean;          // Admin-approved
  createdAt: Date;
}

export interface Car {
  id: string;
  title: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  firstRegistration?: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType?: string;
  power: string;
  engineSize?: string;
  cylinders?: string;
  drive?: string;
  doors?: string;
  seats?: string;
  color: string;
  colorType?: string;
  interiorColor?: string;
  interiorMaterial?: string;
  description: string;
  images: string[];
  location: string;
  vin?: string;
  condition?: string;
  previousOwners?: string;
  huMonth?: string;
  huYear?: string;
  serviceHistory?: boolean;
  nonSmoker?: boolean;
  consumption?: string;
  co2?: string;
  emissionClass?: string;
  damages?: string;
  features: string[];
}

export interface Auction {
  id: string;
  car: Car;
  sellerId: string;
  sellerName: string;
  sellerCompany?: string;
  startPrice: number;
  currentBid: number;
  minimumIncrement: number;
  bidCount: number;
  highestBidderId: string;
  highestBidderName: string;
  startTime: Date;
  endTime: Date;
  status: 'draft' | 'pending' | 'upcoming' | 'active' | 'ended' | 'sold' | 'cancelled';
  buyerFee: number;          // Fixed fee (250€)
  reservePrice?: number;     // Optional minimum sell price
  approved: boolean;         // Admin-approved
  winnerId?: string;
  winnerPaid: boolean;
  paymentIntentId?: string;  // Stripe payment intent for winner
  createdAt: Date;
}

export interface Bid {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: Date;
  isAutoBid: boolean;
}

export interface ChatMessage {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  message: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];          // Exactly two uids, sorted
  participantNames: Record<string, string>;
  auctionId?: string;
  auctionTitle?: string;
  lastMessage: string;
  lastMessageAt: Date;
  lastSenderId: string;
  unreadFor: string[];               // uids that have unread messages
  createdAt: Date;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
}

export interface PaymentRecord {
  id: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  bidAmount: number;
  buyerFee: number;
  totalAmount: number;
  stripePaymentIntentId: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  createdAt: Date;
  paidAt?: Date;
}
