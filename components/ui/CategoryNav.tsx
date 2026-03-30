'use client';
import React from 'react';
import { MenuCategory } from '@/lib/types';

interface CategoryNavProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onCategoryClick: (id: string) => void;
}

export default function CategoryNav({ categories, activeCategory, onCategoryClick }: CategoryNavProps) {
  return (
    <nav style={{
      position: 'sticky', top: '60px', zIndex: 90,
      background: 'rgba(14,14,14,0.94)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)', height: '48px',
      display: 'flex', alignItems: 'center',
    }}>
      <div className="cat-scrollbar" style={{ display: 'flex', gap: '2px', padding: '0 12px', overflowX: 'auto', width: '100%' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryClick(cat.id)}
            style={{
              flexShrink: 0, padding: '5px 13px', borderRadius: '999px',
              border: activeCategory === cat.id ? '1px solid rgba(200,169,110,0.35)' : '1px solid transparent',
              background: activeCategory === cat.id ? 'var(--gold-dim)' : 'transparent',
              fontFamily: 'var(--font-outfit), sans-serif', fontSize: '13px',
              fontWeight: activeCategory === cat.id ? 500 : 400,
              color: activeCategory === cat.id ? 'var(--gold)' : 'var(--text-2)',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </nav>
  );
}
