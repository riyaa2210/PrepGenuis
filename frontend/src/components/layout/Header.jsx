import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CRUMBS = {
  '/dashboard':         ['Dashboard'],
  '/interview/setup':   ['Interviews', 'New'],
  '/reports':           ['Reports'],
  '/progress':          ['Progress'],
  '/resume':            ['Resume'],
  '/intelligence':      ['Tools', 'Intelligence'],
  '/coach':             ['Tools', 'AI Coach'],
  '/recruiter':         ['Recruiter', 'Candidates'],
  '/recruiter/ranking': ['Recruiter', 'Rankings'],
};

export default function Header({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const crumbs = CRUMBS[location.pathname] || ['—'];

  return (
    <header className="topbar">
      {/* Collapse toggle */}
      <button
        className="btn btn-ghost btn-icon btn-sm"
        onClick={onToggle}
        style={{ flexShrink: 0, color: 'var(--text-secondary)' }}
      >
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <rect y="0"    width="15" height="1.6" rx="0.8" fill="currentColor" />
          <rect y="4.7"  width="10" height="1.6" rx="0.8" fill="currentColor" />
          <rect y="9.4"  width="15" height="1.6" rx="0.8" fill="currentColor" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.968rem' }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.839rem' }}>/</span>}
            <span style={{
              color: i === crumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
            }}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <svg style={{
          position: 'absolute', left: 10, top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          className="input"
          style={{ paddingLeft: 32, paddingRight: 40, height: 32, width: 200, fontSize: '0.903rem' }}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <kbd style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.774rem' }}>
          ⌘K
        </kbd>
      </div>

      {/* Score pill — gradient */}
      {user?.totalInterviews > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-overlay) 100%)',
          border: '1px solid var(--border-strong)',
          borderRadius: 99,
          padding: '4px 12px 4px 8px',
          fontSize: '0.871rem',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: user.averageScore >= 7
              ? 'linear-gradient(135deg, #34d399, #10b981)'
              : user.averageScore >= 4
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
              : 'linear-gradient(135deg, #f87171, #ef4444)',
            boxShadow: user.averageScore >= 7
              ? '0 0 6px rgba(52,211,153,0.6)'
              : user.averageScore >= 4
              ? '0 0 6px rgba(251,191,36,0.6)'
              : '0 0 6px rgba(248,113,113,0.6)',
          }} />
          <span style={{ color: 'var(--text-tertiary)' }}>avg</span>
          <span style={{
            fontWeight: 700,
            background: user.averageScore >= 7
              ? 'linear-gradient(135deg, #34d399, #10b981)'
              : user.averageScore >= 4
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
              : 'linear-gradient(135deg, #f87171, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }} className="mono">
            {user.averageScore?.toFixed(1)}
          </span>
        </div>
      )}

      {/* New interview — gradient button */}
      <Link to="/interview/setup" className="btn btn-primary btn-sm">
        + Interview
      </Link>
    </header>
  );
}
