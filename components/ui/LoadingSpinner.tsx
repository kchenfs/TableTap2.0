import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
      <Loader2 className="animate-spin" size={24} style={{ color: 'var(--text-3)', marginRight: '10px' }} />
      <span style={{ color: 'var(--text-2)', fontSize: '14px' }}>Loading menu...</span>
    </div>
  );
}
