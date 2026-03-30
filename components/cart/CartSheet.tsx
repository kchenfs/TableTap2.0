'use client';
import React from 'react';
import { X, Minus, Plus } from 'lucide-react';
import MenuImage from '@/components/ui/MenuImage';
import { useCartStore } from '@/stores/cartStore';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => Promise<void>;
  isCheckingOut?: boolean;
  checkoutButtonText: string;
}

export default function CartSheet({ isOpen, onClose, onCheckout, isCheckingOut = false, checkoutButtonText }: CartSheetProps) {
  const { cart, updateQuantity, removeItem, orderNote, setOrderNote } = useCartStore();

  const TAX_RATE = 0.13;
  const subtotal = cart.reduce((s, i) => s + i.finalPrice * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(4px)' }}
      />
      {/* Sheet */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        className="md:items-center">
        <div style={{
          background: 'var(--surface)', width: '100%', maxHeight: '92vh',
          borderRadius: '24px 24px 0 0', border: '1px solid var(--border2)', borderBottom: 'none',
          display: 'flex', flexDirection: 'column',
        }} className="md:rounded-2xl md:max-w-md md:max-h-[85vh] md:border">

          {/* Drag handle */}
          <div className="md:hidden" style={{ width: '36px', height: '4px', background: 'var(--text-3)', borderRadius: '2px', margin: '10px auto 0', opacity: 0.35 }} />

          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600 }}>Your Order</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                {cart.reduce((s, i) => s + i.quantity, 0)} item{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
              </span>
            </div>
            <button onClick={onClose} style={{
              width: '30px', height: '30px', borderRadius: '50%', background: 'var(--surface2)',
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)',
            }}>
              <X size={15} />
            </button>
          </div>

          {/* Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', color: 'var(--text-3)', gap: '10px' }}>
                <div style={{ fontSize: '40px', opacity: 0.3 }}>🛒</div>
                <p style={{ fontSize: '13px', fontWeight: 300 }}>Your cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.cartId} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <MenuImage src={item.menuItem.imageUrl} alt={item.menuItem.name} size={48} borderRadius={10} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 500, marginBottom: '2px' }}>{item.menuItem.name}</div>
                    {Object.entries(item.selectedOptions).length > 0 && (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-3)', fontWeight: 300, marginBottom: '6px' }}>
                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v.name}`).join(' · ')}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface2)', borderRadius: '999px', padding: '3px' }}>
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                          disabled={isCheckingOut}
                          style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg)', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                          disabled={isCheckingOut}
                          style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg)', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 600 }}>${(item.finalPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-2)', marginBottom: '4px' }}>
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-2)', marginBottom: '4px' }}>
                  <span>Tax (13%)</span><span>${tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 600, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '6px' }}>
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Special instructions for the kitchen..."
                rows={2}
                disabled={isCheckingOut}
                style={{
                  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: '11px', padding: '10px 13px', fontFamily: 'var(--font-outfit), sans-serif',
                  fontSize: '12.5px', color: 'var(--text)', resize: 'none', outline: 'none', marginBottom: '12px',
                }}
              />
              <button
                onClick={onCheckout}
                disabled={isCheckingOut}
                style={{
                  width: '100%', height: '50px', borderRadius: '14px', background: 'var(--gold)',
                  border: 'none', fontFamily: 'var(--font-outfit), sans-serif', fontSize: '15px',
                  fontWeight: 500, color: '#0e0e0e', cursor: isCheckingOut ? 'not-allowed' : 'pointer',
                  opacity: isCheckingOut ? 0.6 : 1,
                }}
              >
                {isCheckingOut ? 'Processing...' : checkoutButtonText}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
