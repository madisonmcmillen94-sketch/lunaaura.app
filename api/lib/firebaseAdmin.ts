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

  // Preferred path: paste the ENTIRE downloaded service-account JSON file
  // (Firebase console -> Project settings -> Service accounts -> Generate
  // new private key) into a single FIREBASE_SERVICE_ACCOUNT_KEY env var.
  // JSON.parse handles the private key's escaped "\n" sequences correctly
  // by construction, so there's no manual newline/quote surgery to get
  // wrong -- this is the robust path, use it.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (serviceAccountJson) {
    let parsed: { project_id?: string; client_email?: string; private_key?: string }
    try {
      parsed = JSON.parse(serviceAccountJson)
    } catch (e) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Paste the entire contents of the downloaded service-account .json file, unmodified. (${e instanceof Error ? e.message : e})`
      )
    }
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY is missing project_id, client_email, or private_key -- make sure the whole JSON file was pasted in.'
      )
    }
    app = initializeApp({
      credential: cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      }),
    })
    return app
  }

  // Legacy fallback: three separate env vars (kept for compatibility with
  // any existing setup). Private key must be pasted with real newlines OR
  // literal "\n" sequences, with no surrounding quotes -- we handle the
  // "\n" case, but this path is fragile; prefer FIREBASE_SERVICE_ACCOUNT_KEY
  // above.
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY (the whole service-account JSON file) in Vercel.'
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
