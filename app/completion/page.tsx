'use client';
import React, { useState, useEffect } from 'react';
import { useStripe, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CheckCircle, AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function CompletionInner() {
  const stripe = useStripe();
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) return;
    const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');
    if (!clientSecret) return;
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      setStatus(paymentIntent?.status || null);
      switch (paymentIntent?.status) {
        case 'succeeded': setMessage('Payment succeeded!'); break;
        case 'processing': setMessage('Your payment is processing.'); break;
        case 'requires_payment_method': setMessage('Your payment was not successful, please try again.'); break;
        default: setMessage('Something went wrong.');
      }
    });
  }, [stripe]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border2)', textAlign: 'center', maxWidth: '360px', width: '100%', margin: '0 16px' }}>
        {status === 'succeeded'
          ? <CheckCircle size={48} style={{ color: '#6bb88c', margin: '0 auto 16px' }} />
          : <AlertCircle size={48} style={{ color: '#e07b6d', margin: '0 auto 16px' }} />
        }
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>
          {message || 'Loading...'}
        </h1>
        <a href="/" style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: '14px' }}>
          Back to Menu
        </a>
      </div>
    </div>
  );
}

export default function CompletionPage() {
  return (
    <Elements stripe={stripePromise}>
      <CompletionInner />
    </Elements>
  );
}
