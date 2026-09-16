/*
 * LunaAura push service worker.
 *
 * Deliberately has NO Firebase SDK in it. FCM only needs a service worker
 * registration to create a push subscription -- it does not care what the
 * worker contains -- so handling the raw `push` event ourselves avoids
 * pinning a firebase-*-compat.js CDN version here that would silently drift
 * out of step with the version in package.json and break background
 * notifications with no build error to warn us.
 *
 * The file keeps its conventional name so that if the messaging SDK ever
 * falls back to its default registration path, it still finds this worker.
 */

/* global self, clients */

const DEFAULT_TITLE = 'LunaAura'
const APP_URL = '/'

/** FCM webpush payloads arrive shaped differently depending on how they were sent. */
function readPayload(event) {
  if (!event.data) return {}
  let raw
  try {
    raw = event.data.json()
  } catch {
    // Not JSON -- treat the whole thing as a body string.
    return { body: event.data.text() }
  }

  const notification = raw.notification || {}
  const data = raw.data || {}

  return {
    title: notification.title || data.title,
    body: notification.body || data.body,
    url: (raw.fcmOptions && raw.fcmOptions.link) || data.url || APP_URL,
    tag: notification.tag || data.tag || 'lunaaura-reminder',
  }
}

self.addEventListener('push', (event) => {
  const payload = readPayload(event)

  event.waitUntil(
    self.registration.showNotification(payload.title || DEFAULT_TITLE, {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // Same tag means a second reminder replaces the first rather than
      // stacking up unread copies on the lock screen.
      tag: payload.tag,
      renotify: true,
      data: { url: payload.url || APP_URL },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || APP_URL

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Prefer focusing a tab that already has the app open.
      for (let i = 0; i < windowClients.length; i += 1) {
        const client = windowClients[i]
        if (client.url.indexOf(self.registration.scope) === 0 && 'focus' in client) {
          if ('navigate' in client) client.navigate(target)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(target)
      return undefined
    })
  )
})

// Take over straight away on first install so the very first reminder after
// someone opts in is handled, instead of waiting for a tab close/reopen.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()))
