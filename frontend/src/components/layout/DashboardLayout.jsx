import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Navbar } from '../common/Navbar';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path) => {
    if (path === '/') return 'Executive Intelligence Dashboard';
    if (path.startsWith('/customers/')) return 'Customer Intelligence Profile';
    if (path.startsWith('/customers')) return 'Customer Directory & Accounts';
    if (path.startsWith('/products')) return 'Product Portfolio & Pricing';
    if (path.startsWith('/sales')) return 'Sales Operations & Orders';
    if (path.startsWith('/reports')) return 'Business Reporting & Analytics';
    if (path.startsWith('/ai-assistant')) return 'AI Business Copilot';
    if (path.startsWith('/users')) return 'User Roles & System Administration';
    return 'Business Intelligence';
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle(location.pathname)}
        />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
