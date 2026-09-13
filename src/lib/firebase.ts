import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Guard against double-init in dev (Vite HMR) / missing config.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

let anonPromise: Promise<User> | null = null

/** Ensures the visitor has an anonymous Firebase Auth session, and resolves with their user. */
export function ensureAnonymousUser(): Promise<User> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser)
  if (anonPromise) return anonPromise

  anonPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe()
          resolve(user)
        }
      },
      reject
    )
    signInAnonymously(auth).catch((err) => {
      unsubscribe()
      reject(err)
    })
  })

  return anonPromise
}
