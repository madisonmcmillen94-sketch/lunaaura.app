import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

// Lazy init, matching the hard-won lesson from the Ori Codes build: eager
// initialization of the Admin SDK at module load / build time can crash
// (`DECODER routines::unsupported`), so we only construct the app the first
// time a request actually needs it.
let app: App | null = null
let db: Firestore | null = null
let auth: Auth | null = null

function getAdminApp(): App {
  if (app) return app
  if (getApps().length) {
    app = getApps()[0]
    return app
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // Private key must be pasted into Vercel with real newlines OR with
  // literal "\n" sequences -- we handle both.
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Missing Firebase Admin env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
    )
  }
  const privateKey = privateKeyRaw.includes('\\n') ? privateKeyRaw.replace(/\\n/g, '\n') : privateKeyRaw

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })
  return app
}

export function getAdminDb(): Firestore {
  if (db) return db
  db = getFirestore(getAdminApp())
  return db
}

export function getAdminAuth(): Auth {
  if (auth) return auth
  auth = getAuth(getAdminApp())
  return auth
}
