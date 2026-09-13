import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db, ensureAnonymousUser } from './firebase'
import type { AspectName, AspectNature } from './transits'

/**
 * A compact snapshot of the tightest active transits at the moment a journal
 * entry was saved. Storing this at write-time (rather than recomputing transits
 * for past dates later) is what makes the patterns dashboard cheap: it's a
 * pure aggregation over already-saved data, no server calls, no re-running
 * astronomy-engine over history.
 */
export interface TransitSnapshotHit {
  transitingPlanet: string
  natalPoint: string
  aspect: AspectName
  nature: AspectNature
  orb: number
}

export interface JournalEntry {
  id: string
  date: string // ISO date (YYYY-MM-DD)
  moonPhase: string
  moodWord: string
  bodyNotes: string
  freeform: string
  createdAt: string
  // Present only when the entry was saved while signed in with a saved chart.
  transitSnapshot: TransitSnapshotHit[] | null
}

const COLLECTION = 'journals'

export async function loadEntries(): Promise<JournalEntry[]> {
  const user = await ensureAnonymousUser()
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString()
    return {
      id: d.id,
      date: data.date,
      moonPhase: data.moonPhase,
      moodWord: data.moodWord,
      bodyNotes: data.bodyNotes ?? '',
      freeform: data.freeform ?? '',
      createdAt,
      transitSnapshot: Array.isArray(data.transitSnapshot) ? data.transitSnapshot : null,
    }
  })
}

export async function saveEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<void> {
  const user = await ensureAnonymousUser()
  await addDoc(collection(db, COLLECTION), {
    ...entry,
    userId: user.uid,
    createdAt: serverTimestamp(),
  })
}

export async function deleteEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}
