import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from './Badge';

export const Navbar = ({ isSidebarOpen = false, onToggleSidebar, title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-icon mobile-menu-btn"
          id="mobile-sidebar-toggle"
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isSidebarOpen}
        >
          <Menu size={16} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="navbar-actions">
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          id="theme-toggle-button"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <>
              <Moon size={14} aria-hidden="true" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun size={14} aria-hidden="true" />
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
