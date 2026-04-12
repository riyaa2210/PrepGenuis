import React from 'react';

const variants = {
  green: 'bg-green-900/50 text-green-400 border border-green-700',
  red: 'bg-red-900/50 text-red-400 border border-red-700',
  yellow: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700',
  blue: 'bg-blue-900/50 text-blue-400 border border-blue-700',
  purple: 'bg-purple-900/50 text-purple-400 border border-purple-700',
  slate: 'bg-slate-700 text-slate-300 border border-slate-600',
};

export default function Badge({ children, variant = 'slate' }) {
  return (
    <span className={`badge ${variants[variant]}`}>{children}</span>
  );
}
