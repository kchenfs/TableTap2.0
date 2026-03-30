'use client';
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function Header({ searchTerm, onSearchChange }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        background: 'rgba(14,14,14,0.94)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Mobile: logo centered */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }} className="md:static md:transform-none">
          {/* Logo image — replace src with your actual logo path in /public */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 600, color: '#0e0e0e',
          }}>
            桃
          </div>
          {/* Desktop: show brand name */}
          <span className="hidden md:block" style={{
            fontFamily: 'var(--font-cormorant), serif', fontSize: '19px', fontWeight: 600,
            color: 'var(--text)', whiteSpace: 'nowrap',
          }}>
            Momotaro <span style={{ color: 'var(--gold)' }}>Sushi</span>
          </span>
        </div>

        {/* Right: search button */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'var(--surface)', border: '1px solid var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-2)',
            }}
          >
            {searchOpen ? <X size={15} /> : <Search size={15} />}
          </button>
        </div>
      </header>

      {/* Search bar */}
      {searchOpen && (
        <div style={{ padding: '10px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              type="search"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              style={{
                width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: '12px', padding: '10px 12px 10px 38px',
                fontFamily: 'var(--font-outfit), sans-serif', fontSize: '14px', color: 'var(--text)', outline: 'none',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
