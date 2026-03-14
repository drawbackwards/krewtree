import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NotificationDrawer } from '../NotificationDrawer/NotificationDrawer'
import type { Notification } from '../../types'
import { notifications as allNotifs } from '../../data/mock'
import { KrewtreeLogo } from '../Logo'
import { useAuth } from '../../context/AuthContext'
import styles from './Navbar.module.css'

// Keep Persona export so existing imports don't break
export type Persona = 'worker' | 'company'

const BellIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export const Navbar: React.FC = () => {
  const { isLoggedIn, persona, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = (path: string) => (location.pathname.startsWith(path) ? styles.active : '')

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>(allNotifs)
  const notifRef = useRef<HTMLDivElement>(null)

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifs.filter((n) => !n.isRead).length

  // Close notification drawer on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  // Close avatar menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false)
      }
    }
    if (avatarMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarMenuOpen])

  const handleMarkAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleNotifClick = (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setNotifOpen(false)
  }

  const handleLogout = () => {
    setAvatarMenuOpen(false)
    logout()
    navigate('/site')
  }

  const userInitials = persona === 'worker' ? 'MT' : 'AB'
  const companyName = 'Apex Builders LLC'

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/site" className={styles.logo}>
          <KrewtreeLogo height={30} onDark={false} />
        </Link>

        {/* Nav links — only shown when logged in */}
        {isLoggedIn && (
          <div className={styles.links}>
            {persona === 'worker' && (
              <>
                <Link
                  to="/site/jobs"
                  className={[styles.link, isActive('/site/jobs')].filter(Boolean).join(' ')}
                >
                  Find Jobs
                </Link>
                <Link
                  to="/site/dashboard/worker"
                  className={[styles.link, isActive('/site/dashboard')].filter(Boolean).join(' ')}
                >
                  Dashboard
                </Link>
                <Link
                  to="/site/profile/w1"
                  className={[styles.link, isActive('/site/profile')].filter(Boolean).join(' ')}
                >
                  My Profile
                </Link>
                <Link
                  to="/site/saved-jobs"
                  className={[styles.link, isActive('/site/saved-jobs')].filter(Boolean).join(' ')}
                >
                  Saved Jobs
                </Link>
                <Link
                  to="/site/messages"
                  className={[styles.link, isActive('/site/messages')].filter(Boolean).join(' ')}
                >
                  Messages
                </Link>
              </>
            )}
            {persona === 'company' && (
              <>
                <Link
                  to="/site/dashboard/company"
                  className={[styles.link, isActive('/site/dashboard/company')]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Dashboard
                </Link>
                <Link
                  to="/site/workers"
                  className={[styles.link, isActive('/site/workers')].filter(Boolean).join(' ')}
                >
                  Candidates
                </Link>
                <Link
                  to="/site/jobs"
                  className={[styles.link, isActive('/site/jobs')].filter(Boolean).join(' ')}
                >
                  Manage Jobs
                </Link>
                <Link
                  to="/site/pipeline"
                  className={[styles.link, isActive('/site/pipeline')].filter(Boolean).join(' ')}
                >
                  Pipeline
                </Link>
                <Link
                  to="/site/messages"
                  className={[styles.link, isActive('/site/messages')].filter(Boolean).join(' ')}
                >
                  Messages
                </Link>
              </>
            )}
          </div>
        )}

        {/* Right side */}
        <div className={styles.right}>
          {!isLoggedIn ? (
            /* ── Logged out: show auth buttons only ── */
            <>
              <Link
                to="/site/login"
                className={[styles.link, isActive('/site/login')].filter(Boolean).join(' ')}
              >
                Log in
              </Link>
              <Link
                to="/site/signup"
                style={{
                  background: 'var(--kt-navy-900)',
                  color: 'white',
                  borderRadius: 'var(--kt-radius-full)',
                  padding: '6px 16px',
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Sign up
              </Link>
            </>
          ) : (
            /* ── Logged in: post a job, bell, avatar dropdown ── */
            <>
              {persona === 'company' && (
                <Link to="/site/post-job" className={styles.postJobBtn}>
                  + Post a Job
                </Link>
              )}

              <div
                style={{ width: 1, height: 20, background: 'var(--kt-border)', flexShrink: 0 }}
              />

              {/* Notification Bell */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  className={[styles.notifBtn, notifOpen ? styles.notifBtnActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={`${unreadCount} notifications`}
                  onClick={() => setNotifOpen((o) => !o)}
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className={styles.notifBadge} aria-hidden="true">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <NotificationDrawer
                    notifications={notifs}
                    onMarkAllRead={handleMarkAllRead}
                    onNotificationClick={handleNotifClick}
                  />
                )}
              </div>

              {/* Avatar + dropdown */}
              <div ref={avatarRef} style={{ position: 'relative' }}>
                <button
                  className={[styles.avatarBtn, avatarMenuOpen ? styles.avatarBtnActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setAvatarMenuOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={avatarMenuOpen}
                >
                  <div
                    className={styles.avatar}
                    title={persona === 'worker' ? 'Marcus T.' : companyName}
                  >
                    {userInitials}
                  </div>
                  <ChevronDownIcon />
                </button>

                {avatarMenuOpen && (
                  <div className={styles.avatarMenu} role="menu">
                    {/* User identity header */}
                    <div className={styles.menuHeader}>
                      <span className={styles.menuHeaderName}>
                        {persona === 'worker' ? 'Marcus T.' : 'Alex Brennan'}
                      </span>
                      {persona === 'company' && (
                        <span className={styles.menuHeaderSub}>{companyName}</span>
                      )}
                    </div>

                    <div className={styles.menuDivider} />

                    {/* Company settings */}
                    {persona === 'company' && (
                      <>
                        <div className={styles.menuSection}>
                          <button
                            className={styles.menuItem}
                            role="menuitem"
                            onClick={() => setAvatarMenuOpen(false)}
                          >
                            Organization Settings
                          </button>
                        </div>
                      </>
                    )}

                    {/* Personal */}
                    <div className={styles.menuSection}>
                      <button
                        className={styles.menuItem}
                        role="menuitem"
                        onClick={() => setAvatarMenuOpen(false)}
                      >
                        Personal Settings
                      </button>
                    </div>

                    <div className={styles.menuDivider} />

                    {/* Log out */}
                    <div className={styles.menuSection}>
                      <button
                        className={[styles.menuItem, styles.menuItemDanger].join(' ')}
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
