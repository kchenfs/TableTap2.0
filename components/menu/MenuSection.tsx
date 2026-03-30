'use client';
import React from 'react';
import MenuItem from './MenuItem';
import { MenuCategory, MenuItem as MenuItemType } from '@/lib/types';

interface MenuSectionProps {
  category: MenuCategory;
  onItemSelect: (item: MenuItemType) => void;
  delay: number;
}

export default function MenuSection({ category, onItemSelect, delay }: MenuSectionProps) {
  if (!category || !category.items) return null;
  return (
    <section id={category.id}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '8px',
        marginBottom: '4px', paddingTop: '8px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-cormorant), serif', fontSize: '20px',
          fontWeight: 600, color: 'var(--text)',
        }}>
          {category.name}
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 300 }}>
          {category.items.length} items
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>
      {category.items.map((item) => (
        <MenuItem key={item.id} item={item} onSelect={onItemSelect} />
      ))}
    </section>
  );
}
