import React from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useTheme } from '../theme/useTheme'
import { Sparkles, LogOut, User, Moon, ShieldCheck, Sun } from 'lucide-react'
import './Navbar.scss'

const Navbar = () => {
  const { user, handleLogout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const onLogout = async () => {
    await handleLogout()
    navigate('/login')
  }

  return (
    <header className="app-navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Sparkles className="icon-sparkle" size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-name">Interview<span className="accent-text">AI</span></span>
            <span className="brand-tag">Strategist Pro</span>
          </div>
        </Link>

        {/* Center Badge / Navigation */}
        <div className="navbar-center">
          <div className="engine-status">
            <span className="status-dot"></span>
            <ShieldCheck size={14} className="status-icon" />
            <span>AI Engine v2.4 Ready</span>
          </div>
        </div>

        {/* User Actions */}
        <div className="navbar-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          {user ? (
            <div className="user-menu">
              <div className="user-avatar">
                <User size={16} />
                <span className="user-name">{user.username || user.email?.split('@')[0]}</span>
              </div>
              <button onClick={onLogout} className="logout-btn" title="Sign Out">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register" className="nav-button">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
