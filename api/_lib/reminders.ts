import type { MulticastMessage } from 'firebase-admin/messaging'
import { getAdminDb, getAdminMessaging } from './firebaseAdmin.js'

export type ReminderPeriod = 'morning' | 'evening'

export const PUSH_COLLECTION = 'pushSubscriptions'

/**
 * Notification copy mirrors the in-app DailyCheckIn card so the nudge and the
 * thing it opens read as one voice rather than two different products.
 */
export const REMINDER_COPY: Record<ReminderPeriod, { title: string; body: string }> = {
  morning: {
    title: 'Morning check-in',
    body: 'Thirty seconds before the day gets away from you — how does your body feel?',
  },
  evening: {
    title: 'Evening check-in',
    body: 'Before you wind down — how did today actually feel?',
  },
}

/** FCM error codes that mean the token is gone for good, not a transient failure. */
const DEAD_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]

/** Absolute origin for the notification's click-through link. */
export function appOrigin(): string {
  const explicit = process.env.PUBLIC_APP_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`
  return 'https://lunaaura-app.vercel.app'
}

export function buildMessage(tokens: string[], title: string, body: string): MulticastMessage {
  return {
    tokens,
    webpush: {
      notification: {
        title,
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'lunaaura-reminder',
      },
      fcmOptions: { link: `${appOrigin()}/` },
      headers: { Urgency: 'high', TTL: '3600' },
    },
  }
}

export interface SendResult {
  attempted: number
  delivered: number
  pruned: number
}

/**
 * Sends one notification to many subscribers, then clears out subscriptions
 * whose token the push service has permanently rejected -- otherwise every
 * future run re-sends to browsers that uninstalled or revoked permission, and
 * the failure count climbs forever.
 */
export async function sendToSubscribers(
  subscribers: { uid: string; token: string }[],
  title: string,
  body: string
): Promise<SendResult> {
  if (subscribers.length === 0) return { attempted: 0, delivered: 0, pruned: 0 }

  const db = getAdminDb()
  const messaging = getAdminMessaging()

  let delivered = 0
  const deadUids: string[] = []

  // sendEachForMulticast caps at 500 tokens per call.
  for (let i = 0; i < subscribers.length; i += 500) {
    const batch = subscribers.slice(i, i + 500)
    const response = await messaging.sendEachForMulticast(
      buildMessage(
        batch.map((s) => s.token),
        title,
        body
      )
    )

    response.responses.forEach((result, index) => {
      if (result.success) {
        delivered += 1
        return
      }
      const code = result.error?.code
      if (code && DEAD_TOKEN_CODES.indexOf(code) !== -1) {
        deadUids.push(batch[index].uid)
      } else {
        console.error('Reminder send failed', batch[index].uid, code)
      }
    })
  }

  for (const uid of deadUids) {
    try {
      await db.collection(PUSH_COLLECTION).doc(uid).delete()
    } catch (err) {
      console.error('Could not prune dead push subscription', uid, err)
    }
  }

  return { attempted: subscribers.length, delivered, pruned: deadUids.length }
}
