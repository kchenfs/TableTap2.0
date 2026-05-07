'use client';
import React from 'react';
import MenuItem from './MenuItem';
import { MenuCategory } from '@/lib/types';

interface MenuSectionProps {
  category: MenuCategory;
  onItemSelect: (item: any) => void;
  delay?: number;
  'data-cat-id'?: string;  // ← ADD
}

export default function MenuSection({ category, onItemSelect, delay = 0, ...rest }: MenuSectionProps) {
  return (
    <div
      id={category.id}
      data-cat-id={category.id}   // ← ADD (hardcode it from category.id — simpler than forwarding)
      style={{ animationDelay: `${delay}ms` }}
      {...rest}
    >
      <div style={{
        padding: '20px 14px 6px',
        display: 'flex', alignItems: 'baseline', gap: '8px',
      }}>
        <span style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: '22px', fontWeight: 600, color: 'var(--text)',
        }}>
          {category.name}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
          {category.items.length}
        </span>
      </div>
      {category.items.map(item => (
        <MenuItem key={item.id} item={item} onSelect={onItemSelect} />
      ))}
    </div>
  );
}