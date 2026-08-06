import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './SettingsLayout.module.css'

// Personal-settings pages; everything else under /settings is company.
const PERSONAL_PATHS = new Set(['/settings/my-profile', '/settings/notifications'])

type NavItem = { to: string; label: string }

const ORG_NAV: NavItem[] = [
  { to: '/settings/profile', label: 'Profile' },
  { to: '/settings/team', label: 'Team' },
  { to: '/settings/pipeline', label: 'Pipeline' },
  { to: '/settings/templates', label: 'Templates' },
]
const ACCOUNT_NAV: NavItem[] = [{ to: '/settings/account', label: 'Account & billing' }]
const PERSONAL_NAV: NavItem[] = [
  { to: '/settings/my-profile', label: 'My profile' },
  { to: '/settings/notifications', label: 'Notifications' },
]

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

// Two separate settings areas share this shell, each reached from the account
// dropdown: "Company settings" (organization + account nav) and "Personal
// settings" (personal nav). The current route decides which nav is shown, so
// the two never appear together. Workers only have the personal area.
const SettingsLayout: React.FC = () => {
  const { persona, companyRole, memberships, activeCompanyId } = useAuth()
  const isCompany = persona === 'company'
  // Account & billing (delete company, billing) is owner/admin-only.
  const canSeeAccount = companyRole === 'owner' || companyRole === 'admin'
  const { pathname } = useLocation()
  const isPersonal = !isCompany || PERSONAL_PATHS.has(pathname)
  const companyName = memberships.find((m) => m.companyId === activeCompanyId)?.companyName

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {isPersonal ? 'Personal settings' : `${companyName || 'Company'} settings`}
      </h1>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Settings navigation">
          {isPersonal ? (
            <NavList items={PERSONAL_NAV} />
          ) : (
            <NavList items={canSeeAccount ? [...ORG_NAV, ...ACCOUNT_NAV] : ORG_NAV} />
          )}
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
