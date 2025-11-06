import { NextApiRequest, NextApiResponse } from 'next';

// Mock environment before importing handlers
process.env.STRIPE_SECRET = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: 'cs_test', id: 'pi_test' }),
    },
    webhooks: {
      constructEvent: jest.fn((buf: Buffer) => {
        // return a fake payment_intent.succeeded event
        return {
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_test', metadata: { studentId: 'student123' }, amount_received: 5000 } },
        };
      }),
    },
  }));
});

// Mock validateParentAccessToken to accept any token
jest.mock('@/services/parentService', () => ({
  validateParentAccessToken: jest.fn(async (token: string) => {
    if (token === 'valid-token') return 'student123';
    return null;
  }),
}));

// Mock financeService.recordPayment so webhook test doesn't touch Firestore
const recordPaymentMock = jest.fn().mockResolvedValue({ id: 'pay_1' });
jest.mock('@/services/financeService', () => ({
  recordPayment: (...args: any[]) => recordPaymentMock(...args),
}));

// Mock Firestore helpers used in webhook idempotency check
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ size: 0 }),
}));

// Mock firebase client db export
jest.mock('@/lib/firebase-client', () => ({ db: {} }));

// Import handlers after mocks
import createIntentHandler from '@/pages/api/payments/create-payment-intent';
import webhookHandler, { config } from '@/pages/api/payments/webhook';

function mockResponse() {
  const res: Partial<NextApiResponse> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as NextApiResponse;
}

describe('Payments API', () => {
  test('create-payment-intent returns client secret for valid token', async () => {
    const req = {
      method: 'POST',
      body: { amount: 50, studentId: 'student123', token: 'valid-token' },
    } as unknown as NextApiRequest;

    const res = mockResponse();

    await createIntentHandler(req, res);

    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(200);
    expect((res.json as jest.Mock).mock.calls[0][0]).toHaveProperty('clientSecret');
  });

  test('webhook records payment on payment_intent.succeeded', async () => {
    // The webhook handler expects raw body; we pass a minimal object and stripe.mock will construct event
    const req = {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      // stream-like body is read by buffer helper; we provide an async iterable
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('payload');
      },
    } as unknown as NextApiRequest;

    const res = mockResponse();

    await webhookHandler(req, res);

    // recordPayment should have been called once
    expect(recordPaymentMock).toHaveBeenCalled();
    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({ received: true });
  });

  test('webhook skips recording if payment already exists (idempotency)', async () => {
    // Adjust mocked getDocs to simulate an existing payment record
    const firestore = await import('firebase/firestore');
    // @ts-ignore
    firestore.getDocs.mockResolvedValueOnce({ size: 1 });

    // Prepare a stripe event for a payment_intent.succeeded
    const req = {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('payload');
      },
    } as unknown as NextApiRequest;

    const res = mockResponse();

  // Clear previous calls and call webhook handler
  recordPaymentMock.mockClear();
  // Call webhook handler
  await webhookHandler(req, res);

    // recordPayment should NOT have been called because getDocs returned a non-zero size
    expect(recordPaymentMock).not.toHaveBeenCalled();
    // handler responds with JSON { received: true }
    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({ received: true });
  });

  test('create-payment-intent rejects invalid/unauthorized token', async () => {
    const req = {
      method: 'POST',
      body: { amount: 50, studentId: 'student123', token: 'invalid-token' },
    } as unknown as NextApiRequest;

    const res = mockResponse();

    await createIntentHandler(req, res);

    // unauthorized token should result in 403
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(403);
    expect((res.json as jest.Mock).mock.calls[0][0]).toHaveProperty('error');
  });

  test('webhook returns 400 on invalid signature', async () => {
    // Make the stripe.constructEvent throw
  const StripeMock = require('stripe') as jest.Mock;
  // Get the most-recently-instantiated mock stripe instance and make its constructEvent throw once
  const stripeInstance = StripeMock.mock.results[StripeMock.mock.results.length - 1].value;
  stripeInstance.webhooks.constructEvent.mockImplementationOnce(() => { throw new Error('Invalid signature'); });

    const req = {
      method: 'POST',
      headers: { 'stripe-signature': 'bad' },
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('payload');
      },
    } as unknown as NextApiRequest;

    const res = mockResponse();

    await webhookHandler(req, res);

    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(400);
    expect((res.send as jest.Mock).mock.calls[0][0]).toEqual(expect.stringContaining('Webhook Error'));
  });

  test('webhook with missing metadata does not record payment', async () => {
    // Make stripe.constructEvent return an event with missing metadata
  const StripeMock = require('stripe') as jest.Mock;
  const stripeInstance = StripeMock.mock.results[StripeMock.mock.results.length - 1].value;
  stripeInstance.webhooks.constructEvent.mockImplementationOnce(() => ({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_y', amount_received: 3000 } } }));

    const req = {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('payload');
      },
    } as unknown as NextApiRequest;

    const res = mockResponse();

    recordPaymentMock.mockClear();
    await webhookHandler(req, res);

    expect(recordPaymentMock).not.toHaveBeenCalled();
    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({ received: true });
  });
});
