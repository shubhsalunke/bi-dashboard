import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Navbar } from '../common/Navbar';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const getPageTitle = (path) => {
    if (path === '/') return 'Executive Intelligence Dashboard';
    if (path.startsWith('/customers/')) return 'Customer Details';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/sales')) return 'Sales';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/ai-assistant')) return 'AI Assistant';
    if (path.startsWith('/users')) return 'Users';
    return 'Smart BI';
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <Navbar
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          title={getPageTitle(location.pathname)}
        />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
