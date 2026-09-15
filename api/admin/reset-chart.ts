import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb } from '../lib/firebaseAdmin.js'
import { requireAdmin, AdminAuthError } from '../lib/adminAuth.js'
import { computeNatalChart, type BirthInput } from '../lib/natalCalc.js'

// POST /api/admin/reset-chart  { "uid": "..." }
// Recomputes a visitor's saved chart from their original birth input using
// the current (fixed) formulas and overwrites the stored copy. This is the
// "force fix" button: it does NOT require the visitor to re-enter anything,
// because their birth input is kept alongside the computed chart.

interface Body {
  uid?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
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

  const { uid } = req.body as Body
  if (!uid) {
    res.status(400).json({ error: 'uid is required' })
    return
  }

  try {
    const db = getAdminDb()
    const ref = db.collection('natalCharts').doc(uid)
    const snap = await ref.get()

    if (!snap.exists) {
      res.status(404).json({ error: 'This visitor has no saved chart to recompute.' })
      return
    }

    const existingInput = snap.data()?.chart?.input as BirthInput | undefined
    if (!existingInput) {
      res.status(422).json({ error: 'Saved chart is missing its original birth input -- cannot recompute. They will need to re-enter their birth details.' })
      return
    }

    const chart = computeNatalChart(existingInput)
    await ref.set({ chart, updatedAt: new Date().toISOString(), lastFixedByAdmin: true }, { merge: true })

    res.status(200).json({
      ok: true,
      sun: chart.points[0].sign,
      moon: chart.points[1].sign,
      rising: chart.ascendant.sign,
    })
  } catch (err) {
    console.error('admin/reset-chart error', err)
    res.status(500).json({ error: 'Reset failed' })
  }
}
