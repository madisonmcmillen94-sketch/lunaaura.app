import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminDb } from './_lib/firebaseAdmin.js'
import { PUSH_COLLECTION, REMINDER_COPY, sendToSubscribers, type ReminderPeriod } from './_lib/reminders.js'

/**
 * Daily reminder fan-out, driven by the two cron entries in vercel.json.
 *
 * Send times are fixed (see vercel.json) rather than per-person: Vercel's
 * Hobby plan allows at most two cron jobs and only a once-a-day schedule, so
 * there is no hourly tick to match each subscriber's own timezone against.
 * We still store each subscriber's timezone at sign-up, so moving to
 * per-timezone delivery later is a schedule change plus a filter here, not a
 * re-design.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel sends `Authorization: Bearer $CRON_SECRET` on cron invocations.
  // If the secret is configured we require it, so the endpoint cannot be
  // used by anyone else to spam every subscriber.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const period: ReminderPeriod = req.query.period === 'evening' ? 'evening' : 'morning'

  try {
    // Single-field equality query -- automatically indexed by Firestore.
    const snap = await getAdminDb().collection(PUSH_COLLECTION).where(period, '==', true).get()

    const subscribers: { uid: string; token: string }[] = []
    snap.forEach((doc) => {
      const token = doc.data().token
      if (typeof token === 'string' && token.length > 0) {
        subscribers.push({ uid: doc.id, token })
      }
    })

    const copy = REMINDER_COPY[period]
    const result = await sendToSubscribers(subscribers, copy.title, copy.body)

    console.log(
      `Reminder run (${period}): attempted ${result.attempted}, delivered ${result.delivered}, pruned ${result.pruned}`
    )
    res.status(200).json({ period, ...result })
  } catch (err) {
    console.error('Reminder cron failed', err)
    res.status(500).json({ error: 'Reminder run failed' })
  }
}
