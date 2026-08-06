import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NotificationDrawer } from '../NotificationDrawer/NotificationDrawer'
import type { Notification } from '../../types'
import { KrewtreeLogo } from '../Logo'
import { Avatar, Button, Input, Modal } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import {
  BellIcon,
  BuildingIcon,
  CheckIcon,
  ChevronDownIcon,
  LogoutIcon,
  PersonIcon,
  PlusIcon,
} from '../../icons'
import { getWorkerProfile } from '../../services/workerService'
import { getCompanyLogoUrl } from '../../services/companyService'
import { getUnreadMessageCount, MESSAGES_READ_EVENT } from '../../services/messageService'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getMessageBadgeEnabled,
  NOTIFICATIONS_READ_EVENT,
  NOTIFICATION_PREFS_CHANGED_EVENT,
} from '../../services/notificationService'
import styles from './Navbar.module.css'

// Keep Persona export so existing imports don't break
export type Persona = 'worker' | 'company'

export const Navbar: React.FC = () => {
  const {
    isLoggedIn,
    persona,
    logout,
    user,
    activeCompanyId,
    memberships,
    setActiveCompany,
    createCompany,
  } = useAuth()

  // "Create company" modal (from the switcher).
  const [createOpen, setCreateOpen] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const handleCreateCompany = async () => {
    const name = newCompanyName.trim()
    if (!name) return
    setCreating(true)
    setCreateError('')
    const { companyId, error } = await createCompany(name)
    setCreating(false)
    if (error || !companyId) {
      setCreateError(error ?? 'Could not create company.')
      return
    }
    setCreateOpen(false)
    setNewCompanyName('')
    navigate('/settings/profile')
  }
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = (path: string) => (location.pathname.startsWith(path) ? styles.active : '')

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  // Fetch in-app notifications for the bell. Rows are created server-side by
  // triggers; here we just read, poll (60s), and refresh when a mark-read
  // happens elsewhere — the same shape as the Messages unread badge below.
  useEffect(() => {
    if (!isLoggedIn || !persona) {
      setNotifs([])
      return
    }
    let cancelled = false
    const refresh = () => {
      getNotifications().then(({ data }) => {
        if (!cancelled) setNotifs(data)
      })
    }
    refresh()
    const interval = window.setInterval(refresh, 60_000)
    window.addEventListener(NOTIFICATIONS_READ_EVENT, refresh)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, refresh)
    }
  }, [isLoggedIn, persona])

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

  // Fetch the avatar image: worker avatar for workers, company logo for
  // companies. Keyed on user id (not the user object) so auth events like
  // hourly token refresh don't refetch.
  useEffect(() => {
    if (!isLoggedIn) return
    if (persona === 'worker' && user?.id) {
      getWorkerProfile(user.id).then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      })
    } else if (persona === 'company' && activeCompanyId) {
      // Reset on switch so a logo-less company doesn't keep showing the
      // previously active company's logo (Avatar falls back to initials).
      getCompanyLogoUrl(activeCompanyId).then(({ data }) => {
        setAvatarUrl(data ?? '')
      })
    }
  }, [isLoggedIn, persona, user?.id, activeCompanyId])

  // Unread message count for the Messages nav badge. Refreshed when the
  // messages page marks a thread read and on a slow poll — NOT on every
  // route change, which previously fired a database query per nav click.
  const [msgUnread, setMsgUnread] = useState(0)
  useEffect(() => {
    if (!isLoggedIn || !persona) {
      setMsgUnread(0)
      return
    }
    let cancelled = false
    const refresh = () => {
      getUnreadMessageCount(persona === 'company' ? activeCompanyId : null).then(({ data }) => {
        if (!cancelled) setMsgUnread(data)
      })
    }
    refresh()
    const interval = window.setInterval(refresh, 60_000)
    window.addEventListener(MESSAGES_READ_EVENT, refresh)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener(MESSAGES_READ_EVENT, refresh)
    }
  }, [isLoggedIn, persona, activeCompanyId])

  // The Messages unread badge is the in-app alert for new messages, gated on
  // the user's `message_inapp` notification preference. Refetched when prefs
  // are saved (Settings → Notifications) so the toggle takes effect live.
  const [msgBadgeOn, setMsgBadgeOn] = useState(true)
  useEffect(() => {
    if (!isLoggedIn || !persona) {
      setMsgBadgeOn(true)
      return
    }
    let cancelled = false
    const refresh = () => {
      getMessageBadgeEnabled(persona).then((on) => {
        if (!cancelled) setMsgBadgeOn(on)
      })
    }
    refresh()
    window.addEventListener(NOTIFICATION_PREFS_CHANGED_EVENT, refresh)
    return () => {
      cancelled = true
      window.removeEventListener(NOTIFICATION_PREFS_CHANGED_EVENT, refresh)
    }
  }, [isLoggedIn, persona])

  const messagesLabel = (
    <>
      Messages
      {msgBadgeOn && msgUnread > 0 && (
        <span className={styles.msgBadge} aria-label={`${msgUnread} unread messages`}>
          {msgUnread > 9 ? '9+' : msgUnread}
        </span>
      )}
    </>
  )

  const handleMarkAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
    markAllNotificationsRead().then(() => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)))
  }

  const handleNotifClick = (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    setNotifOpen(false)
    markNotificationRead(id).then(() => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)))
  }

  const handleLogout = () => {
    setAvatarMenuOpen(false)
    logout()
    navigate('/')
  }

  const firstName: string = user?.user_metadata?.first_name ?? ''
  const lastName: string = user?.user_metadata?.last_name ?? ''

  const companyInitials = (name: string): string =>
    (name || 'Company')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  // The company the user is currently acting as drives the navbar identity, so
  // switching companies updates the avatar + label. Fall back to the signup
  // company_name only until memberships load.
  const activeCompany = memberships.find((m) => m.companyId === activeCompanyId) ?? null
  const companyName: string = activeCompany?.companyName ?? user?.user_metadata?.company_name ?? ''

  const userInitials =
    persona === 'company'
      ? companyName
        ? companyInitials(companyName)
        : (user?.email?.[0]?.toUpperCase() ?? '')
      : firstName
        ? `${firstName[0]}${lastName[0] ?? ''}`.toUpperCase()
        : (user?.email?.[0]?.toUpperCase() ?? '')
  const displayName =
    persona === 'worker'
      ? ((`${firstName} ${lastName}`.trim() || user?.email) ?? '')
      : ((companyName || user?.email) ?? '')

  // Logged-in users land on their own dashboard from the logo; visitors go home.
  const logoTarget = !isLoggedIn
    ? '/'
    : persona === 'company'
      ? '/dashboard/company'
      : '/dashboard/worker'

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to={logoTarget} className={styles.logo}>
          <KrewtreeLogo height={30} onDark={false} />
        </Link>

        {/* Nav links — only shown when logged in */}
        {isLoggedIn && (
          <div className={styles.links}>
            {persona === 'worker' && (
              <>
                <Link
                  to="/dashboard/worker"
                  className={[styles.link, isActive('/dashboard')].filter(Boolean).join(' ')}
                >
                  Dashboard
                </Link>
                <Link
                  to="/jobs"
                  className={[styles.link, isActive('/jobs')].filter(Boolean).join(' ')}
                >
                  Find Jobs
                </Link>
                <Link
                  to={`/profile/${user!.id}`}
                  className={[styles.link, isActive('/profile')].filter(Boolean).join(' ')}
                >
                  My Profile
                </Link>
                <Link
                  to="/saved-jobs"
                  className={[styles.link, isActive('/saved-jobs')].filter(Boolean).join(' ')}
                >
                  Saved Jobs
                </Link>
                <Link
                  to="/messages"
                  className={[styles.link, isActive('/messages')].filter(Boolean).join(' ')}
                >
                  {messagesLabel}
                </Link>
              </>
            )}
            {persona === 'company' && (
              <>
                <Link
                  to="/dashboard/company"
                  className={[styles.link, isActive('/dashboard/company')]
                    .filter(Boolean)
                    .join(' ')}
                >
                  Dashboard
                </Link>
                <Link
                  to="/discover"
                  className={[styles.link, isActive('/discover')].filter(Boolean).join(' ')}
                >
                  Discover
                </Link>
                <Link
                  to="/dashboard/krew"
                  className={[styles.link, isActive('/dashboard/krew')].filter(Boolean).join(' ')}
                >
                  My Krew
                </Link>
                <Link
                  to="/dashboard/jobs"
                  className={[styles.link, isActive('/dashboard/jobs')].filter(Boolean).join(' ')}
                >
                  My Jobs
                </Link>
                <Link
                  to="/messages"
                  className={[styles.link, isActive('/messages')].filter(Boolean).join(' ')}
                >
                  {messagesLabel}
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
                to="/login"
                className={[styles.link, isActive('/login')].filter(Boolean).join(' ')}
              >
                Log in
              </Link>
              <Link
                to="/signup"
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
                <Link to="/post-job" className={styles.postJobBtn}>
                  +<span className={styles.postJobLabel}>&nbsp;Post a Job</span>
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
                    {persona === 'company' && (
                      <>
                        {/* Companies: switch between, or create a new one. */}
                        <span className={styles.menuSectionLabel}>Companies</span>
                        <div className={styles.menuSection}>
                          {memberships.map((m) => (
                            <button
                              key={m.companyId}
                              className={[
                                styles.menuItem,
                                styles.menuItemRow,
                                m.companyId === activeCompanyId ? styles.menuItemActive : '',
                              ].join(' ')}
                              role="menuitem"
                              aria-current={m.companyId === activeCompanyId}
                              onClick={() => {
                                setActiveCompany(m.companyId)
                                setAvatarMenuOpen(false)
                                navigate('/dashboard/company')
                              }}
                            >
                              <Avatar
                                src={m.companyLogo ?? undefined}
                                size="sm"
                                shape="rounded"
                                alt={m.companyName || 'Company'}
                                initials={companyInitials(m.companyName)}
                              />
                              <span className={styles.menuItemLabel}>
                                {m.companyName || 'Company'}
                              </span>
                              {m.companyId === activeCompanyId && (
                                <span className={styles.menuCheck}>
                                  <CheckIcon size={16} />
                                </span>
                              )}
                            </button>
                          ))}
                          <button
                            className={[styles.menuItem, styles.menuItemRow].join(' ')}
                            role="menuitem"
                            onClick={() => {
                              setAvatarMenuOpen(false)
                              setCreateError('')
                              setNewCompanyName('')
                              setCreateOpen(true)
                            }}
                          >
                            <span className={styles.createIconBox}>
                              <PlusIcon size={16} />
                            </span>
                            <span className={styles.menuItemLabel}>Create company</span>
                          </button>
                        </div>

                        <div className={styles.menuDivider} />

                        {/* Company settings (its own page). */}
                        <div className={styles.menuSection}>
                          <button
                            className={[styles.menuItem, styles.menuItemRow].join(' ')}
                            role="menuitem"
                            onClick={() => {
                              setAvatarMenuOpen(false)
                              navigate('/settings')
                            }}
                          >
                            <span className={styles.menuIconSlot}>
                              <BuildingIcon size={18} />
                            </span>
                            <span className={styles.menuItemLabel}>
                              {activeCompany?.companyName || 'Company'} settings
                            </span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Personal settings (its own page). */}
                    <div className={styles.menuSection}>
                      <button
                        className={[styles.menuItem, styles.menuItemRow].join(' ')}
                        role="menuitem"
                        onClick={() => {
                          setAvatarMenuOpen(false)
                          navigate('/settings/my-profile')
                        }}
                      >
                        <span className={styles.menuIconSlot}>
                          <PersonIcon size={18} />
                        </span>
                        <span className={styles.menuItemLabel}>Personal settings</span>
                      </button>
                    </div>

                    <div className={styles.menuDivider} />

                    <div className={styles.menuSection}>
                      <button
                        className={[
                          styles.menuItem,
                          styles.menuItemRow,
                          styles.menuItemDanger,
                        ].join(' ')}
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <span className={styles.menuIconSlot}>
                          <LogoutIcon size={18} />
                        </span>
                        <span className={styles.menuItemLabel}>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => (creating ? undefined : setCreateOpen(false))}
        size="sm"
        title="Create a company"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCompany}
              disabled={creating || !newCompanyName.trim()}
            >
              {creating ? 'Creating…' : 'Create company'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            You'll be the owner of the new company and switched into it. You can finish its profile
            next.
          </p>
          <Input
            label="Company name"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="Acme Interiors"
          />
          {createError && (
            <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
              {createError}
            </p>
          )}
        </div>
      </Modal>
    </nav>
  )
}
