import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb } from '../lib/firebaseAdmin.js'
import { requireAdmin, AdminAuthError } from '../lib/adminAuth.js'

// GET /api/admin/stats
// Coarse, cheap counts for a founder-level snapshot -- not a full analytics
// pipeline, just "how many people, on what tier, doing what" at a glance.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    await requireAdmin(req)
  } catch (err) {
    if (err instanceof AdminAuthError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const db = getAdminDb()
    const users = db.collection('users')

    const [
      totalUsersSnap,
      freeSnap,
      plusSnap,
      allAccessSnap,
      chartsSnap,
      journalsSnap,
    ] = await Promise.all([
      users.count().get(),
      users.where('tier', '==', 'free').count().get(),
      users.where('tier', '==', 'plus').count().get(),
      users.where('tier', '==', 'all_access').count().get(),
      db.collection('natalCharts').count().get(),
      db.collection('journals').count().get(),
    ])

    const totalUsers = totalUsersSnap.data().count
    const free = freeSnap.data().count
    const plus = plusSnap.data().count
    const allAccess = allAccessSnap.data().count

    res.status(200).json({
      totalAccounts: totalUsers,
      // Accounts with no `tier` field at all (never set by the webhook,
      // e.g. because a doc was never created) won't match any of the three
      // queries above -- surface that gap rather than hiding it.
      tierBreakdown: {
        free,
        plus,
        all_access: allAccess,
        untagged: Math.max(0, totalUsers - free - plus - allAccess),
      },
      totalSavedCharts: chartsSnap.data().count,
      totalJournalEntries: journalsSnap.data().count,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('admin/stats error', err)
    res.status(500).json({ error: 'Stats query failed' })
  }
}
