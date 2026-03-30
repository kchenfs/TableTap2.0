'use client';
import React from 'react';
import { useCartStore } from '@/stores/cartStore';

interface StickyCartBarProps {
  onOpenCart: () => void;
}

export default function StickyCartBar({ onOpenCart }: StickyCartBarProps) {
  const cart = useCartStore((s) => s.cart);
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.finalPrice * i.quantity, 0);

  if (!count) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80,
      padding: '10px 14px', background: 'rgba(14,14,14,0.98)',
      borderTop: '1px solid var(--border2)',
    }}>
      <button
        onClick={onOpenCart}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'var(--gold)', borderRadius: '14px',
          padding: '0 16px', height: '50px', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
            padding: '2px 10px', fontSize: '12px', fontWeight: 600, color: '#0e0e0e',
          }}>
            {count}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#0e0e0e' }}>View Order</span>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0e0e0e' }}>
          ${subtotal.toFixed(2)}
        </span>
      </button>
    </div>
  );
}
