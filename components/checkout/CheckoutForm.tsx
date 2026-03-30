'use client';
import React from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  ExpressCheckoutElement,
} from '@stripe/react-stripe-js';
import { CartItem } from '@/lib/types';
import { nanoid } from 'nanoid';

interface CheckoutFormProps {
  cart: CartItem[];
  total: number;
  orderNote: string;
}

export default function CheckoutForm({ cart, total, orderNote }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!stripe) return;
    const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');
    if (!clientSecret) return;
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded': setMessage('Payment succeeded!'); break;
        case 'processing': setMessage('Your payment is processing.'); break;
        case 'requires_payment_method': setMessage('Your payment was not successful, please try again.'); break;
        default: setMessage('Something went wrong.');
      }
    });
  }, [stripe]);

  const createPaymentIntent = async (customerDetails?: { email?: string; phone?: string }) => {
    try {
      const paymentApiUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL;
      const orderId = nanoid(5).toUpperCase();
      const res = await fetch(paymentApiUrl || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          metadata: { order_id: orderId },
          notes: orderNote,
          customerDetails: {
            email: customerDetails?.email || undefined,
            phone: customerDetails?.phone || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.clientSecret;
    } catch (error: any) {
      setMessage(error.message || 'Failed to initialize payment.');
      setIsLoading(false);
      return null;
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsLoading(true);
    const { error: submitError } = await elements.submit();
    if (submitError) { setMessage(submitError.message ?? null); setIsLoading(false); return; }
    const clientSecret = await createPaymentIntent({ email, phone });
    if (clientSecret) {
      const { error } = await stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url: `${window.location.origin}/completion` } });
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An unexpected error occurred.');
      } else {
        setMessage('An unexpected error occurred.');
      }
    }
    setIsLoading(false);
  };

  const handleExpressConfirm = async () => {
    if (!stripe || !elements) return;
    setIsLoading(true);
    const clientSecret = await createPaymentIntent();
    if (clientSecret) {
      const { error } = await stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url: `${window.location.origin}/completion` } });
      if (error) setMessage(error.message || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  };

  const inputStyle = {
    display: 'block', width: '100%', borderRadius: '12px', border: '0',
    background: 'var(--surface2)', padding: '10px 16px', fontSize: '14px',
    color: 'var(--text)', outline: 'none', boxShadow: '0 0 0 1px var(--border2)',
    fontFamily: 'var(--font-outfit), sans-serif',
  };

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '6px' };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', marginBottom: '14px' }}>Express Checkout</h3>
      <ExpressCheckoutElement onConfirm={handleExpressConfirm} options={{ paymentMethods: { googlePay: 'always', applePay: 'always', link: 'never' }, emailRequired: true }} />

      <div style={{ position: 'relative', margin: '20px 0' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', height: '1px', background: 'var(--border2)' }} />
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <span style={{ background: 'var(--surface)', padding: '0 10px', fontSize: '13px', color: 'var(--text-2)' }}>Or pay with card</span>
        </div>
      </div>

      <form onSubmit={handleManualSubmit}>
        <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', marginBottom: '14px' }}>Payment Details</h3>
        <PaymentElement id="payment-element" options={{ fields: { name: 'auto' }, layout: { type: 'tabs', defaultCollapsed: false } }} />

        <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', margin: '20px 0 14px' }}>Contact Info <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 300 }}>(Optional)</span></h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Email for Receipt</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane.doe@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
          </div>
        </div>

        <button
          disabled={isLoading || !stripe || !elements}
          style={{
            width: '100%', marginTop: '20px', height: '50px', borderRadius: '14px',
            background: 'var(--gold)', border: 'none', fontFamily: 'var(--font-outfit), sans-serif',
            fontSize: '15px', fontWeight: 500, color: '#0e0e0e', cursor: 'pointer',
            opacity: isLoading || !stripe ? 0.5 : 1,
          }}
        >
          {isLoading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
        </button>
        {message && <div style={{ textAlign: 'center', color: '#e07b6d', marginTop: '14px', fontSize: '13.5px' }}>{message}</div>}
      </form>
    </div>
  );
}
