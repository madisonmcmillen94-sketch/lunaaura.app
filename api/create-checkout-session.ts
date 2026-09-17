import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminAuth, getAdminDb } from './_lib/firebaseAdmin.js'
import { getStripe, priceIdFor, type PaidTier, type Cadence } from './_lib/stripe.js'

interface Body {
  idToken: string
  tier: PaidTier
  cadence: Cadence
}

function isPaidTier(v: unknown): v is PaidTier {
  return v === 'plus' || v === 'all_access'
}
function isCadence(v: unknown): v is Cadence {
  return v === 'monthly' || v === 'yearly'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = req.body as Partial<Body> | undefined
  if (!body?.idToken || !isPaidTier(body.tier) || !isCadence(body.cadence)) {
    res.status(400).json({ error: 'Missing or invalid idToken/tier/cadence' })
    return
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(body.idToken)
    const uid = decoded.uid
    const email = decoded.email ?? undefined

    if (decoded.firebase.sign_in_provider === 'anonymous') {
      res.status(400).json({ error: 'Create a real account before subscribing.' })
      return
    }

    const stripe = getStripe()
    const db = getAdminDb()
    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    let stripeCustomerId = userSnap.data()?.stripeCustomerId as string | undefined

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUid: uid },
      })
      stripeCustomerId = customer.id
      await userRef.set({ stripeCustomerId }, { merge: true })
    }

    const priceId = priceIdFor(body.tier, body.cadence)

    // Guard against ever creating a second live subscription on the same
    // customer -- e.g. someone on Plus clicking "Choose All Access" to
    // upgrade, or a double-click/retry on the choose button. Without this,
    // Stripe happily creates a brand-new subscription alongside the existing
    // one and bills both. If they already have an active/trialing
    // subscription, change its price in place instead of starting a new
    // Checkout Session.
    const existingSubs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 10,
    })
    const currentSub = existingSubs.data.find((s) => s.status === 'active' || s.status === 'trialing')

    if (currentSub) {
      const currentItem = currentSub.items.data[0]
      if (currentItem?.price.id === priceId) {
        res.status(200).json({ alreadySubscribed: true })
        return
      }

      const updated = await stripe.subscriptions.update(currentSub.id, {
        items: [{ id: currentItem.id, price: priceId }],
        proration_behavior: 'create_prorations',
        metadata: { firebaseUid: uid, tier: body.tier },
      })

      // The webhook (customer.subscription.updated) will also sync this, but
      // setting it here too means the UI reflects the change immediately
      // rather than waiting on webhook delivery.
      await userRef.set({ tier: body.tier, stripeSubscriptionId: updated.id }, { merge: true })

      res.status(200).json({ updated: true, tier: body.tier })
      return
    }

    const origin = (req.headers.origin as string) || `https://${req.headers.host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      metadata: { firebaseUid: uid, tier: body.tier },
      subscription_data: {
        metadata: { firebaseUid: uid, tier: body.tier },
      },
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not start checkout — try again in a moment.' })
  }
}
