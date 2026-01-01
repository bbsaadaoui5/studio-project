import type { NextApiRequest, NextApiResponse } from 'next';
// Dynamically import Stripe at runtime to avoid build-time type errors when stripe is optional
import { recordPayment } from '@/services/financeService';
import { db } from '@/lib/firebase-client';
import { collection, query as fsQuery, where as fsWhere, getDocs } from 'firebase/firestore';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeSecret = process.env.STRIPE_SECRET;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
let stripe: any = null;

async function buffer(readable: any) {
  const chunks: any[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  // Dynamically import Stripe at runtime if not already loaded.
  if (!stripe && stripeSecret) {
    try {
  // @ts-ignore - stripe is optional; dynamically import at runtime
  const StripeMod = await import('stripe');
  const Stripe = (StripeMod && (StripeMod as any).default) || StripeMod;
      stripe = new Stripe(stripeSecret, {});
    } catch (err) {
      console.warn('Stripe import failed:', (err as any)?.message || err);
      stripe = null;
    }
  }

  if (!stripe || !webhookSecret) {
    console.error('Stripe or webhook secret not configured');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const buf = await buffer(req as any);
    const sig = req.headers['stripe-signature'] as string | undefined;
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(buf, sig || '', webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err?.message || err);
      return res.status(400).send(`Webhook Error: ${err?.message || 'Invalid signature'}`);
    }

    if (event.type === 'payment_intent.succeeded') {
  const pi = event.data.object as any;
      const studentId = pi.metadata?.studentId as string | undefined;
      const amount = (pi.amount_received ?? pi.amount) / 100;
      const date = new Date().toISOString();

      if (studentId) {
        try {
          // Idempotency: skip if we already recorded a payment for this PaymentIntent id
          const paymentsCol = collection(db as any, 'payments');
          const qSnap = await getDocs(fsQuery(paymentsCol, fsWhere('stripePaymentId', '==', pi.id)));
          const already = qSnap && qSnap.size > 0;
          if (already) {
            console.log(`Payment for PaymentIntent ${pi.id} already recorded; skipping.`);
          } else {
            await recordPayment({
              studentId,
              amount: Number(amount),
              date,
              month: new Date().toLocaleString('default', { month: 'long' }),
              academicYear: new Date().getFullYear().toString(),
              method: 'card',
              stripePaymentId: pi.id,
            });
            console.log(`Recorded payment for student ${studentId} amount ${amount} (intent ${pi.id})`);
          }
        } catch (recErr) {
          console.error('Failed to record payment:', recErr);
        }
      } else {
        console.warn('PaymentIntent succeeded but missing studentId metadata');
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error handling webhook event:', err);
    res.status(500).json({ error: 'Webhook handling error' });
  }
}
