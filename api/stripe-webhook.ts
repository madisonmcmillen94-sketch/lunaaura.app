import type { VercelRequest, VercelResponse } from '@vercel/node'
import type Stripe from 'stripe'
import { getAdminDb } from './lib/firebaseAdmin'
import { getStripe, tierForPriceId } from './lib/stripe'

// Vercel's Node runtime needs the RAW request body (not the auto-parsed JSON)
// to verify a Stripe webhook signature, so body parsing is disabled below
// and read manually.
export const config = {
  api: {
    bodyParser: false,
  },
}

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/** Finds the Firestore uid for a Stripe object, preferring metadata, falling back to a customer-id lookup. */
async function resolveUid(metadataUid: string | undefined, customerId: string | null): Promise<string | null> {
  if (metadataUid) return metadataUid
  if (!customerId) return null
  const db = getAdminDb()
  const snap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get()
  if (snap.empty) return null
  return snap.docs[0].id
}

async function setTier(uid: string, tier: 'free' | 'plus' | 'all_access', subscriptionId: string | null) {
  const db = getAdminDb()
  await db.collection('users').doc(uid).set(
    {
      tier,
      stripeSubscriptionId: subscriptionId,
    },
    { merge: true }
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = req.headers['stripe-signature']
  if (!webhookSecret || typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing webhook signature/secret' })
    return
  }

  let event: Stripe.Event
  try {
    const rawBody = await readRawBody(req)
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err)
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break
        const uid = await resolveUid(session.metadata?.firebaseUid, (session.customer as string) ?? null)
        const tier = (session.metadata?.tier as 'plus' | 'all_access' | undefined) ?? null
        if (uid && tier) {
          await setTier(uid, tier, (session.subscription as string) ?? null)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const uid = await resolveUid(subscription.metadata?.firebaseUid, (subscription.customer as string) ?? null)
        if (!uid) break

        const priceId = subscription.items.data[0]?.price.id
        const tierFromPrice = priceId ? tierForPriceId(priceId) : null
        const isLive = subscription.status === 'active' || subscription.status === 'trialing'

        if (isLive && tierFromPrice) {
          await setTier(uid, tierFromPrice, subscription.id)
        } else if (!isLive) {
          await setTier(uid, 'free', null)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const uid = await resolveUid(subscription.metadata?.firebaseUid, (subscription.customer as string) ?? null)
        if (uid) await setTier(uid, 'free', null)
        break
      }

      default:
        break
    }

    res.status(200).json({ received: true })
  } catch (err) {
    console.error('Stripe webhook handling failed', err)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
}
