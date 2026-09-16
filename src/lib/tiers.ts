// Subscription tiers for LunaAura.
//
// Free       -- daily moon/earth forecast, unlimited journaling.
// Plus       -- adds personal transit + somatic practice guidance (needs a saved chart).
// All Access -- adds the pattern-correlation dashboard (journal history x transits) and
//               any future premium content.
//
// Tier is stored server-side only (/users/{uid}.tier in Firestore), written exclusively
// by the Stripe webhook via the Admin SDK -- Firestore rules block clients from writing
// it themselves. The client only ever reads it.

export type Tier = 'free' | 'plus' | 'all_access'

export const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  plus: 1,
  all_access: 2,
}

export const TIER_LABEL: Record<Tier, string> = {
  free: 'Free',
  plus: 'Plus',
  all_access: 'All Access',
}

/** True if `userTier` meets or exceeds `required`. */
export function hasAccess(userTier: Tier | null | undefined, required: Tier): boolean {
  const level = userTier ? TIER_ORDER[userTier] : TIER_ORDER.free
  return level >= TIER_ORDER[required]
}

export type BillingCadence = 'monthly' | 'yearly'

export interface TierPricing {
  tier: Exclude<Tier, 'free'>
  monthly: number
  yearly: number
}

// Display-only figures -- the actual charge is always whatever the Stripe Price object
// says, these are just for rendering the pricing page without an extra network round trip.
export const PRICING: TierPricing[] = [
  { tier: 'plus', monthly: 2.99, yearly: 24 },
  { tier: 'all_access', monthly: 4.99, yearly: 39 },
]

export interface TierFeature {
  label: string
  tiers: Tier[] // which tiers include this feature
}

export const FEATURES: TierFeature[] = [
  { label: 'Daily moon phase + planetary weather + earth activity forecast', tiers: ['free', 'plus', 'all_access'] },
  { label: 'Unlimited nervous-system journal', tiers: ['free', 'plus', 'all_access'] },
  { label: 'Full natal chart', tiers: ['free', 'plus', 'all_access'] },
  { label: 'Personal daily transits + somatic practice guidance', tiers: ['plus', 'all_access'] },
  { label: 'Synastry — compare your chart with a friend or partner\'s', tiers: ['plus', 'all_access'] },
  { label: 'Your patterns dashboard (journal x transits, over time)', tiers: ['all_access'] },
  { label: 'Ask your chart — an AI companion grounded in your real placements', tiers: ['all_access'] },
]

