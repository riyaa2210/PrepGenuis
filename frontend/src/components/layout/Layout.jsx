import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Auto-collapse on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => { if (e.matches) setCollapsed(true); };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 49,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar — fixed on mobile, grid on desktop */}
      <div style={{
        position: window.innerWidth <= 768 ? 'fixed' : 'relative',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transform: window.innerWidth <= 768
          ? mobileOpen ? 'translateX(0)' : 'translateX(-100%)'
          : 'none',
        transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
      }}>
        <Sidebar collapsed={window.innerWidth <= 768 ? false : collapsed} />
      </div>

      {/* Main area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <Header collapsed={collapsed} onToggle={toggle} />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-base)',
          padding: 'clamp(16px, 3vw, 28px)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
