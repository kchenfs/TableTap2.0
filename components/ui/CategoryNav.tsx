'use client';
import React from 'react';

interface CategoryNavProps {
  categories: { id: string; name: string }[];
  activeCategory: string | null;
  onCategoryClick: (id: string) => void;
  navRef?: React.RefObject<HTMLDivElement>;  // ← ADD
}

export default function CategoryNav({ categories, activeCategory, onCategoryClick, navRef }: CategoryNavProps) {
  return (
    <div
      ref={navRef}   // ← ADD
      className="cat-scrollbar"
      style={{
        display: 'flex', gap: '6px', padding: '0 14px',
        overflowX: 'auto', height: '48px', alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: '60px', zIndex: 99,
        background: 'var(--bg)',
      }}
    >
      {categories.map(cat => (
        <button
          key={cat.id}
          data-pill={cat.id}   // ← ADD
          onClick={() => onCategoryClick(cat.id)}
          style={{
            flexShrink: 0, height: '28px', padding: '0 14px',
            borderRadius: '999px', fontSize: '12px', fontWeight: 500,
            cursor: 'pointer', whiteSpace: 'nowrap', border: 'none',
            background: activeCategory === cat.id ? 'var(--gold)' : 'var(--surface2)',
            color: activeCategory === cat.id ? '#0e0e0e' : 'var(--text-2)',
            outline: activeCategory === cat.id ? 'none' : '1px solid var(--border2)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}