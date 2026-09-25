import React, { useState } from 'react';
import './LandingPage.css'; // We will create this next

const LandingPage = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <h1>Regulate your nervous system in sync with the <span>cosmos.</span></h1>
        <p>Luna Aura blends somatic healing, real-time planetary transits, and a body-first journal to help you process emotions and stay grounded.</p>
        <button className="btn-primary">Get Started</button>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <h2>Plans</h2>
        <p className="pricing-subtitle">The daily forecast and journal are free, always. Upgrade for the parts that are personal to your own chart.</p>
        
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
            <button className="btn-outline">Your current plan</button>
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
            <button className="btn-solid">Choose Plus</button>
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
            <button className="btn-solid">Choose All Access</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;