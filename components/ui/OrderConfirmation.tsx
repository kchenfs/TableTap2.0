'use client';
import React, { useEffect, useState } from 'react';
import { CartItem } from '@/lib/types';
import { X } from 'lucide-react';

interface OrderConfirmationProps {
  isOpen: boolean;
  cart: CartItem[];
  total: number;
  orderId: string;
  appMode: string;
  tableId: string;
  onDone: () => void;
}

export default function OrderConfirmation({
  isOpen, cart, total, orderId, appMode, tableId, onDone
}: OrderConfirmationProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => setAnimate(true), 50);
    else setAnimate(false);
  }, [isOpen]);

  if (!isOpen && !animate) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      zIndex: 300,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      opacity: isOpen ? 1 : 0,
      transform: isOpen ? 'scale(1)' : 'scale(0.97)',
      transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      overflowY: 'auto',
    }}>
      {/* Animated checkmark */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--gold-dim)',
        border: '2px solid var(--gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        animation: animate ? 'popIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
          stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Title */}
      <h2 style={{
        fontFamily: 'var(--font-cormorant), serif',
        fontSize: 30, fontWeight: 600, color: 'var(--text)',
        marginBottom: 6, textAlign: 'center',
      }}>
        {appMode === 'takeout'
          ? <>Payment <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Confirmed</em></>
          : <>Order <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Received!</em></>
        }
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 300, marginBottom: 20, textAlign: 'center' }}>
        {appMode === 'takeout'
          ? 'Your order is being prepared. Come pick it up soon!'
          : `On its way to the kitchen${tableId ? ` — Table ${tableId.replace('table-', '')}` : ''}.`
        }
      </p>

      {/* ETA */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: 'var(--text-2)', marginBottom: 24,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7dc48c', flexShrink: 0 }} />
        {appMode === 'takeout' ? 'Est. ready in 20–30 min' : 'Est. arrival 10–15 min'}
      </div>

      {/* Order card */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 18, overflow: 'hidden', marginBottom: 24,
      }}>
        {/* Card header */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 16, fontWeight: 600, color: 'var(--text)',
          }}>
            Order #{orderId}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 500, padding: '3px 9px',
            borderRadius: 999, background: 'rgba(80,160,100,0.12)',
            color: '#7dc48c', border: '1px solid rgba(80,160,100,0.22)',
          }}>
            {appMode === 'takeout' ? 'Paid' : 'Sent to Kitchen'}
          </span>
        </div>

        {/* Items */}
        {cart.map(ci => (
          <div key={ci.cartId} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            fontSize: 13,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-3)', marginRight: 4 }}>×{ci.quantity}</span>
              <span style={{ color: 'var(--text)' }}>{ci.menuItem.name}</span>
            </div>
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
              ${(ci.finalPrice * ci.quantity).toFixed(2)}
            </span>
          </div>
        ))}

        {/* Total */}
        <div style={{
          padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between',
          fontSize: 14, fontWeight: 600, color: 'var(--text)',
        }}>
          <span>Total incl. tax</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={onDone}
        style={{
          width: '100%', maxWidth: 360, height: 50, borderRadius: 16,
          background: 'var(--gold)', border: 'none',
          fontFamily: 'var(--font-outfit), sans-serif',
          fontSize: 15, fontWeight: 500, color: '#0e0e0e', cursor: 'pointer',
        }}
      >
        {appMode === 'takeout' ? 'Done' : 'Back to Menu'}
      </button>
    </div>
  );
}