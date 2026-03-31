import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NotificationDrawer } from '../NotificationDrawer/NotificationDrawer'
import type { Notification } from '../../types'
import { KrewtreeLogo } from '../Logo'
import { useAuth } from '../../context/AuthContext'
import { BellIcon, ChevronDownIcon } from '../../icons'
import { getWorkerProfile } from '../../services/workerService'
import styles from './Navbar.module.css'

// Keep Persona export so existing imports don't break
export type Persona = 'worker' | 'company'

export const Navbar: React.FC = () => {
  const { isLoggedIn, persona, logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = (path: string) => (location.pathname.startsWith(path) ? styles.active : '')

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

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

  // Fetch avatar URL for worker persona
  useEffect(() => {
    if (!isLoggedIn || persona !== 'worker' || !user) return
    getWorkerProfile(user.id).then(({ data }) => {
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    })
  }, [isLoggedIn, persona, user])

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

  const firstName: string = user?.user_metadata?.first_name ?? ''
  const lastName: string = user?.user_metadata?.last_name ?? ''
  const companyName: string = user?.user_metadata?.company_name ?? ''
  const userInitials =
    persona === 'company'
      ? companyName
        ? companyName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()
        : (user?.email?.[0]?.toUpperCase() ?? '')
      : firstName
        ? `${firstName[0]}${lastName[0] ?? ''}`.toUpperCase()
        : (user?.email?.[0]?.toUpperCase() ?? '')
  const displayName =
    persona === 'worker'
      ? ((`${firstName} ${lastName}`.trim() || user?.email) ?? '')
      : ((companyName || user?.email) ?? '')

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
                  to={`/site/profile/${user!.id}`}
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
                  <BellIcon size={18} />
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
                  <div className={styles.avatar} title={displayName}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <ChevronDownIcon size={12} />
                </button>

                {avatarMenuOpen && (
                  <div className={styles.avatarMenu} role="menu">
                    {/* User identity header */}
                    <div className={styles.menuHeader}>
                      <span className={styles.menuHeaderName}>{displayName}</span>
                      {persona === 'company' && user?.email && (
                        <span className={styles.menuHeaderSub}>{user.email}</span>
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
