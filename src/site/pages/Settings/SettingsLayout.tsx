import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import styles from './SettingsLayout.module.css'

type NavItem = { to: string; label: string }

const ORG_NAV: NavItem[] = [
  { to: '/site/settings/pipeline', label: 'Pipeline' },
  { to: '/site/settings/pipeline-tasks', label: 'Pipeline tasks' },
]

const SettingsLayout: React.FC = () => {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Settings navigation">
          <div className={styles.navSection}>Organization</div>
          {ORG_NAV.map((item) => (
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
