import React from 'react';

export default function ScoreBar({ label, score, max = 10 }) {
  const pct   = Math.max(0, Math.min(100, Math.round((score / max) * 100)));
  const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      {label && (
        <span style={{
          fontSize: '0.786rem',
          color: 'var(--text-tertiary)',
          width: 110,
          flexShrink: 0,
          letterSpacing: '-0.01em',
        }}>
          {label}
        </span>
      )}
      <div className="score-track" style={{ flex: 1 }}>
        <div className="score-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{
        fontSize: '0.786rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        width: 32,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}>
        {score}/{max}
      </span>
    </div>
  );
}
