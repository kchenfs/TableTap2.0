import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  error: Error | null;
  onRetry?: () => void;
}

export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)',
        borderRadius: '14px', padding: '24px', maxWidth: '400px', width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <AlertCircle size={20} style={{ color: '#e07b6d' }} />
          <span style={{ color: '#e07b6d', fontWeight: 500 }}>Error Loading Menu</span>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: '14px', marginBottom: '16px' }}>
          {error?.message || 'Failed to load menu. Please try again.'}
        </p>
        {onRetry && (
          <button onClick={onRetry} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            borderRadius: '10px', background: 'rgba(192,57,43,0.2)', border: 'none',
            color: '#e07b6d', cursor: 'pointer', fontSize: '13px',
          }}>
            <RefreshCw size={14} /> Try Again
          </button>
        )}
      </div>
    </div>
  );
}
