'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMenu } from '@/contexts/MenuContext';
import { useCartStore } from '@/stores/cartStore';
import Header from '@/components/ui/Header';
import CategoryNav from '@/components/ui/CategoryNav';
import MenuSection from '@/components/menu/MenuSection';
import StickyCartBar from '@/components/cart/StickyCartBar';
import CartSheet from '@/components/cart/CartSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ItemOptionsModal from '@/components/menu/ItemOptionsModal';
import { MenuItem, CartItem } from '@/lib/types';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { X } from 'lucide-react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/checkout/CheckoutForm';

declare global {
  interface Window {
    ChatBotUiLoader: any;
    ENV?: { TABLE_ID?: string };
  }
}

interface MomotaroAppProps {
  appMode: string;
  tableId: string;
}


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');


export default function MomotaroApp({ appMode, tableId }: MomotaroAppProps) {  const { isLoading, error, categories } = useMenu();
  const { cart, addItem, clearCart, orderNote, isCartOpen, openCart, closeCart } = useCartStore();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chatbot loader
  useEffect(() => {
    const CLOUDFRONT_URL = 'https://d2ibqiw1xziqq9.cloudfront.net';
    const init = async () => {
      if (!window.ChatBotUiLoader) { setTimeout(init, 100); return; }
      try {
        const file = appMode === 'takeout' ? 'lex-web-ui-loader-config-takeout.json' : 'lex-web-ui-loader-config-dinein.json';
        const res = await fetch(`${CLOUDFRONT_URL}/${file}`);
        if (!res.ok) throw new Error('Config load failed');
        const cfg = await res.json();
        const loader = new window.ChatBotUiLoader.IframeLoader({
          baseUrl: cfg.loader.baseUrl, shouldLoadMinDeps: true,
          shouldLoadConfigFromJsonFile: false, shouldLoadConfigFromEvent: false,
          shouldIgnoreConfigWhenEmbedded: false,
          iframeOrigin: cfg.iframe.iframeOrigin, iframeSrcPath: cfg.iframe.iframeSrcPath,
          shouldLoadIframeMinimized: cfg.iframe.shouldLoadIframeMinimized,
        });
        await loader.load(cfg);
      } catch (e) { console.error('[CHATBOT]', e); }
    };
    init();
  }, [appMode]);

  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories
      .map(cat => ({ ...cat, items: cat.items.filter(i => i.name.toLowerCase().includes(term) || i.description.toLowerCase().includes(term)) }))
      .filter(cat => cat.items.length > 0);
  }, [categories, searchTerm]);

  const handleScrollToCategory = (id: string) => {
    setActiveCategory(id);
    const el = document.getElementById(id);
    if (el) {
      const offset = 60 + 48 + 12;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (item: CartItem) => {
    addItem(item);
    setSelectedItem(null);
  };

  // NEW: Smart click handler
  const handleItemClick = (item: MenuItem) => {
    const hasOptions = item.options && item.options.length > 0;
    
    if (hasOptions) {
      // It has options (like beef vs veg gyoza) -> Open Modal
      setSelectedItem(item);
    } else {
      // No options needed -> Direct Add to Cart
      addItem({
        cartId: `${item.id}-default`,
        menuItem: item,
        selectedOptions: {},
        quantity: 1,
        finalPrice: Number(item.Price || 0)
      });
      
      // Trigger Toast
      setToastMessage(`${item.name} added`);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2400);
    }
  };

  const total = useMemo(() => cart.reduce((s, i) => s + i.finalPrice * i.quantity, 0), [cart]);

  useEffect(() => {
    if (appMode === 'takeout' && total > 0) {
      const url = process.env.NEXT_PUBLIC_PAYMENT_API_URL || '';
      axios.post(url, { amount: Math.round(total * 100), cart: cart.map(i => ({ id: i.menuItem.id, name: i.menuItem.name, quantity: i.quantity, price: i.finalPrice, selectedOptions: i.selectedOptions })) })
        .then(res => setClientSecret(res.data.clientSecret))
        .catch(err => console.error('Intent error:', err));
    } else {
      setClientSecret(null);
    }
  }, [total, cart, appMode]);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    if (appMode === 'takeout') {
      if (clientSecret) { setIsCheckoutModalOpen(true); closeCart(); }
      setIsCheckingOut(false);
    } else {
      try {
        const headers = { 'Content-Type': 'application/json', 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' };
        await axios.post(process.env.NEXT_PUBLIC_TABLE_TAP_URL || '', {
          items: cart.map(i => ({
            id: i.menuItem.id, name: i.menuItem.name, price: i.finalPrice, quantity: i.quantity,
            subtotal: i.finalPrice * i.quantity, location: i.menuItem.location,
            options: Object.entries(i.selectedOptions).map(([g, o]) => `${g}: ${o.name}`).join('; '),
          })),
          total, orderDate: new Date().toISOString(), order_id: nanoid(5).toUpperCase(),
          notes: orderNote || '', table: tableId, orderType: appMode,
        }, { headers });
        clearCart();
      } catch (e) {
        console.error('Checkout failed:', e);
      } finally {
        setIsCheckingOut(false);
      }
    }
  };

  const stripeOptions: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: { theme: 'night', labels: 'floating', variables: { colorPrimary: '#c8a96e', colorBackground: '#181818', colorText: '#f0ede8' } },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <CategoryNav categories={categories || []} activeCategory={activeCategory} onCategoryClick={handleScrollToCategory} />

      {/* Hero */}
      <div style={{ margin: '14px', borderRadius: '18px', background: 'var(--surface)', border: '1px solid var(--border2)', padding: '20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', position: 'relative' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', fontWeight: 600, lineHeight: 1.2, marginBottom: '5px' }}>
            {appMode === 'dine-in' ? (
              <>Welcome,{' '}<em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Table {tableId.replace('table-', '')}</em></>
            ) : (
              <>Takeout{' '}<em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Online Order</em></>
            )}
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-2)', fontWeight: 300 }}>
            Tap any dish &amp; add to your order
          </p>
        </div>
        {appMode === 'dine-in' && (
          <div style={{ flexShrink: 0, background: 'var(--gold-dim)', border: '1px solid rgba(200,169,110,0.25)', borderRadius: '12px', padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '30px', fontWeight: 600, color: 'var(--gold)', lineHeight: 1 }}>
              {tableId.replace('table-', '')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Table</div>
          </div>
        )}
      </div>

      {/* Menu */}
      <main style={{ padding: '0 14px 120px' }}>
        {isLoading && <LoadingSpinner />}
        {error ? <ErrorMessage error={error instanceof Error ? error : new Error('Unknown error')} /> : null}
        {!isLoading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat, i) => (
                <MenuSection key={cat.id} category={cat} onItemSelect={handleItemClick} delay={i * 100} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-2)' }}>
                No items found matching &ldquo;{searchTerm}&rdquo;
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sticky cart bar */}
      <StickyCartBar onOpenCart={openCart} />

      {/* Cart sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={closeCart}
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
        checkoutButtonText={appMode === 'takeout' ? 'Proceed to Checkout' : 'Send to Kitchen'}
      />

      {/* Item options modal */}
      {selectedItem && (
        <ItemOptionsModal
          isOpen={!!selectedItem}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Stripe checkout (takeout only) */}
      {isCheckoutModalOpen && clientSecret && appMode === 'takeout' && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, backdropFilter: 'blur(6px)' }} onClick={() => setIsCheckoutModalOpen(false)} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '460px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              <div style={{ flexShrink: 0, padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 600 }}>Payment Details</h2>
                <button onClick={() => setIsCheckoutModalOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
                  <X size={15} />
                </button>
              </div>
              <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                <Elements stripe={stripePromise} options={stripeOptions}>
                  <CheckoutForm cart={cart} total={total} orderNote={orderNote} />
                </Elements>
              </div>
            </div>
          </div>
        </>
      )}
      {/* NEW: Toast Notification */}
      <div style={{
        position: 'fixed',
        bottom: '80px', /* Just above your sticky cart bar */
        left: '50%',
        transform: toastMessage ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(40px)',
        opacity: toastMessage ? 1 : 0,
        pointerEvents: 'none',
        background: 'var(--surface2)',
        border: '1px solid var(--border2)',
        borderRadius: '10px',
        padding: '8px 14px',
        fontSize: '12px',
        color: 'var(--text)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.25s',
        whiteSpace: 'nowrap'
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)' }} />
        {toastMessage}
      </div>

    </div>
  );
}
