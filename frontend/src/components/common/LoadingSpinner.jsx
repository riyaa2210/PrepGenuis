import React from 'react';

export default function LoadingSpinner({ fullScreen = false, size = 'md', text = '' }) {
  const sizes = { sm: 14, md: 24, lg: 36 };
  const s = sizes[size] || 24;

  const spinner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
        style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="9" stroke="var(--border-strong)" strokeWidth="2.5" />
        <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {text && <span style={{ fontSize: '0.857rem', color: 'var(--text-muted)' }}>{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
