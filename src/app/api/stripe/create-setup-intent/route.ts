import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY ist nicht konfiguriert.');
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, userId } = await req.json();
    const stripe = getStripe();

    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer: Stripe.Customer;

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        name,
        metadata: { firebaseUid: userId },
      });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card', 'sepa_debit'],
      metadata: { firebaseUid: userId },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
    });
  } catch (error) {
    console.error('Stripe SetupIntent error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Zahlungseinrichtung' },
      { status: 500 }
    );
  }
}
