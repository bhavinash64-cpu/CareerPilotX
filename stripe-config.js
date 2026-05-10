// ═══════════════════════════════════════════
// CAREER PILOT — STRIPE PAYMENT INTEGRATION
// ═══════════════════════════════════════════
//
// ⚠️ SETUP INSTRUCTIONS:
// 1. Go to https://dashboard.stripe.com
// 2. Get your Publishable Key (pk_test_xxx or pk_live_xxx)
// 3. Create a Product + Price for the Pro plan (₹99/month)
// 4. Replace the values below
// 5. For production: set up a backend server (see BACKEND section below)
//
// ═══════════════════════════════════════════

// ▶▶▶ REPLACE THESE WITH YOUR STRIPE CREDENTIALS ◀◀◀
const STRIPE_CONFIG = {
  publishableKey: "YOUR_STRIPE_PUBLISHABLE_KEY",         // pk_test_xxx or pk_live_xxx
  proPriceId: "YOUR_PRO_PRICE_ID",                       // price_xxx from Stripe Dashboard
  // Backend endpoint that creates Checkout Sessions
  // Required for production. See backend template below.
  checkoutEndpoint: "/api/create-checkout-session",
  // URLs for redirect after payment
  successUrl: window.location.origin + "/index.html?payment=success&session_id={CHECKOUT_SESSION_ID}",
  cancelUrl: window.location.origin + "/index.html?payment=cancelled"
};

// ═══ CHECK IF STRIPE IS CONFIGURED ═══
function isStripeConfigured() {
  return STRIPE_CONFIG.publishableKey !== "YOUR_STRIPE_PUBLISHABLE_KEY" &&
         STRIPE_CONFIG.proPriceId !== "YOUR_PRO_PRICE_ID";
}

// ═══ STRIPE INITIALIZATION ═══
let stripeInstance = null;

function initStripe() {
  if (!isStripeConfigured()) {
    console.warn('[CareerPilot] Stripe not configured. Using demo checkout flow.');
    return false;
  }

  try {
    stripeInstance = Stripe(STRIPE_CONFIG.publishableKey);
    console.log('[CareerPilot] Stripe initialized successfully');
    return true;
  } catch (e) {
    console.error('[CareerPilot] Stripe initialization failed:', e);
    return false;
  }
}

// ═══ STRIPE CHECKOUT FLOW ═══
async function startStripeCheckout() {
  if (!isStripeConfigured()) {
    // Fall back to simulated checkout
    return false;
  }

  if (!stripeInstance) {
    showToast('❌', 'Payment system not ready. Try again.');
    return false;
  }

  try {
    showToast('🔄', 'Creating checkout session...');

    // Option 1: Client-side only (Stripe Checkout with Price ID)
    // This works BUT requires a backend for proper session verification
    const response = await fetch(STRIPE_CONFIG.checkoutEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: STRIPE_CONFIG.proPriceId,
        userId: currentFirebaseUser?.uid || 'guest',
        email: state.user?.email || ''
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const session = await response.json();

    // Store session reference for verification after redirect
    state.billing.activeCheckout = {
      sessionId: session.id,
      amountPaise: PRO_AMOUNT_PAISE,
      createdAtMs: Date.now()
    };
    saveState();

    // Redirect to Stripe Checkout
    const result = await stripeInstance.redirectToCheckout({
      sessionId: session.id
    });

    if (result.error) {
      showToast('❌', result.error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[CareerPilot] Stripe checkout error:', error);
    showToast('❌', 'Payment failed. Please try again.');
    return false;
  }
}

// ═══ HANDLE PAYMENT RETURN ═══
// Called when user returns from Stripe Checkout
async function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get('payment');
  const sessionId = params.get('session_id');

  if (!paymentStatus) return;

  // Clean up URL
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, '', cleanUrl);

  if (paymentStatus === 'success' && sessionId) {
    showToast('🔄', 'Verifying payment...');

    if (isStripeConfigured()) {
      // Verify with backend
      try {
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        const result = await response.json();

        if (result.verified && result.status === 'paid') {
          activateProPlan();
        } else {
          showToast('⚠️', 'Payment verification pending. Contact support if issues persist.');
        }
      } catch (e) {
        console.error('[CareerPilot] Payment verification error:', e);
        showToast('⚠️', 'Could not verify payment. Contact support.');
      }
    } else {
      // Demo mode: auto-activate
      activateProPlan();
    }
  } else if (paymentStatus === 'cancelled') {
    showToast('ℹ️', 'Payment was cancelled.');
    state.billing.activeCheckout = null;
    state.billing.lastOutcome = 'cancelled';
    saveState();
  }
}

// ═══ ACTIVATE PRO PLAN ═══
async function activateProPlan() {
  state.plan = 'pro';
  state.billing.activeCheckout = null;
  state.billing.lastOutcome = 'idle';
  saveState();
  applyState();

  // Sync to Firestore if connected
  if (typeof updateFirestorePlan === 'function') {
    await updateFirestorePlan('pro');
  }

  showToast('⚡', 'Pro plan activated! All features unlocked.');
  
  // Refresh templates to unlock pro ones
  if (typeof renderTemplates === 'function') renderTemplates();
}

// ═══ INIT ON PAGE LOAD ═══
document.addEventListener('DOMContentLoaded', () => {
  initStripe();
  handlePaymentReturn();
});

// ═══════════════════════════════════════════
// BACKEND TEMPLATE (Node.js + Express)
// ═══════════════════════════════════════════
//
// Save as server.js and deploy to Render/Railway/Vercel:
//
// ```javascript
// const express = require('express');
// const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');
// const app = express();
// app.use(express.json());
//
// app.post('/api/create-checkout-session', async (req, res) => {
//   const { priceId, userId, email } = req.body;
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     line_items: [{ price: priceId, quantity: 1 }],
//     mode: 'subscription',
//     customer_email: email,
//     success_url: 'https://yourdomain.com/index.html?payment=success&session_id={CHECKOUT_SESSION_ID}',
//     cancel_url: 'https://yourdomain.com/index.html?payment=cancelled',
//     metadata: { userId }
//   });
//   res.json({ id: session.id });
// });
//
// app.post('/api/verify-payment', async (req, res) => {
//   const { sessionId } = req.body;
//   const session = await stripe.checkout.sessions.retrieve(sessionId);
//   res.json({
//     verified: true,
//     status: session.payment_status,
//     customerId: session.customer
//   });
// });
//
// app.listen(3001, () => console.log('Server on :3001'));
// ```
