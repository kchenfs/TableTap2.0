'use client';
import React, { useState } from 'react';
import Image from 'next/image';

interface MenuImageProps {
  src?: string;
  alt: string;
  /** Square thumbnail size in px. Pass 0 to use fill mode (parent must be position:relative with explicit height). */
  size: number;
  borderRadius?: number;
  fallback?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a CloudFront-hosted menu image with graceful emoji fallback.
 * - size > 0  → fixed square thumbnail (menu list, cart rows)
 * - size = 0  → fill mode for full-width hero (item modal)
 */
export default function MenuImage({ src, alt, size, borderRadius = 12, fallback = '🍣', style }: MenuImageProps) {
  const [errored, setErrored] = useState(false);
  const isFill = size === 0;

  const containerStyle: React.CSSProperties = {
    borderRadius: `${borderRadius}px`,
    overflow: 'hidden',
    background: 'var(--surface2)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...(isFill
      ? { width: '100%', height: '100%' }
      : { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.38)}px` }
    ),
    ...style,
  };

  if (!src || errored) {
    return (
      <div style={containerStyle}>
        {!isFill && <span>{fallback}</span>}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Image
        src={src}
        alt={alt}
        fill={isFill}
        {...(!isFill ? { width: size, height: size } : {})}
        sizes={isFill ? '100vw' : `${size}px`}
        style={{ objectFit: 'cover' }}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
