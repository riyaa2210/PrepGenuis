import React from 'react';

export default function ScoreBar({ label, score, max = 10 }) {
  const pct = Math.round((score / max) * 100);
  const color =
    score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300 w-36 shrink-0">{label}</span>
      <div className="score-bar-track flex-1">
        <div className={`score-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-200 w-12 text-right">
        {score}/{max}
      </span>
    </div>
  );
}
