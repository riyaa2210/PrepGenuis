import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <Header collapsed={collapsed} onToggle={toggle} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
