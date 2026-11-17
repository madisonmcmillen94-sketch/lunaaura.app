import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { PRICING, type BillingCadence, type Tier } from '../lib/tiers';
import '../../LandingPage.css';

// sessionStorage key used to carry {tier, cadence, value} across the Stripe
// redirect round trip, so the GA4 conversion event fired on return knows what
// was actually purchased (Stripe's success_url doesn't include it).
// Same key as src/pages/Pricing.tsx.
const PENDING_CHECKOUT_KEY = 'la_pending_checkout';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function pushToDataLayer(event: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

const LandingPage = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { isAccount, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cadence: BillingCadence = isYearly ? 'yearly' : 'monthly';

  // Same checkout flow as src/pages/Pricing.tsx handleChoose: visitors
  // without a real (non-anonymous) account go to /signup first, because
  // /api/create-checkout-session rejects anonymous tokens.
  async function handleChoose(target: 'plus' | 'all_access') {
    setError(null);

    if (!isAccount) {
      navigate('/signup');
      return;
    }

    setLoadingTier(target);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('not signed in');
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, tier: target, cadence }),
      });
      const data = await res.json();
      const pricing = PRICING.find((p) => p.tier === target);
      const value = pricing ? (cadence === 'monthly' ? pricing.monthly : pricing.yearly) : 0;

      if (data?.alreadySubscribed) {
        // Already on exactly this tier+cadence -- nothing to do, and
        // importantly nothing to bill again.
        setError("You're already on this plan.");
      } else if (data?.updated) {
        // They had an existing subscription and it was changed in place
        // (e.g. Plus -> All Access) rather than a new one being created, so
        // there's no Stripe-hosted checkout to redirect through.
        sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({ tier: target, cadence, value }));
        await refreshProfile();
        navigate('/pricing?checkout=success');
      } else if (data?.url) {
        pushToDataLayer({
          event: 'begin_checkout',
          subscription_tier: target,
          subscription_cadence: cadence,
          currency: 'USD',
          value,
        });
        sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({ tier: target, cadence, value }));
        window.location.href = data.url;
      } else {
        setError(data?.error ?? 'Could not start checkout — try again.');
      }
    } catch (e) {
      console.error(e);
      setError('Could not start checkout — try again in a moment.');
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <h1>Regulate your nervous system in sync with the <span>cosmos.</span></h1>
        <p>Luna Aura blends somatic healing, real-time planetary transits, and a body-first journal to help you process emotions and stay grounded.</p>
        <button className="btn-primary" onClick={() => navigate('/signup')}>Get Started</button>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <h2>Plans</h2>
        <p className="pricing-subtitle">The daily forecast and journal are free, always. Upgrade for the parts that are personal to your own chart.</p>
        {error && (
          <p className="max-w-md mx-auto mb-6 text-sm text-[#ffb4b4] bg-[#3a1a1a]/40 border border-[#ffb4b4]/20 rounded-lg px-4 py-3 text-center">
            {error}
          </p>
        )}

        <div className="billing-toggle">
          <button
            className={!isYearly ? 'active' : ''}
            onClick={() => setIsYearly(false)}
          >
            Monthly
          </button>
          <button
            className={isYearly ? 'active' : ''}
            onClick={() => setIsYearly(true)}
          >
            Yearly
          </button>
        </div>

        <div className="pricing-cards">
          {/* Free Tier */}
          <div className="card">
            <h3>Free</h3>
            <div className="price">Free</div>
            <ul>
              <li>✓ Daily moon phase + planetary weather + earth activity forecast</li>
              <li>✓ Unlimited nervous-system journal</li>
              <li>✓ Full natal chart</li>
            </ul>
            <button className="btn-outline" onClick={() => navigate('/signup')}>Your current plan</button>
          </div>

          {/* Plus Tier */}
          <div className="card">
            <h3>Plus</h3>
            <div className="price">{isYearly ? '$24/yr' : '$2.99/mo'}</div>
            <ul>
              <li>✓ Daily moon phase + planetary weather + earth activity forecast</li>
              <li>✓ Unlimited nervous-system journal</li>
              <li>✓ Full natal chart</li>
              <li>✓ Personal daily transits + somatic practice guidance</li>
              <li>✓ Synastry — compare your chart with a friend or partner's</li>
            </ul>
            <button className="btn-solid" onClick={() => handleChoose('plus')} disabled={loadingTier === 'plus'}>{loadingTier === 'plus' ? 'Loading…' : 'Choose Plus'}</button>
          </div>

          {/* All Access Tier */}
          <div className="card">
            <h3>All Access</h3>
            <div className="price">{isYearly ? '$39/yr' : '$4.99/mo'}</div>
            <ul>
              <li>✓ Daily moon phase + planetary weather + earth activity forecast</li>
              <li>✓ Unlimited nervous-system journal</li>
              <li>✓ Full natal chart</li>
              <li>✓ Personal daily transits + somatic practice guidance</li>
              <li>✓ Synastry — compare your chart with a friend or partner's</li>
              <li>✓ Your patterns dashboard (journal x transits, over time)</li>
              <li>✓ Ask your chart — an AI companion grounded in your real placements</li>
            </ul>
            <button className="btn-solid" onClick={() => handleChoose('all_access')} disabled={loadingTier === 'all_access'}>{loadingTier === 'all_access' ? 'Loading…' : 'Choose All Access'}</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
