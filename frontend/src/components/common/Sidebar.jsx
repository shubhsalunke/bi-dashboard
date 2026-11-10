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
  X,
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
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Logo size={24} />
            <span className="brand-text">Sales Admin</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={15} aria-hidden="true" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Users size={15} aria-hidden="true" />
            <span>Customers</span>
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Package size={15} aria-hidden="true" />
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/sales"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <TrendingUp size={15} aria-hidden="true" />
            <span>Sales</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <BarChart2 size={15} aria-hidden="true" />
            <span>Reports</span>
          </NavLink>

          <NavLink
            to="/ai-assistant"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <MessageSquare size={15} aria-hidden="true" />
            <span>AI Assistant</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <UserCheck size={15} aria-hidden="true" />
              <span>Users</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar" aria-hidden="true">{getInitials(user?.name)}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role-text">{user?.role}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn btn-ghost btn-icon"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
