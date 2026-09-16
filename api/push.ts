import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminAuth, getAdminDb } from './_lib/firebaseAdmin.js'
import { sendToSubscribers } from './_lib/reminders.js'

/**
 * Reminder subscriptions live in their own collection, written only through
 * the Admin SDK. That is deliberate: it keeps the FCM token off the client's
 * read path and means shipping reminders needs no new Firestore security
 * rules (which we cannot deploy from the repo -- rules are managed in the
 * Firebase console).
 *
 * Doc id is the uid, so a person has exactly one subscription per account.
 * Queries against it are single-field equality only, which Firestore indexes
 * automatically -- no composite index to create.
 */
const COLLECTION = 'pushSubscriptions'

interface SaveBody {
  token?: unknown
  morning?: unknown
  evening?: unknown
  timezone?: unknown
  test?: unknown
}

/** Verifies the Firebase ID token in the Authorization header. */
async function uidFromRequest(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null
  const idToken = header.slice('Bearer '.length).trim()
  if (!idToken) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken)
    return decoded.uid
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const uid = await uidFromRequest(req)
  if (!uid) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  const ref = getAdminDb().collection(COLLECTION).doc(uid)

  try {
    if (req.method === 'GET') {
      const snap = await ref.get()
      const data = snap.data()
      res.status(200).json({
        morning: data?.morning === true,
        evening: data?.evening === true,
        hasToken: typeof data?.token === 'string' && data.token.length > 0,
      })
      return
    }

    const body = (req.body ?? {}) as SaveBody

    // "Send me one now" -- lets someone confirm notifications actually reach
    // their device at opt-in time, rather than finding out tomorrow morning
    // that permission was granted but delivery was silently broken.
    if (body.test === true) {
      const snap = await ref.get()
      const token = snap.data()?.token
      if (typeof token !== 'string' || !token) {
        res.status(400).json({ error: 'Turn reminders on first, then send a test.' })
        return
      }
      const result = await sendToSubscribers(
        [{ uid, token }],
        'Reminders are on',
        'This is what your daily check-in nudge will look like.'
      )
      if (result.delivered === 0) {
        res.status(502).json({ error: 'That notification could not be delivered — try turning reminders off and on again.' })
        return
      }
      res.status(200).json({ sent: true })
      return
    }

    const morning = body.morning === true
    const evening = body.evening === true
    const token = typeof body.token === 'string' && body.token.length > 0 ? body.token : null
    const timezone = typeof body.timezone === 'string' ? body.timezone.slice(0, 64) : null

    // Turning everything off, or losing the token, should clear the record
    // outright rather than leave a dead row the cron keeps walking past.
    if (!token || (!morning && !evening)) {
      await ref.delete()
      res.status(200).json({ morning: false, evening: false, hasToken: false })
      return
    }

    await ref.set(
      {
        token,
        morning,
        evening,
        timezone,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    res.status(200).json({ morning, evening, hasToken: true })
  } catch (err) {
    console.error('Reminder settings request failed', err)
    res.status(500).json({ error: 'Could not save your reminder settings — try again in a moment.' })
  }
}
