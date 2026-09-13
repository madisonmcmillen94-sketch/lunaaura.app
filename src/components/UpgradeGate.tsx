import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TIER_LABEL, type Tier } from '../lib/tiers'

interface UpgradeGateProps {
  /** Minimum tier required to see the real content. */
  required: Tier
  /** Short description of what unlocking gets them, shown on the upsell card. */
  teaser: string
  children: React.ReactNode
}

/**
 * Wraps a piece of premium UI. Signed-in accounts at or above `required` see
 * `children`; everyone else (including signed-out/anonymous visitors) sees a
 * warm upsell card instead -- never a hard error, never a dead end.
 */
export default function UpgradeGate({ required, teaser, children }: UpgradeGateProps) {
  const { can, isAccount } = useAuth()

  if (can(required)) return <>{children}</>

  return (
    <div className="glow-card rounded-2xl p-6 border-dashed border-2 border-[#caa6ff]/25 text-center">
      <p className="text-sm uppercase tracking-wide text-[#b6acd1] mb-2">
        {TIER_LABEL[required]} feature
      </p>
      <p className="text-[#dcd6ec] mb-4">{teaser}</p>
      <Link
        to="/pricing"
        className="inline-block rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors"
      >
        {isAccount ? `Upgrade to ${TIER_LABEL[required]}` : 'See plans'}
      </Link>
    </div>
  )
}
