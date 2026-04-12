import React from 'react';

const variantMap = {
  green:  'badge-green',
  red:    'badge-red',
  yellow: 'badge-yellow',
  blue:   'badge-blue',
  purple: 'badge-purple',
  gray:   'badge-gray',
};

export default function Badge({ children, variant = 'gray', dot = false }) {
  const cls = variantMap[variant] || 'badge-gray';
  const dotColors = {
    green: 'var(--green)', red: 'var(--red)', yellow: 'var(--yellow)',
    blue: 'var(--blue)', purple: '#a5b4fc', gray: 'var(--text-muted)',
  };
  return (
    <span className={`badge ${cls}`}>
      {dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: dotColors[variant] || 'var(--text-muted)',
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}
