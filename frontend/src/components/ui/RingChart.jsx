import React from 'react';

export default function RingChart({ score, max = 10, size = 64, strokeWidth = 5, label }) {
  const r      = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * r;
  const pct    = Math.max(0, Math.min(1, score / max));
  const offset = circ * (1 - pct);
  const color  = pct >= 0.7 ? 'var(--green)' : pct >= 0.4 ? 'var(--yellow)' : 'var(--red)';
  const cx     = size / 2;
  const fs     = size * 0.21;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <circle className="ring-track" cx={cx} cy={cx} r={r} strokeWidth={strokeWidth} />
        <circle
          className="ring-fill"
          cx={cx} cy={cx} r={r}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
        />
        <text
          x={cx} y={cx}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: `rotate(90deg)`,
            transformOrigin: `${cx}px ${cx}px`,
            fill: 'var(--text-primary)',
            fontSize: fs,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </text>
      </svg>
      {label && (
        <span style={{
          fontSize: '0.714rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          letterSpacing: '0.01em',
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
