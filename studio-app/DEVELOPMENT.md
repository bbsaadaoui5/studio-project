# Development & Deployment Notes

This file contains recommended steps and configuration for local dev, Stripe webhook testing, and branch protection recommendations.

## Stripe CLI & webhook local testing

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli

2. Log in to the CLI:

```bash
stripe login
```

3. Start forwarding webhooks to your local dev server (adjust the port if you run `next dev` on a different port):

```bash
npm run stripe:listen
# or run directly
# stripe listen --forward-to localhost:3000/api/payments/webhook
```

The Stripe CLI will print a `webhook signing secret` value — copy that and set it in your local environment as `STRIPE_WEBHOOK_SECRET`.

4. Trigger a test event:

```bash
stripe trigger payment_intent.succeeded
```

Notes:
- The webhook handler verifies the signature using `STRIPE_WEBHOOK_SECRET`. Ensure that matches the secret shown by the CLI.
- The server records the payment to Firestore in `payments` via `financeService.recordPayment`.
- The webhook handler is idempotent: it checks existing documents for the same `stripePaymentId` and will skip duplicates.

## Branch protection recommendations (GitHub)

You cannot configure branch protection from the repository itself, but here are recommended rules for the `main` branch:

- Require status checks to pass before merging. Require the `CI` workflow (or `build-and-test`) to pass.
- Require pull request reviews before merging (1 or 2 reviewers).
- Require signed commits or at least provenance depending on your org policy.
- Optionally enforce code owners for critical directories such as `src/services` or `src/pages/api`.

To configure, go to the repository Settings → Branches → Branch protection rules.

## Firestore rules guidance (high level)

Before deploying to production, review `firestore.rules` for these items:

- Prevent unauthenticated writes to sensitive collections (payments, student records).
- Prefer server-side writes for payment records (createPaymentIntent & webhook should record payments). If you must allow client writes, restrict them so only authenticated school admins can write payments.
- Use Firestore `request.auth` checks to ensure users can only read/write their own student data.

I can propose a minimal `firestore.rules` patch that restricts writes to `payments` to only allow them from admin users or from functions using a service account. Let me know if you want me to apply that change (I can add a conservative rule to the `firestore.rules` file and run a quick lint if present).

### Production Firestore rules

I added a conservative example rules file `firestore.rules.prod` in the repo. It denies open access and restricts `payments` writes and reads to users with an `admin` custom claim. This file is intentionally conservative — adapt `isOwner()` and per-collection logic to match your app before deploying.

To use this rules file when deploying, update `firebase.json` or specify it when deploying Firestore rules. Example `firebase.json` snippet:

```json
{
	"firestore": {
		"rules": "firestore.rules.prod"
	}
}
```

Always test rules locally with the Firebase Emulator (`firebase emulators:start`) before deploying to production.
