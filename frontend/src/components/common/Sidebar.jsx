import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  BarChart2,
  MessageSquare,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <Logo size={28} />
        <div>
          <div className="brand-text brand-title-serif">Smart BI</div>
          <div className="brand-subtitle">Dashboard</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Users size={16} />
          <span>Customers</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Package size={16} />
          <span>Products</span>
        </NavLink>

        <NavLink
          to="/sales"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <TrendingUp size={16} />
          <span>Sales</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <BarChart2 size={16} />
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/ai-assistant"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <MessageSquare size={16} />
          <span>AI Assistant</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <UserCheck size={16} />
            <span>Users</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-role-text">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-sm"
          title="Sign out"
          style={{
            padding: '6px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--sidebar-border)',
            color: 'var(--sidebar-text-muted)',
            flexShrink: 0,
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
