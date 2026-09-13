import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db, ensureAnonymousUser } from './firebase'
import type { BirthInput, NatalChart } from './natal'
import { computeNatalChart } from './natal'

const COLLECTION = 'natalCharts'

/** Loads the signed-in visitor's saved birth chart, if any. */
export async function loadNatalChart(): Promise<NatalChart | null> {
  const user = await ensureAnonymousUser()
  const snap = await getDoc(doc(db, COLLECTION, user.uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return data.chart as NatalChart
}

/** Computes and saves a birth chart for the signed-in visitor, returning it. */
export async function saveBirthInput(input: BirthInput): Promise<NatalChart> {
  const user = await ensureAnonymousUser()
  const chart = computeNatalChart(input)
  await setDoc(doc(db, COLLECTION, user.uid), {
    chart,
    updatedAt: serverTimestamp(),
  })
  return chart
}

export async function clearNatalChart(): Promise<void> {
  const user = await ensureAnonymousUser()
  await deleteDoc(doc(db, COLLECTION, user.uid))
}

