import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb } from '../_lib/firebaseAdmin.js'
import { requireAdmin, AdminAuthError } from '../_lib/adminAuth.js'

// POST /api/admin/set-tier  { "uid": "...", "tier": "free" | "plus" | "all_access" }
// Manually sets a visitor's subscription tier -- the "comp an account" /
// "fix a Stripe webhook that never landed" button. Writes straight to their
// /users profile doc, creating it if the "untagged" gap (see stats.ts)
// applies. Does NOT touch Stripe -- this only changes what LunaAura thinks
// the visitor's tier is, so use it for comps, support fixes, or manual
// grants, not as a substitute for an actual subscription change.

const VALID_TIERS = ['free', 'plus', 'all_access'] as const
type Tier = (typeof VALID_TIERS)[number]

interface Body {
  uid?: string
  tier?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let adminUid: string
  try {
    adminUid = await requireAdmin(req)
  } catch (err) {
    if (err instanceof AdminAuthError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { uid, tier } = req.body as Body
  if (!uid) {
    res.status(400).json({ error: 'uid is required' })
    return
  }
  if (!tier || !VALID_TIERS.includes(tier as Tier)) {
    res.status(400).json({ error: `tier must be one of: ${VALID_TIERS.join(', ')}` })
    return
  }

  try {
    const db = getAdminDb()
    const ref = db.collection('users').doc(uid)
    await ref.set(
      {
        tier,
        tierSetByAdmin: adminUid,
        tierSetAt: new Date().toISOString(),
      },
      { merge: true }
    )

    res.status(200).json({ ok: true, uid, tier })
  } catch (err) {
    console.error('admin/set-tier error', err)
    res.status(500).json({ error: 'Tier update failed' })
  }
}
