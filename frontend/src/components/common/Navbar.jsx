import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from './Badge';

export const Navbar = ({ onToggleSidebar, title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none', padding: '6px' }}
          id="mobile-sidebar-toggle"
        >
          <Menu size={16} />
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

        {user?.role && (
          <Badge variant={user.role} label={user.role} />
        )}
      </div>
    </header>
  );
};

export default Navbar;
