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

export interface JournalEntry {
  id: string
  date: string // ISO date (YYYY-MM-DD)
  moonPhase: string
  moodWord: string
  bodyNotes: string
  freeform: string
  createdAt: string
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
