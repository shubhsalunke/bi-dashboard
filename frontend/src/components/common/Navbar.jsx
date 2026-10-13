import React from 'react';
import { Menu, Shield, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from './Badge';

export const Navbar = ({ onToggleSidebar, title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none', padding: '8px' }}
          id="mobile-sidebar-toggle"
        >
          <Menu size={18} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="navbar-actions">
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          id="theme-toggle-button"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
        >
          {theme === 'light' ? (
            <>
              <Moon size={14} />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun size={14} />
              <span>Light</span>
            </>
          )}
        </button>

        <Badge variant={user?.role} label={`${user?.role?.toUpperCase()} ACCESS`} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          <Shield size={14} color="#10b981" />
          <span>Session Secure</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
