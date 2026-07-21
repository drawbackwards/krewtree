import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './SettingsLayout.module.css'

type NavItem = { to: string; label: string }

const ORG_NAV: NavItem[] = [
  { to: '/site/settings/profile', label: 'Profile' },
  { to: '/site/settings/pipeline', label: 'Pipeline' },
  { to: '/site/settings/templates', label: 'Templates' },
]
const ACCOUNT_NAV: NavItem[] = [{ to: '/site/settings/account', label: 'Account & billing' }]
const PERSONAL_NAV: NavItem[] = [{ to: '/site/settings/notifications', label: 'Notifications' }]

const NavList: React.FC<{ items: NavItem[] }> = ({ items }) => (
  <>
    {items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
        }
      >
        {item.label}
      </NavLink>
    ))}
  </>
)

// Companies get organization + account settings alongside their personal
// preferences; workers have only personal preferences (no org concept).
const SettingsLayout: React.FC = () => {
  const { persona } = useAuth()
  const isCompany = persona === 'company'

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Settings navigation">
          {isCompany && (
            <>
              <div className={styles.navSection}>Organization</div>
              <NavList items={ORG_NAV} />
              <div className={styles.navSection}>Account</div>
              <NavList items={ACCOUNT_NAV} />
            </>
          )}
          <div className={styles.navSection}>Personal</div>
          <NavList items={PERSONAL_NAV} />
        </nav>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SettingsLayout
export { SettingsLayout }
