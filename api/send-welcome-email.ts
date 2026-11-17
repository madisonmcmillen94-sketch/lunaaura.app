import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAdminAuth, getAdminDb } from './_lib/firebaseAdmin.js'

// Welcome email with the free 7-Day Nervous System Reset Guide, sent once
// per user at signup. The signup flow never depends on this endpoint: if
// Resend is not configured it answers 501 and the client ignores the failure.
const RESEND_URL = 'https://api.resend.com/emails'
const SUBJECT = 'Welcome to LunaAura — your 7-Day Nervous System Reset Guide is inside'

const WELCOME_HTML = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#0d0a1a;font-family:Georgia,serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <p style="color:#caa6ff;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">LunaAura</p>
      <p style="color:#d9b36a;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:0 0 24px;">Come Back To Your Body</p>
      <h1 style="color:#f4f0ff;font-size:26px;line-height:1.3;margin:0 0 16px;">Welcome — I'm so glad you're here.</h1>
      <p style="color:#e9e4f5;font-size:16px;line-height:1.7;margin:0 0 16px;">I built LunaAura for the moments when life feels loud and your body feels far away. This guide is an invitation to notice — to pause, take a few slow breaths, and listen to what your body is already telling you. There's nothing to fix and nowhere to rush to. Just a little more room to come back to yourself.</p>
      <p style="color:#e9e4f5;font-size:16px;line-height:1.7;margin:0 0 24px;">Your 7-Day Nervous System Reset Guide is ready for you:</p>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="https://lunaaura.online/7-day-nervous-system-reset-guide.pdf" style="display:inline-block;background-color:#d9b36a;color:#1a0f2e;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:999px;">Download your guide</a>
      </div>
      <p style="color:#e9e4f5;font-size:16px;line-height:1.7;margin:0 0 16px;">A gentle place to begin: check your Forecast, take a slow Breathe, and note what you notice in your Nervous System Journal. One small moment at a time.</p>
      <p style="color:#caa6ff;font-size:16px;line-height:1.7;margin:0 0 4px;">Come Back To Your Body,</p>
      <p style="color:#f4f0ff;font-size:16px;line-height:1.7;margin:0 0 32px;">Madison, Founder, LunaAura</p>
      <p style="color:#8f87a8;font-size:12px;line-height:1.6;margin:0;">You're receiving this because you joined LunaAura.</p>
    </div>
  </body>
</html>`

async function caller(req: VercelRequest): Promise<{ uid: string; email: string | null } | null> {
  // Same convention as the other endpoints: { idToken } in the JSON body,
  // or an Authorization: Bearer token header.
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
    let email: string | null = typeof decoded.email === 'string' ? decoded.email : null
    if (!email) {
      const snap = await getAdminDb().collection('users').doc(decoded.uid).get()
      const stored = snap.data()?.email
      email = typeof stored === 'string' ? stored : null
    }
    return { uid: decoded.uid, email }
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const who = await caller(req)
  if (!who) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }
  if (!who.email) {
    res.status(400).json({ error: 'No email on file for this account' })
    return
  }

  try {
    const db = getAdminDb()
    const userRef = db.collection('users').doc(who.uid)

    // Idempotency: never send the welcome email twice to the same user.
    const userSnap = await userRef.get()
    if (userSnap.data()?.welcomeEmailSentAt) {
      res.status(200).json({ alreadySent: true })
      return
    }

    // Email is optional infrastructure: without a key the signup flow
    // must keep working, so answer 501 and do nothing else.
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      res.status(501).json({ error: 'email_not_configured' })
      return
    }

    const from = process.env.WELCOME_FROM_EMAIL || 'LunaAura <onboarding@resend.dev>'
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [who.email],
        subject: SUBJECT,
      
        html: WELCOME_HTML,
      }),
    })
    if (!response.ok) {
      console.error('send-welcome-email: Resend rejected the send', response.status)
      res.status(502).json({ error: 'email_send_failed' })
      return
    }

    await userRef.set({ welcomeEmailSentAt: new Date().toISOString() }, { merge: true })
    res.status(200).json({ sent: true })
  } catch (err) {
    console.error('send-welcome-email handler error', err)
    res.status(500).json({ error: 'The welcome email could not be sent right now.' })
  }
}
