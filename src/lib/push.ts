import { ensureAnonymousUser } from './firebase'

/**
 * Web push opt-in for the daily check-in reminders.
 *
 * The FCM token and the on/off flags are written through /api/push with the
 * Admin SDK rather than straight to Firestore, so no new security rules are
 * needed and the token never sits in a client-readable document.
 */

export interface ReminderSettings {
  morning: boolean
  evening: boolean
}

export const NO_REMINDERS: ReminderSettings = { morning: false, evening: false }

/** Set once the Web Push certificate exists in Firebase (see README/setup notes). */
const VAPID_KEY = String(import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '')

/** False until the VAPID key is configured — the UI stays hidden rather than offering something that cannot work. */
export function isPushConfigured(): boolean {
  return VAPID_KEY.length > 0
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

export function permissionState(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * iOS only delivers web push to a site installed to the home screen, so a
 * Safari-on-iPhone visitor who has not installed LunaAura needs telling that
 * rather than a permission prompt that silently does nothing.
 */
export function needsIosInstall(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua)
  if (!isIos) return false
  const standalone = window.matchMedia('(display-mode: standalone)').matches
  return !standalone
}

async function authHeader(): Promise<Record<string, string>> {
  const user = await ensureAnonymousUser()
  const idToken = await user.getIdToken()
  return { Authorization: `Bearer ${idToken}` }
}

async function registerWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing) return existing
  return navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
}

export type PushFailure = 'unsupported' | 'denied' | 'no-token' | 'save-failed'

/** Thrown with the reason as the message, so callers can map it straight to copy. */
function pushError(reason: PushFailure): Error {
  return new Error(reason)
}

export function failureReason(err: unknown): PushFailure {
  const message = err instanceof Error ? err.message : ''
  if (message === 'unsupported' || message === 'denied' || message === 'no-token') return message
  return 'save-failed'
}

/** Asks for permission, gets an FCM token, and saves the chosen reminder times. */
export async function enableReminders(settings: ReminderSettings): Promise<void> {
  if (!isPushSupported() || !isPushConfigured()) throw pushError('unsupported')

  const { getMessaging, getToken, isSupported } = await import('firebase/messaging')
  if (!(await isSupported())) throw pushError('unsupported')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw pushError('denied')

  const registration = await registerWorker()
  await navigator.serviceWorker.ready

  let token: string
  try {
    token = await getToken(getMessaging(), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
  } catch (err) {
    console.error('Could not get an FCM token', err)
    throw pushError('no-token')
  }
  if (!token) throw pushError('no-token')

  await saveSettings(settings, token)
}

async function saveSettings(settings: ReminderSettings, token: string | null): Promise<void> {
  const res = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({
      token,
      morning: settings.morning,
      evening: settings.evening,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    }),
  })
  if (!res.ok) throw pushError('save-failed')
}

/**
 * Changes which reminders are on for someone already opted in. Re-reads the
 * current FCM token first: browsers rotate it, and saving a stale one would
 * leave the person subscribed to notifications that never arrive.
 */
export async function updateReminders(settings: ReminderSettings): Promise<void> {
  if (!settings.morning && !settings.evening) {
    await saveSettings(settings, null)
    return
  }
  await enableReminders(settings)
}

export async function loadReminders(): Promise<ReminderSettings> {
  try {
    const res = await fetch('/api/push', { headers: await authHeader() })
    if (!res.ok) return NO_REMINDERS
    const data = (await res.json()) as Partial<ReminderSettings> & { hasToken?: boolean }
    if (!data.hasToken) return NO_REMINDERS
    return { morning: data.morning === true, evening: data.evening === true }
  } catch (err) {
    console.error('Could not load reminder settings', err)
    return NO_REMINDERS
  }
}

export async function sendTestReminder(): Promise<void> {
  const res = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ test: true }),
  })
  if (!res.ok) throw pushError('save-failed')
}
