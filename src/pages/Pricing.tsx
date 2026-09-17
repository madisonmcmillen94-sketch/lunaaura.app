import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { auth } from '../lib/firebase'
import { PRICING, FEATURES, TIER_LABEL, type BillingCadence, type Tier } from '../lib/tiers'

const TIERS: Tier[] = ['free', 'plus', 'all_access']

// sessionStorage key used to carry {tier, cadence, value} across the Stripe
// redirect round trip, so the GA4 conversion event fired on return knows what
// was actually purchased (Stripe's success_url doesn't include it).
const PENDING_CHECKOUT_KEY = 'la_pending_checkout'

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

function pushToDataLayer(event: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(event)
}

export default function Pricing() {
  const { user, isAccount, tier, profile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [cadence, setCadence] = useState<BillingCadence>('monthly')
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trackedResult = useRef(false)

  const checkoutResult = params.get('checkout')

  // Fires once per landing on ?checkout=success|cancelled -- covers the whole
  // funnel (begin_checkout fires in handleChoose below) so drop-off between
  // "started checkout" and "actually subscribed" is visible in GA4.
  useEffect(() => {
    if (!checkoutResult || trackedResult.current) return
    trackedResult.current = true

    if (checkoutResult === 'success') {
      const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY)
      const pending = raw ? (JSON.parse(raw) as { tier: Tier; cadence: BillingCadence; value: number }) : null
      pushToDataLayer({
        event: 'subscribe',
        subscription_tier: pending?.tier ?? 'unknown',
        subscription_cadence: pending?.cadence ?? 'unknown',
        currency: 'USD',
        value: pending?.value ?? 0,
      })
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
    } else if (checkoutResult === 'cancelled') {
      pushToDataLayer({ event: 'checkout_cancelled' })
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
    }
  }, [checkoutResult])

  async function handleChoose(target: Tier) {
    setError(null)
    if (target === 'free') return

    if (!isAccount) {
      navigate('/signup')
      return
    }

    setLoadingTier(target)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error('not signed in')
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, tier: target, cadence }),
      })
      const data = await res.json()
      if (data?.url) {
        const pricing = PRICING.find((p) => p.tier === target)
        const value = pricing ? (cadence === 'monthly' ? pricing.monthly : pricing.yearly) : 0
        pushToDataLayer({
          event: 'begin_checkout',
          subscription_tier: target,
          subscription_cadence: cadence,
          currency: 'USD',
          value,
        })
        sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({ tier: target, cadence, value }))
        window.location.href = data.url
      } else {
        setError(data?.error ?? 'Could not start checkout — try again.')
      }
    } catch (e) {
      console.error(e)
      setError('Could not start checkout — try again in a moment.')
    } finally {
      setLoadingTier(null)
    }
  }

  async function handleManageBilling() {
    setError(null)
    setPortalLoading(true)
    try {
      const idToken = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError(data?.error ?? 'Could not open billing — try again.')
      }
    } catch (e) {
      console.error(e)
      setError('Could not open billing — try again in a moment.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-2 text-center">Plans</h1>
      <p className="text-[#c9c2dd] text-center mb-8">
        The daily forecast and journal are free, always. Upgrade for the parts that are personal to
        your own chart.
      </p>

      {checkoutResult === 'success' && (
        <p className="max-w-md mx-auto mb-6 text-sm text-[#c9f5d9] bg-[#1a3a24]/40 border border-[#c9f5d9]/20 rounded-lg px-4 py-3 text-center">
          You're in — it can take a few seconds for your new plan to show up. Refresh if it doesn't
          update right away.
        </p>
      )}
      {checkoutResult === 'cancelled' && (
        <p className="max-w-md mx-auto mb-6 text-sm text-[#dcd6ec] bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center">
          Checkout cancelled — no changes were made.
        </p>
      )}
      {error && (
        <p className="max-w-md mx-auto mb-6 text-sm text-[#ffb4b4] bg-[#3a1a1a]/40 border border-[#ffb4b4]/20 rounded-lg px-4 py-3 text-center">
          {error}
        </p>
      )}

      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-full border border-white/15 p-1">
          <button
            onClick={() => setCadence('monthly')}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              cadence === 'monthly' ? 'bg-[#caa6ff] text-[#1a0f2e] font-semibold' : 'text-[#c9c2dd]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setCadence('yearly')}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              cadence === 'yearly' ? 'bg-[#caa6ff] text-[#1a0f2e] font-semibold' : 'text-[#c9c2dd]'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-10">
        {TIERS.map((t) => {
          const isCurrent = tier === t
          const pricing = PRICING.find((p) => p.tier === t)
          const price = pricing ? (cadence === 'monthly' ? pricing.monthly : pricing.yearly) : 0
          const suffix = t === 'free' ? '' : cadence === 'monthly' ? '/mo' : '/yr'

          return (
            <div
              key={t}
              className={`glow-card rounded-2xl p-6 flex flex-col ${
                t === 'plus' ? 'ring-1 ring-[#caa6ff]/40' : ''
              }`}
            >
              <h2 className="text-lg font-display mb-1">{TIER_LABEL[t]}</h2>
              <p className="text-2xl font-display mb-4">
                {t === 'free' ? 'Free' : `$${price}`}
                <span className="text-sm text-[#9a92b3] font-normal">{suffix}</span>
              </p>
              <ul className="text-sm text-[#dcd6ec] space-y-2 mb-6 flex-1">
                {FEATURES.filter((f) => f.tiers.includes(t)).map((f) => (
                  <li key={f.label} className="flex gap-2">
                    <span className="text-[#caa6ff]">✓</span>
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <span className="text-center text-sm text-[#9a92b3] border border-white/15 rounded-full py-2.5">
                  Your current plan
                </span>
              ) : (
                <button
                  onClick={() => handleChoose(t)}
                  disabled={loadingTier === t}
                  className="rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold py-2.5 hover:bg-[#dcc0ff] transition-colors disabled:opacity-60"
                >
                  {t === 'free'
                    ? isAccount
                      ? 'Downgrade in billing'
                      : 'Get started'
                    : loadingTier === t
                      ? 'Loading…'
                      : isAccount
                        ? `Choose ${TIER_LABEL[t]}`
                        : 'Sign up to choose'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {isAccount && profile?.stripeCustomerId && (
        <p className="text-center">
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="text-sm text-[#c9c2dd] underline decoration-[#8e85a8]/50 hover:text-[#e9e4f5] disabled:opacity-60"
          >
            {portalLoading ? 'Opening billing…' : 'Manage or cancel your subscription'}
          </button>
        </p>
      )}

      {!user && (
        <p className="text-center text-sm text-[#8e85a8] mt-4">
          <Link to="/signup" className="underline decoration-[#caa6ff]/50">
            Create a free account
          </Link>{' '}
          first to subscribe.
        </p>
      )}
    </div>
  )
}
