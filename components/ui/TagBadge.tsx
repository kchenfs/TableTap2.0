// components/ui/TagBadge.tsx
import React from 'react';

const TAG_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'gf':                { label: 'GF',         color: '#7dc48c', bg: 'rgba(80,160,100,0.12)',  border: 'rgba(80,160,100,0.25)' },
  'vegan':             { label: 'Vegan',       color: '#7dc48c', bg: 'rgba(80,160,100,0.12)',  border: 'rgba(80,160,100,0.25)' },
  'vegetarian':        { label: 'Vegetarian',  color: '#7dc48c', bg: 'rgba(80,160,100,0.12)',  border: 'rgba(80,160,100,0.25)' },
  'vegetarian-option': { label: 'Veg Option',  color: '#c8a96e', bg: 'rgba(200,169,110,0.12)', border: 'rgba(200,169,110,0.25)' },
  'spicy':             { label: 'Spicy',       color: '#e07b6d', bg: 'rgba(192,57,43,0.12)',   border: 'rgba(192,57,43,0.25)' },
  'contains-nuts':     { label: 'Nuts',        color: '#e0b96d', bg: 'rgba(192,140,43,0.12)',  border: 'rgba(192,140,43,0.25)' },
  'halal':             { label: 'Halal',       color: '#c8a96e', bg: 'rgba(200,169,110,0.12)', border: 'rgba(200,169,110,0.25)' },
};

interface TagBadgeProps {
  tag: string;
}

export default function TagBadge({ tag }: TagBadgeProps) {
  const cfg = TAG_CONFIG[tag.toLowerCase()];
  if (!cfg) return null; // unknown tags are silently ignored

  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 500,
      padding: '2px 6px',
      borderRadius: '4px',
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
      letterSpacing: '0.2px',
    }}>
      {cfg.label}
    </span>
  );
}