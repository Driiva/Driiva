/**
 * Stripe client-side singleton.
 *
 * VITE_STRIPE_PUBLISHABLE_KEY must be set in .env (pk_test_... for staging, pk_live_... for prod).
 * If the key is missing, stripePromise resolves to null and the checkout page shows a
 * "Stripe not configured" message rather than crashing.
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

export const stripePromise: Promise<Stripe | null> = key
  ? loadStripe(key)
  : Promise.resolve(null);
