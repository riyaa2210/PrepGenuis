import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const NAV_GROUPS = [
  {
    items: [
      { to: '/dashboard',       icon: '⊞', label: 'Dashboard' },
      { to: '/interview/setup', icon: '▷', label: 'New Interview' },
      { to: '/reports',         icon: '≡', label: 'Reports' },
      { to: '/progress',        icon: '↗', label: 'Progress' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/resume',       icon: '◫', label: 'Resume' },
      { to: '/intelligence', icon: '◈', label: 'Intelligence' },
      { to: '/coach',        icon: '◎', label: 'AI Coach' },
    ],
  },
  {
    label: 'Recruiter',
    role: 'recruiter',
    items: [
      { to: '/recruiter',         icon: '◷', label: 'Candidates' },
      { to: '/recruiter/ranking', icon: '◈', label: 'Rankings' },
    ],
  },
];

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const w = collapsed ? 58 : 240;

  return (
    <aside className="sidebar" style={{ width: w, transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)' }}>

      {/* ── Logo ── */}
      <div style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 16px' : '0 16px 0 18px',
        borderBottom: '1px solid var(--border)',
        gap: 10,
        flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(95,98,232,0.08) 0%, transparent 60%)',
      }}>
        <div style={{
          width: 26, height: 26,
          background: 'linear-gradient(135deg, var(--accent) 0%, #7c5cfc 100%)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 0 1px rgba(95,98,232,0.5), 0 3px 10px rgba(95,98,232,0.4)',
        }}>◈</div>
        {!collapsed && (
          <span style={{
            fontWeight: 700,
            fontSize: '1.032rem',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #e0e0ff 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            PrepGenius
          </span>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '12px 8px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {NAV_GROUPS.map((group, gi) => {
          if (group.role && group.role !== user?.role) return null;
          return (
            <div key={gi} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 10 : 0 }}>
              {group.label && !collapsed && (
                <div style={{
                  fontSize: '0.774rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  padding: '8px 10px 4px',
                }}>
                  {group.label}
                </div>
              )}
              {group.label && collapsed && <div style={{ height: 8 }} />}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  data-tip={collapsed ? item.label : undefined}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* ── User footer with visible sign-out ── */}
      <div style={{
        padding: '10px 8px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 100%)',
      }}>
        {!collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* User info row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '8px 10px',
              borderRadius: 'var(--r-md)',
              background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-overlay) 100%)',
              border: '1px solid var(--border)',
            }}>
              <Avatar name={user?.name} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="truncate" style={{ fontSize: '0.903rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.806rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 1 }}>
                  {user?.role}
                </div>
              </div>
            </div>

            {/* Sign out — full-width, clearly visible */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '9px 14px',
                borderRadius: 'var(--r-sm)',
                background: 'linear-gradient(135deg, rgba(248,113,113,0.12) 0%, rgba(248,113,113,0.06) 100%)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: 'var(--red)',
                fontSize: '0.903rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all var(--t-fast)',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(248,113,113,0.22) 0%, rgba(248,113,113,0.12) 100%)';
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(248,113,113,0.12) 0%, rgba(248,113,113,0.06) 100%)';
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M9.5 9.5L13 7l-3.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Sign out
            </button>
          </div>
        ) : (
          /* Collapsed: just avatar + sign-out icon */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Avatar name={user?.name} size={28} />
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--r-sm)',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.25)',
                color: 'var(--red)',
                cursor: 'pointer',
                transition: 'all var(--t-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M9.5 9.5L13 7l-3.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
