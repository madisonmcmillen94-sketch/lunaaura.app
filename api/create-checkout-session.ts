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
