import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  FileBarChart,
  Bot,
  ShieldCheck,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isManager, isAnalyst } = useAuth();

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
        <Logo size={36} />
        <div>
          <div className="brand-text">Smart BI</div>
          <div className="brand-subtitle">Business Intelligence</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">
          {isAdmin && 'Administration Suite'}
          {isManager && 'Operations Suite'}
          {(!isAdmin && !isManager) && 'Analytics Suite'}
        </div>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          <span>
            {isAdmin && 'Admin Dashboard'}
            {isManager && 'Operations Dashboard'}
            {(!isAdmin && !isManager) && 'Analytics Dashboard'}
          </span>
          <span className={`role-nav-badge ${isAdmin ? 'admin-badge' : isManager ? 'action-badge' : 'ai-badge'}`}>
            {user?.role || 'Guest'}
          </span>
        </NavLink>

        {/* ADMIN EXCLUSIVE: Put Administration & Security immediately at top */}
        {isAdmin && (
          <>
            <div className="nav-section-title">System Governance</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <ShieldCheck size={18} />
              <span>User & Role Controls</span>
              <span className="role-nav-badge admin-badge">Root</span>
            </NavLink>
          </>
        )}

        {/* ANALYST EXCLUSIVE: Put Analytics & AI Copilot immediately at top */}
        {(!isAdmin && !isManager) && (
          <>
            <div className="nav-section-title">Intelligence & Copilot</div>
            <NavLink
              to="/ai-assistant"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Bot size={18} />
              <span>AI BI Assistant</span>
              <span className="role-nav-badge ai-badge">Copilot</span>
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <FileBarChart size={18} />
              <span>Sales Analytics</span>
              <span className="role-nav-badge ai-badge">Reports</span>
            </NavLink>
          </>
        )}

        {/* OPERATIONS: High priority for Manager, standard for others */}
        <div className="nav-section-title">
          {isManager ? 'Sales & Deal Operations' : 'Enterprise Operations'}
        </div>

        {isManager && (
          <NavLink
            to="/sales"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <TrendingUp size={18} />
            <span>Sales & Orders</span>
            <span className="role-nav-badge action-badge">Action</span>
          </NavLink>
        )}

        <NavLink
          to="/customers"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Users size={18} />
          <span>Customers</span>
          {(!isAdmin && !isManager) && <span className="role-nav-badge ai-badge">View</span>}
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Package size={18} />
          <span>{isManager ? 'Product Inventory' : 'Products'}</span>
          {(!isAdmin && !isManager) && <span className="role-nav-badge ai-badge">View</span>}
        </NavLink>

        {!isManager && (
          <NavLink
            to="/sales"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <TrendingUp size={18} />
            <span>{(!isAdmin && !isManager) ? 'Sales Transactions' : 'Sales & Orders'}</span>
            {(!isAdmin && !isManager) && <span className="role-nav-badge ai-badge">Ledger</span>}
          </NavLink>
        )}

        {/* For Manager & Admin: Show Analytics section below Operations */}
        {(isAdmin || isManager) && (
          <>
            <div className="nav-section-title">Analytics & Intelligence</div>
            <NavLink
              to="/reports"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <FileBarChart size={18} />
              <span>Sales Reports</span>
            </NavLink>
            <NavLink
              to="/ai-assistant"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Bot size={18} />
              <span>AI Assistant</span>
              <span className="role-nav-badge action-badge">AI</span>
            </NavLink>
          </>
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
          className="btn btn-secondary btn-sm"
          title="Sign out"
          style={{ padding: '8px' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
