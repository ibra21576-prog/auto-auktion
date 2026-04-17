import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const BUYER_FEE = parseInt(process.env.NEXT_PUBLIC_BUYER_FEE || '250');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY ist nicht konfiguriert.');
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
}

export async function POST(req: NextRequest) {
  try {
    const { auctionId, customerId, paymentMethodId, bidAmount, buyerName } = await req.json();
    const stripe = getStripe();

    const totalAmount = bidAmount + BUYER_FEE;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100,
      currency: 'eur',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `AutoBid Auktion #${auctionId} — Zuschlag: ${bidAmount}€ + Käufergebühr: ${BUYER_FEE}€`,
      metadata: {
        auctionId,
        bidAmount: bidAmount.toString(),
        buyerFee: BUYER_FEE.toString(),
        buyerName,
      },
    });

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      totalAmount,
    });
  } catch (error) {
    console.error('Stripe PaymentIntent error:', error);

    if (error instanceof Stripe.errors.StripeCardError) {
      return NextResponse.json(
        { error: 'Zahlungsmethode abgelehnt. Bitte aktualisieren Sie Ihre Zahlungsdaten.' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler bei der Zahlung' },
      { status: 500 }
    );
  }
}
