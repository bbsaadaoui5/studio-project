module.exports = function Stripe() {
  return {
    paymentIntents: {
      create: async () => ({ client_secret: 'cs_test', id: 'pi_test' }),
    },
    webhooks: {
      constructEvent: (buf, sig, secret) => {
        return {
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_test', metadata: { studentId: 'student123' }, amount_received: 5000 } },
        };
      },
    },
  };
};
