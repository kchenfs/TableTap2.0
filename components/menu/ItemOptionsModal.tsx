'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { MenuItem, OptionGroup, OptionItem, CartItem } from '@/lib/types';
import MenuImage from '@/components/ui/MenuImage';

interface ItemOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onAddToCart: (customizedItem: CartItem) => void;
}

const ItemOptionsModal: React.FC<ItemOptionsModalProps> = ({ isOpen, onClose, item, onAddToCart }) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, OptionItem>>({});

  useEffect(() => {
    if (item?.options) {
      const defaults: Record<string, OptionItem> = {};
      item.options.forEach(group => {
        if (group.required && group.items.length > 0) defaults[group.name] = group.items[0];
      });
      setSelectedOptions(defaults);
    } else {
      setSelectedOptions({});
    }
  }, [item]);

  const finalPrice = useMemo(() => {
    if (!item) return 0;
    const optionsPrice = Object.values(selectedOptions).reduce((t, o) => t + (o?.priceModifier || 0), 0);
    return item.Price + optionsPrice;
  }, [item, selectedOptions]);

  if (!isOpen || !item) return null;

  const handleOptionChange = (group: OptionGroup, optionItem: OptionItem) => {
    setSelectedOptions(prev => {
      const next = { ...prev };
      if (group.type === 'ADD_ON' && next[group.name]?.name === optionItem.name) {
        delete next[group.name];
      } else {
        next[group.name] = optionItem;
      }
      return next;
    });
  };

  const handleAdd = () => {
    onAddToCart({
      cartId: `${item.id}-${JSON.stringify(selectedOptions)}`,
      menuItem: item, selectedOptions, quantity: 1, finalPrice,
    });
    onClose();
  };

  const hasOptions = item.options && item.options.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, backdropFilter: 'blur(6px)' }}
      />
      {/* Sheet — bottom on mobile, centered on desktop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        className="md:items-center">
        <div style={{
          background: 'var(--surface)', width: '100%', maxHeight: '92vh',
          borderRadius: '24px 24px 0 0', border: '1px solid var(--border2)', borderBottom: 'none',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }} className="md:rounded-2xl md:max-w-lg md:border-b-1 md:border md:max-h-[85vh]">

          {/* Drag handle (mobile only) */}
          <div className="md:hidden" style={{ width: '36px', height: '4px', background: 'var(--text-3)', borderRadius: '2px', margin: '10px auto 0', opacity: 0.35 }} />

          {/* Hero image (shown if item has a CloudFront URL) */}
          {item.imageUrl && (
            <div style={{ padding: '14px 18px 0', position: 'relative', height: '180px', borderRadius: '16px', overflow: 'hidden' }}>
              <MenuImage src={item.imageUrl} alt={item.name} size={180} borderRadius={16}
                style={{ width: '100%', height: '100%' }} />
            </div>
          )}

          {/* Header */}
          <div style={{ padding: '16px 18px 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
                  {item.name}
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.5 }}>{item.description}</p>
              </div>
              <button onClick={onClose} style={{
                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface2)',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0, marginLeft: '12px',
              }}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Options */}
          {hasOptions && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px', borderTop: '1px solid var(--border)' }}>
              {item.options.map(group => (
                <div key={group.name} style={{ marginBottom: '18px', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{group.name}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px',
                      background: group.required ? 'rgba(192,57,43,0.15)' : 'var(--gold-dim)',
                      color: group.required ? '#e07b6d' : 'var(--gold)',
                      border: group.required ? '1px solid rgba(192,57,43,0.2)' : '1px solid rgba(200,169,110,0.2)',
                    }}>
                      {group.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  {group.items.map(optionItem => {
                    const selected = selectedOptions[group.name]?.name === optionItem.name;
                    return (
                      <div
                        key={optionItem.name}
                        onClick={() => handleOptionChange(group, optionItem)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', borderRadius: '11px', background: 'var(--surface2)',
                          marginBottom: '7px', cursor: 'pointer',
                          border: selected ? '2px solid var(--gold)' : '2px solid transparent',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13.5px' }}>{optionItem.name}</div>
                          {optionItem.priceModifier !== 0 && (
                            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                              {optionItem.priceModifier > 0 ? '+' : ''}${optionItem.priceModifier.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div style={{
                          width: '20px', height: '20px',
                          borderRadius: group.type === 'VARIANT' ? '50%' : '4px',
                          border: selected ? `2px solid var(--gold)` : '2px solid var(--border2)',
                          background: selected ? 'var(--gold)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 0.15s',
                        }}>
                          {selected && (
                            <div style={{
                              width: group.type === 'VARIANT' ? '8px' : '10px',
                              height: group.type === 'VARIANT' ? '8px' : '7px',
                              borderRadius: group.type === 'VARIANT' ? '50%' : '0',
                              background: '#0e0e0e',
                              ...(group.type === 'ADD_ON' ? {
                                borderBottom: '2px solid #0e0e0e', borderRight: '2px solid #0e0e0e',
                                transform: 'rotate(45deg) translate(-1px, -2px)', background: 'transparent',
                              } : {}),
                            }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '14px 18px', borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0,
            background: 'var(--surface)',
          }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '26px', fontWeight: 600 }}>
              ${finalPrice.toFixed(2)}
            </div>
            <button
              onClick={handleAdd}
              style={{
                flex: 1, height: '50px', borderRadius: '14px', background: 'var(--gold)',
                border: 'none', fontFamily: 'var(--font-outfit), sans-serif', fontSize: '15px',
                fontWeight: 500, color: '#0e0e0e', cursor: 'pointer',
              }}
            >
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemOptionsModal;
