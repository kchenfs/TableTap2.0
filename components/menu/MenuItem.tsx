'use client';
import React from 'react';
import { Plus } from 'lucide-react';
import { MenuItem as MenuItemType } from '@/lib/types';
import MenuImage from '@/components/ui/MenuImage';

interface MenuItemProps {
  item: MenuItemType;
  onSelect: (item: MenuItemType) => void;
}

export default function MenuItem({ item, onSelect }: MenuItemProps) {
  const hasPriceAffectingOptions = React.useMemo(() => {
    if (!item.options || !Array.isArray(item.options)) return false;
    return item.options.some(g => g.items && g.items.some(o => (o.priceModifier || 0) !== 0));
  }, [item.options]);

  return (
    <div
      onClick={() => onSelect(item)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 0', borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      <MenuImage src={item.imageUrl} alt={item.name} size={76} borderRadius={12} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '3px', lineHeight: 1.3 }}>
          {item.name}
        </div>
        <div style={{
          fontSize: '12px', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: '8px',
        }}>
          {item.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
            ${Number(item.Price || 0).toFixed(2)}
            {hasPriceAffectingOptions && <span style={{ fontSize: '10px', fontWeight: 300, color: 'var(--text-3)', marginLeft: '1px' }}>+</span>}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'var(--surface2)', border: '1px solid var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0,
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
