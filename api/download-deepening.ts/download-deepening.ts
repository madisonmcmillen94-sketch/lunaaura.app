import type { VercelRequest, VercelResponse } from '@vercel/node'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAdminAuth, getAdminDb } from './_lib/firebaseAdmin.js'

// Gated download for The Deepening — All Access Workbook.
// The workbook lives in assets/ (never in public/) and is served only here,
// after the caller's Firebase ID token is verified and their Firestore
// users/{uid} tier is checked, the same way /api/companion gates All Access.
const REQUIRED_TIER = 'all_access'
const WORKBOOK_FILE = 'the-deepening-all-access-workbook.pdf'
const DOWNLOAD_NAME = 'The-Deepening-LunaAura.pdf'

async function uidFromRequest(req: VercelRequest): Promise<string | null> {
  // Same convention as create-checkout-session: { idToken } in the JSON body,
  // plus the Authorization: Bearer convention used by /api/companion.
  const header = req.headers.authorization
  let idToken: string | null = null
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    idToken = header.slice('Bearer '.length).trim() || null
  }
  if (!idToken) {
    const body = (req.body ?? {}) as Record<string, unknown>
    if (typeof body.idToken === 'string' && body.idToken.trim()) {
      idToken = body.idToken.trim()
    }
  }
  if (!idToken) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken)
    return decoded.uid
  } catch {
    return null
  }
}

function findWorkbookPath(): string | null {
  // Vercel bundles the file listed in vercel.json `functions` includeFiles.
  // Try the project-root location first, then locations relative to this file,
  // so the endpoint works both locally and in the deployed function.
  const candidates = [
    join(process.cwd(), 'assets', WORKBOOK_FILE),
    join(process.cwd(), '..', 'assets', WORKBOOK_FILE),
    resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets', WORKBOOK_FILE),
    resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', WORKBOOK_FILE),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const uid = await uidFromRequest(req)
  if (!uid) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  try {
    const db = getAdminDb()

    // Tier is read server-side from Firestore, never trusted from the client.
    const userSnap = await db.collection('users').doc(uid).get()
    if ((userSnap.data()?.tier ?? 'free') !== REQUIRED_TIER) {
      res.status(403).json({ error: 'The Deepening workbook is part of All Access.' })
      return
    }

    const filePath = findWorkbookPath()
    if (!filePath) {
      console.error('download-deepening: workbook file not found in bundle')
      res.status(500).json({ error: 'The workbook is not available right now — try again shortly.' })
      return
    }

    const pdf = readFileSync(filePath)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${DOWNLOAD_NAME}"`)
    res.setHeader('Content-Length', String(pdf.length))
    res.status(200).send(pdf)
  } catch (err) {
    console.error('download-deepening handler error', err)
    res.status(500).json({ error: 'The workbook is not available right now — try again shortly.' })
  }
}
