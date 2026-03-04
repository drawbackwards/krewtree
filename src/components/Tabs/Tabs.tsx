import React, { createContext, useContext, useState } from 'react'
import styles from './Tabs.module.css'

type TabsVariant = 'underline' | 'pill'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (id: string) => void
  variant: TabsVariant
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs sub-component must be used inside <Tabs>')
  return ctx
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultTab?: string
  activeTab?: string
  onTabChange?: (id: string) => void
  variant?: TabsVariant
}

export const Tabs: React.FC<TabsProps> = ({
  defaultTab,
  activeTab: controlledTab,
  onTabChange,
  variant = 'underline',
  className,
  children,
  ...props
}) => {
  const [internalTab, setInternalTab] = useState(defaultTab ?? '')

  const activeTab = controlledTab ?? internalTab
  const setActiveTab = (id: string) => {
    setInternalTab(id)
    onTabChange?.(id)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant }}>
      <div className={[styles.tabs, className ?? ''].filter(Boolean).join(' ')} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabList: React.FC<TabListProps> = ({ className, children, ...props }) => {
  const { variant } = useTabsContext()
  const cls = [styles.list, variant === 'pill' ? styles.listPill : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cls} role="tablist" {...props}>
      {children}
    </div>
  )
}

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  id: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

export const Tab: React.FC<TabProps> = ({ id, icon, badge, className, children, ...props }) => {
  const { activeTab, setActiveTab, variant } = useTabsContext()
  const isActive = activeTab === id

  const cls = [
    styles.trigger,
    variant === 'pill' ? styles.triggerPill : '',
    isActive ? styles.active : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={cls}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tab-panel-${id}`}
      id={`tab-${id}`}
      onClick={() => setActiveTab(id)}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
      {badge}
    </button>
  )
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, className, children, ...props }) => {
  const { activeTab } = useTabsContext()
  if (activeTab !== id) return null

  return (
    <div
      className={[styles.panel, className ?? ''].filter(Boolean).join(' ')}
      role="tabpanel"
      id={`tab-panel-${id}`}
      aria-labelledby={`tab-${id}`}
      {...props}
    >
      {children}
    </div>
  )
}
