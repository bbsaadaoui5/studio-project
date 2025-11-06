import type { NextApiRequest, NextApiResponse } from 'next';
import { validateParentAccessToken } from '@/services/parentService';

const stripeSecret = process.env.STRIPE_SECRET;
let stripe: any = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  // Dynamically import Stripe at runtime if not already loaded.
  if (!stripe && stripeSecret) {
    try {
  // @ts-ignore - stripe is an optional dependency, import dynamically at runtime
  const StripeMod = await import('stripe');
      const Stripe = (StripeMod && (StripeMod as any).default) || StripeMod;
      stripe = new Stripe(stripeSecret, {});
    } catch (err) {
      console.warn('Stripe import failed:', (err as any)?.message || err);
      stripe = null;
    }
  }

  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  try {
    const { amount, studentId, token, currency = process.env.STRIPE_CURRENCY || 'usd' } = req.body;
    if (!amount || !studentId || !token) return res.status(400).json({ error: 'Missing parameters' });

    const validated = await validateParentAccessToken(token);
    if (!validated || validated !== studentId) return res.status(403).json({ error: 'Unauthorized' });

    const amountInCents = Math.round(Number(amount) * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata: { studentId },
      description: `School fee payment for student ${studentId}`,
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (err: any) {
    console.error('create-payment-intent error:', err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
