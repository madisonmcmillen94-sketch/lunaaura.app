import type { VercelRequest } from '@vercel/node'
import { getAdminAuth } from './firebaseAdmin.js'

// Gate for every /api/admin/* endpoint. The client sends the signed-in
// visitor's Firebase ID token; we verify it server-side with the Admin SDK
// (so it can't be forged) and then check the resulting uid against an
// allowlist set in Vercel env vars. Nothing about "who is admin" is decided
// on the client -- the /admin page hiding itself is just UI convenience.
//
// Set ADMIN_UIDS in Vercel (Project Settings -> Environment Variables) to a
// comma-separated list of Firebase Auth UIDs allowed to call these routes,
// e.g. ADMIN_UIDS=lmUqZt4zC3O3upmVy76TIfzmYEf2

export class AdminAuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

export async function requireAdmin(req: VercelRequest): Promise<string> {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new AdminAuthError('Missing Authorization header')
  }
  const idToken = header.slice('Bearer '.length)

  const decoded = await getAdminAuth().verifyIdToken(idToken)

  const allowlist = (process.env.ADMIN_UIDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (allowlist.length === 0) {
    throw new AdminAuthError('ADMIN_UIDS is not configured on the server', 500)
  }
  if (!allowlist.includes(decoded.uid)) {
    throw new AdminAuthError('Not an admin account', 403)
  }

  return decoded.uid
}
