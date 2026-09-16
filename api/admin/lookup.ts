import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminAuth, getAdminDb } from '../_lib/firebaseAdmin.js'
import { requireAdmin, AdminAuthError } from '../_lib/adminAuth.js'

// GET /api/admin/lookup?email=someone@example.com
// Looks a visitor up by email and returns their profile, saved chart summary,
// and journal entry count -- everything a support reply needs in one call.

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

  const email = typeof req.query.email === 'string' ? req.query.email.trim() : ''
  if (!email) {
    res.status(400).json({ error: 'email query param is required' })
    return
  }

  try {
    const authRecord = await getAdminAuth().getUserByEmail(email)
    const uid = authRecord.uid
    const db = getAdminDb()

    const [profileSnap, chartSnap, journalCountSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('natalCharts').doc(uid).get(),
      db.collection('journals').where('userId', '==', uid).count().get(),
    ])

    const profile = profileSnap.exists ? profileSnap.data() : null
    const chartData = chartSnap.exists ? chartSnap.data() : null
    const chart = chartData?.chart ?? null

    res.status(200).json({
      uid,
      email: authRecord.email,
      createdAt: authRecord.metadata.creationTime,
      lastSignedInAt: authRecord.metadata.lastSignInTime,
      disabled: authRecord.disabled,
      profile: profile
        ? {
            tier: profile.tier ?? 'free',
            stripeCustomerId: profile.stripeCustomerId ?? null,
            onboardedAt: profile.onboardedAt ?? null,
          }
        : { tier: 'free', stripeCustomerId: null, onboardedAt: null, note: 'No /users profile document exists yet.' },
      chart: chart
        ? {
            sun: chart.points?.[0]?.sign ?? null,
            moon: chart.points?.[1]?.sign ?? null,
            rising: chart.ascendant?.sign ?? null,
            birthPlace: chart.input?.placeLabel ?? null,
            birthDate: chart.input?.date ?? null,
            birthTime: chart.input?.time ?? null,
          }
        : null,
      journalEntryCount: journalCountSnap.data().count,
    })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === 'auth/user-not-found') {
      res.status(404).json({ error: 'No account found for that email' })
      return
    }
    console.error('admin/lookup error', err)
    res.status(500).json({ error: 'Lookup failed' })
  }
}
