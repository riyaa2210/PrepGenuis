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

  return (
    <aside className="sidebar" style={{ width: collapsed ? 52 : 228, transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)' }}>

      {/* Logo — asymmetric padding */}
      <div style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 14px' : '0 14px 0 16px',
        borderBottom: '1px solid var(--border)',
        gap: 9,
        flexShrink: 0,
      }}>
        <div style={{
          width: 22, height: 22,
          background: 'var(--accent)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 0 1px rgba(95,98,232,0.5), 0 2px 6px rgba(95,98,232,0.3)',
        }}>◈</div>
        {!collapsed && (
          <span style={{
            fontWeight: 600,
            fontSize: '0.929rem',
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
            /* Slightly off-baseline — intentional */
            marginTop: 1,
          }}>
            PrepGenius
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        /* Asymmetric padding */
        padding: '10px 7px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}>
        {NAV_GROUPS.map((group, gi) => {
          if (group.role && group.role !== user?.role) return null;
          return (
            <div key={gi} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 8 : 0 }}>
              {group.label && !collapsed && (
                <div style={{
                  fontSize: '0.714rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  /* Slightly more left padding than nav items */
                  padding: '8px 10px 3px',
                }}>
                  {group.label}
                </div>
              )}
              {group.label && collapsed && <div style={{ height: 6 }} />}
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

      {/* User footer */}
      <div style={{
        padding: collapsed ? '8px 7px' : '8px 7px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {!collapsed ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            borderRadius: 'var(--r-sm)',
            transition: 'background var(--t-fast)',
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Avatar name={user?.name} size={24} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="truncate" style={{ fontSize: '0.786rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.714rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 1 }}>
                {user?.role}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon btn-xs"
              onClick={handleLogout}
              title="Sign out"
              style={{ flexShrink: 0, opacity: 0.6 }}
            >
              ⎋
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <Avatar name={user?.name} size={24} />
          </div>
        )}
      </div>
    </aside>
  );
}
