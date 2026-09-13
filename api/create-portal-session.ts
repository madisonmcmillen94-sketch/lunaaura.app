import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminAuth, getAdminDb } from './lib/firebaseAdmin'
import { getStripe } from './lib/stripe'

// Lets a subscriber manage or cancel their own subscription via Stripe's
// hosted billing portal -- required so "cancel anytime" is actually true,
// not just a line in the pricing copy.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { idToken } = (req.body as { idToken?: string }) ?? {}
  if (!idToken) {
    res.status(400).json({ error: 'Missing idToken' })
    return
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken)
    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(decoded.uid).get()
    const stripeCustomerId = userSnap.data()?.stripeCustomerId as string | undefined

    if (!stripeCustomerId) {
      res.status(400).json({ error: 'No subscription on file for this account yet.' })
      return
    }

    const origin = (req.headers.origin as string) || `https://${req.headers.host}`
    const session = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/pricing`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not open the billing portal — try again in a moment.' })
  }
}
