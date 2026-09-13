import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const USERS_COLLECTION = 'users'

export interface UserProfile {
  email: string | null
  createdAt: string | null
  onboardedAt: string | null
}

/**
 * Creates a real account for the given email/password. If the visitor already
 * has an anonymous session (e.g. they entered a chart before signing up),
 * this upgrades that same session in place via linkWithCredential, so their
 * existing chart/journal data carries over to the new account instead of
 * being orphaned under the old anonymous uid.
 */
export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const current = auth.currentUser
  let user: User

  if (current && current.isAnonymous) {
    try {
      const credential = EmailAuthProvider.credential(email, password)
      const result = await linkWithCredential(current, credential)
      user = result.user
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
        // That email already belongs to a different, non-anonymous account.
        // Fall back to logging into it directly with the password they just typed.
        const result = await signInWithEmailAndPassword(auth, email, password)
        user = result.user
      } else {
        throw err
      }
    }
  } else {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    user = result.user
  }

  await setDoc(
    doc(db, USERS_COLLECTION, user.uid),
    { email: user.email, createdAt: serverTimestamp() },
    { merge: true }
  )

  return user
}

export async function logInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

/** Subscribes to Firebase Auth state changes. Returns an unsubscribe function. */
export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid))
  if (!snap.exists()) return null
  const data = snap.data()
  const toIso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : null)
  return {
    email: data.email ?? null,
    createdAt: toIso(data.createdAt),
    onboardedAt: toIso(data.onboardedAt),
  }
}

/** Marks the one-time welcome tour as seen for this account. */
export async function markOnboarded(uid: string): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, uid), { onboardedAt: serverTimestamp() }, { merge: true })
}
