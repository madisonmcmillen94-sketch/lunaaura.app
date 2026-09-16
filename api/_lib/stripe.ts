import Stripe from 'stripe'

// Lazy init, same reasoning as api/lib/firebaseAdmin.ts: don't construct the
// client at module load time, only when a request actually needs it.
let stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (stripe) return stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY env var.')
  }
  stripe = new Stripe(key)
  return stripe
}

export type PaidTier = 'plus' | 'all_access'
export type Cadence = 'monthly' | 'yearly'

/** Maps a (tier, cadence) pair to the Stripe Price ID env var that holds it. */
export function priceIdFor(tier: PaidTier, cadence: Cadence): string {
  const envKey =
    tier === 'plus'
      ? cadence === 'monthly'
        ? 'STRIPE_PRICE_PLUS_MONTHLY'
        : 'STRIPE_PRICE_PLUS_YEARLY'
      : cadence === 'monthly'
        ? 'STRIPE_PRICE_ALL_ACCESS_MONTHLY'
        : 'STRIPE_PRICE_ALL_ACCESS_YEARLY'
  const priceId = process.env[envKey]
  if (!priceId) {
    throw new Error(`Missing ${envKey} env var.`)
  }
  return priceId
}

/** Given a Stripe Price ID, figures out which of our tiers it corresponds to. */
export function tierForPriceId(priceId: string): PaidTier | null {
  if (
    priceId === process.env.STRIPE_PRICE_PLUS_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PLUS_YEARLY
  ) {
    return 'plus'
  }
  if (
    priceId === process.env.STRIPE_PRICE_ALL_ACCESS_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_ALL_ACCESS_YEARLY
  ) {
    return 'all_access'
  }
  return null
}
