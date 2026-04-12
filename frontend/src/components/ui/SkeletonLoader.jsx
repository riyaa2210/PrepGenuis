import React from 'react';

export function Skeleton({ width = '100%', height = 14, radius = 4 }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: radius, flexShrink: 0 }} />
  );
}

export function SkeletonStat() {
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <Skeleton width="38%" height={10} />
      <Skeleton width="52%" height={26} />
      <Skeleton width="30%" height={9} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 11,
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <Skeleton width={7} height={7} radius={99} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Skeleton width="48%" height={11} />
        <Skeleton width="28%" height={9} />
      </div>
      <Skeleton width={32} height={14} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Skeleton width={28} height={28} radius={6} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Skeleton width="55%" height={11} />
          <Skeleton width="35%" height={9} />
        </div>
      </div>
      <Skeleton height={9} />
      <Skeleton width="75%" height={9} />
    </div>
  );
}

export default Skeleton;
