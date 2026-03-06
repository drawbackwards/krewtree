import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { NotificationDrawer } from '../NotificationDrawer/NotificationDrawer'
import type { Notification } from '../../types'
import { notifications as allNotifs } from '../../data/mock'
import { KrewtreeLogo } from '../Logo'
import styles from './Navbar.module.css'

export type Persona = 'worker' | 'company'

interface NavbarProps {
  persona: Persona
  onPersonaChange: (p: Persona) => void
  notificationCount?: number
}

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

export const Navbar: React.FC<NavbarProps> = ({ persona, onPersonaChange }) => {
  const location = useLocation()
  const isActive = (path: string) => (location.pathname.startsWith(path) ? styles.active : '')

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>(allNotifs)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifs.filter((n) => !n.isRead).length

  // Close drawer on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  const handleMarkAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleNotifClick = (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setNotifOpen(false)
  }

  const dashPath = persona === 'worker' ? '/site/dashboard/worker' : '/site/dashboard/company'
  const userInitials = persona === 'worker' ? 'MT' : 'AB'

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/site" className={styles.logo}>
          <KrewtreeLogo height={30} onDark={false} />
        </Link>

        {/* Links */}
        <div className={styles.links}>
          <Link
            to="/site/jobs"
            className={[styles.link, isActive('/site/jobs')].filter(Boolean).join(' ')}
          >
            Find Jobs
          </Link>
          <Link
            to={dashPath}
            className={[styles.link, isActive('/site/dashboard')].filter(Boolean).join(' ')}
          >
            Dashboard
          </Link>
          {persona === 'worker' && (
            <>
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
                to="/site/post-job"
                className={[styles.link, isActive('/site/post-job')].filter(Boolean).join(' ')}
              >
                Post a Job
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

        {/* Persona Switcher */}
        <div className={styles.personaSwitcher} role="group" aria-label="Switch persona">
          <button
            className={[styles.personaBtn, persona === 'worker' ? styles.personaActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onPersonaChange('worker')}
          >
            Worker
          </button>
          <button
            className={[styles.personaBtn, persona === 'company' ? styles.personaActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onPersonaChange('company')}
          >
            Company
          </button>
        </div>

        {/* Right */}
        <div className={styles.right}>
          {/* Auth actions */}
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

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'var(--kt-border)', flexShrink: 0 }} />

          {persona === 'company' && (
            <Link to="/site/post-job" className={styles.postJobBtn}>
              + Post a Job
            </Link>
          )}

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

          <div
            className={styles.avatar}
            title={persona === 'worker' ? 'Marcus T.' : 'Apex Builders'}
          >
            {userInitials}
          </div>
        </div>
      </div>
    </nav>
  )
}
