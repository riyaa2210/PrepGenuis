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

  // ⌘K shortcut
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
        style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}
      >
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
          <rect y="0"   width="13" height="1.5" rx="0.75" fill="currentColor" />
          <rect y="4.25" width="9"  height="1.5" rx="0.75" fill="currentColor" />
          <rect y="8.5"  width="13" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      </button>

      {/* Breadcrumb — varied weight creates hierarchy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.857rem' }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/</span>}
            <span style={{
              color: i === crumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: i === crumbs.length - 1 ? 500 : 400,
            }}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <svg style={{
          position: 'absolute', left: 9, top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          className="input"
          style={{ paddingLeft: 28, paddingRight: 36, height: 28, width: 188, fontSize: '0.786rem' }}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <kbd style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)' }}>
          ⌘K
        </kbd>
      </div>

      {/* Score indicator — only when meaningful */}
      {user?.totalInterviews > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 99,
          padding: '3px 9px 3px 7px',
          fontSize: '0.75rem',
          gap: 5,
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: user.averageScore >= 7 ? 'var(--green)' : user.averageScore >= 4 ? 'var(--yellow)' : 'var(--red)',
          }} />
          <span style={{ color: 'var(--text-tertiary)' }}>avg</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }} className="mono">
            {user.averageScore?.toFixed(1)}
          </span>
        </div>
      )}

      {/* New interview */}
      <Link to="/interview/setup" className="btn btn-primary btn-sm">
        + Interview
      </Link>
    </header>
  );
}
