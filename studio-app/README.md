# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Deployment

To deploy this application to Firebase, you will need to use the Firebase Command-Line Interface (CLI).

The CLI is a tool that allows you to manage and deploy your Firebase projects by typing commands into a terminal.

Once you have the Firebase CLI installed and you are logged in, you can deploy your application by running the following command in your project's root directory:

```bash
firebase deploy
```

## Payments (Stripe) — local & deployment notes

This project includes server endpoints to create Stripe PaymentIntents and a webhook receiver under `src/pages/api/payments/*`.

Required environment variables (set in `.env.local` for local dev, and in your hosting environment for production):

- `STRIPE_SECRET` — your Stripe secret key (starts with `sk_...`).
- `STRIPE_WEBHOOK_SECRET` — webhook signing secret (used to verify incoming webhooks).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — the Stripe publishable key (starts with `pk_...`) used by the client.
- `STRIPE_CURRENCY` — optional (defaults to `usd`).

Testing webhooks locally:

1. Install the Stripe CLI and log in: `stripe login`.
2. Forward webhooks to your local server (run this from the repo root):

```bash
# forward to local api route (adjust port if you use a different dev port)
stripe listen --forward-to localhost:3000/api/payments/webhook
```

3. Use the Stripe CLI to trigger test events, for example:

```bash
stripe trigger payment_intent.succeeded
```

Notes:
- The client-side payments page uses Stripe Elements to collect card details and confirm the PaymentIntent. The server creates the PaymentIntent and the webhook records the payment into Firestore via `financeService.recordPayment` when the payment succeeds.
- Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret shown by the Stripe CLI when you run `stripe listen` (or the webhook settings in the Stripe Dashboard for production).
- Make webhook handling idempotent: the webhook handler should tolerate repeated events for the same PaymentIntent. If you want, I can add a uniqueness guard in the webhook (recommended).

CI trigger: test run

## Local development — Firebase

This project requires a Firebase public config for local development so the client can initialize Firestore.

1. Create a file named `.env.local` in the directory where you run `npm run dev` (either the repo root or `studio-project/`).
2. Copy values from `.env.local.example` and fill in your Firebase project's public values (these are *not* secrets):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

3. Restart the dev server:

```bash
cd studio-project
npm run dev
```

4. Quick diagnostic: run the included check script to confirm `.env.local` is detected:

```bash
npm run check-firebase
# or from repo root
node tools/check-firebase.js
```

If the banner `Firebase not configured` still appears after this, open the browser console and server logs and look for errors such as `auth/invalid-api-key`, `permission-denied`, or `project not found`.
 
