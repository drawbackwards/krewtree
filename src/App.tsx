import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SiteRouter } from './site/Router'
import { AuthProvider } from './site/context/AuthContext'
import { MoonIcon, SunIcon } from './site/icons'
import {
  Button,
  Badge,
  Label,
  Input,
  Textarea,
  Checkbox,
  RadioGroup,
  Switch,
  Select,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  AvatarGroup,
  Modal,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Alert,
  Progress,
  Spinner,
  Tooltip,
  useToast,
} from './components'

// ---- Section wrapper ----
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginBottom: '3rem' }}>
    <h2
      style={{
        fontSize: 'var(--kt-text-xl)',
        fontWeight: 'var(--kt-weight-semibold)',
        color: 'var(--kt-text)',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--kt-border)',
      }}
    >
      {title}
    </h2>
    {children}
  </section>
)

// ---- Row wrapper ----
const Row: React.FC<{ gap?: number; wrap?: boolean; children: React.ReactNode }> = ({
  gap = 12,
  wrap = true,
  children,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', flexWrap: wrap ? 'wrap' : 'nowrap', gap }}>
    {children}
  </div>
)

// ---- Color swatch ----
const Swatch: React.FC<{ color: string; name: string; hex: string }> = ({ color, name, hex }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 'var(--kt-radius-md)',
        background: color,
        border: '1px solid var(--kt-border)',
        boxShadow: 'var(--kt-shadow-sm)',
      }}
    />
    <span
      style={{
        fontSize: 'var(--kt-text-xs)',
        fontWeight: 'var(--kt-weight-medium)',
        color: 'var(--kt-text)',
      }}
    >
      {name}
    </span>
    <span
      style={{
        fontSize: 'var(--kt-text-xs)',
        color: 'var(--kt-text-muted)',
        fontFamily: 'var(--kt-font-mono)',
      }}
    >
      {hex}
    </span>
  </div>
)

// ===== APP =====
export default function App() {
  const location = useLocation()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [checked, setChecked] = useState(false)
  const [radio, setRadio] = useState('option1')
  const [switchOn, setSwitchOn] = useState(false)
  const [progress, setProgress] = useState(65)
  const { toast } = useToast()

  // Route /site/* to the job board site; everything else → component library showcase
  if (location.pathname.startsWith('/site')) {
    return (
      <AuthProvider>
        <SiteRouter />
      </AuthProvider>
    )
  }

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--kt-bg)',
        color: 'var(--kt-text)',
        transition: 'background-color var(--kt-duration-slow), color var(--kt-duration-slow)',
      }}
    >
      {/* ---- Header ---- */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--kt-surface)',
          borderBottom: '1px solid var(--kt-border)',
          padding: '0 var(--kt-space-8)',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--kt-shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="var(--kt-primary)" />
            <path d="M14 6L6 14l8 8 8-8-8-8z" fill="var(--kt-primary-fg)" opacity="0.9" />
          </svg>
          <span
            style={{
              fontSize: 'var(--kt-text-lg)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
            }}
          >
            Krewtree UI
          </span>
          <Badge variant="accent" size="sm">
            v0.1.0
          </Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tooltip content={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
            </Button>
          </Tooltip>
        </div>
      </header>

      {/* ---- Main ---- */}
      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'var(--kt-space-10) var(--kt-space-8)',
        }}
      >
        {/* Hero */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 'var(--kt-text-4xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              marginBottom: '0.75rem',
              letterSpacing: '-0.5px',
            }}
          >
            Krewtree Component Library
          </h1>
          <p
            style={{
              fontSize: 'var(--kt-text-lg)',
              color: 'var(--kt-text-muted)',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            A full token-driven design system built from the Krewtree brand guidelines — Navy, Sand
            Dune &amp; Olive.
          </p>
        </div>

        {/* ---- Brand Colors ---- */}
        <Section title="Brand Colors">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
            <Swatch color="#0A232D" name="Navy" hex="#0A232D" />
            <Swatch color="#0d2d3a" name="Navy 800" hex="#0d2d3a" />
            <Swatch color="#1d5669" name="Navy 500" hex="#1d5669" />
            <Swatch color="#4da0bd" name="Navy 300" hex="#4da0bd" />
            <Swatch color="#c5e5ef" name="Navy 100" hex="#c5e5ef" />
            <Swatch color="#eaf5f9" name="Navy 50" hex="#eaf5f9" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
            <Swatch color="#E5DAC3" name="Sand Dune" hex="#E5DAC3" />
            <Swatch color="#ddc9a8" name="Sand 500" hex="#ddc9a8" />
            <Swatch color="#d4b48a" name="Sand 600" hex="#d4b48a" />
            <Swatch color="#f3ede3" name="Sand 200" hex="#f3ede3" />
            <Swatch color="#f8f4ef" name="Sand 100" hex="#f8f4ef" />
            <Swatch color="#fdfcfa" name="Sand 50" hex="#fdfcfa" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            <Swatch color="#6D7531" name="Olive" hex="#6D7531" />
            <Swatch color="#4d5a16" name="Olive 800" hex="#4d5a16" />
            <Swatch color="#9fac55" name="Olive 500" hex="#9fac55" />
            <Swatch color="#cedb95" name="Olive 300" hex="#cedb95" />
            <Swatch color="#e2ecb8" name="Olive 200" hex="#e2ecb8" />
            <Swatch color="#f8fbee" name="Olive 50" hex="#f8fbee" />
          </div>
        </Section>

        {/* ---- Buttons ---- */}
        <Section title="Buttons">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label style={{ marginBottom: 8, display: 'block' }}>Variants</Label>
              <Row>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="link">Link</Button>
              </Row>
            </div>
            <div>
              <Label style={{ marginBottom: 8, display: 'block' }}>Sizes</Label>
              <Row>
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
                <Button variant="primary" size="xl">
                  XLarge
                </Button>
              </Row>
            </div>
            <div>
              <Label style={{ marginBottom: 8, display: 'block' }}>States</Label>
              <Row>
                <Button variant="primary" loading>
                  Loading
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
                <Button
                  variant="accent"
                  leftIcon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                    </svg>
                  }
                >
                  With Icon
                </Button>
                <Button
                  variant="outline"
                  rightIcon={
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  }
                >
                  Arrow
                </Button>
              </Row>
            </div>
          </div>
        </Section>

        {/* ---- Badges ---- */}
        <Section title="Badges">
          <Row>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </Row>
          <div style={{ marginTop: 12 }}>
            <Row>
              <Badge variant="success" dot>
                Online
              </Badge>
              <Badge variant="warning" dot>
                Away
              </Badge>
              <Badge variant="danger" dot>
                Busy
              </Badge>
              <Badge variant="neutral" dot>
                Offline
              </Badge>
              <Badge variant="accent" size="sm">
                Small
              </Badge>
              <Badge variant="accent" size="lg">
                Large
              </Badge>
            </Row>
          </div>
        </Section>

        {/* ---- Form Fields ---- */}
        <Section title="Form Fields">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            <Input label="Username" placeholder="johndoe" helperText="Your unique handle" />
            <Input label="Email" type="email" placeholder="you@example.com" required />
            <Input label="Error state" defaultValue="bad value" error="This field is required" />
            <Input
              label="With icon"
              placeholder="Search..."
              leadingIcon={
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
            />
            <Select
              label="Country"
              placeholder="Select country..."
              options={[
                { label: 'United States', value: 'us' },
                { label: 'Canada', value: 'ca' },
                { label: 'United Kingdom', value: 'uk' },
                { label: 'Australia', value: 'au' },
              ]}
              helperText="Where are you based?"
            />
            <Textarea
              label="Bio"
              placeholder="Tell us about yourself..."
              maxChars={200}
              helperText="Max 200 characters"
            />
          </div>

          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Label>Checkboxes</Label>
              <Checkbox
                label="I agree to the terms"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <Checkbox
                label="Indeterminate example"
                indeterminate
                checked={false}
                onChange={() => {}}
              />
              <Checkbox label="Disabled" disabled checked={false} onChange={() => {}} />
              <Checkbox
                label="With hint"
                helperText="Optional extra context"
                checked={false}
                onChange={() => {}}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Label>Radio Group</Label>
              <RadioGroup
                name="demo"
                value={radio}
                onChange={setRadio}
                options={[
                  { label: 'Option A', value: 'option1' },
                  { label: 'Option B', value: 'option2' },
                  { label: 'Option C (disabled)', value: 'option3', disabled: true },
                ]}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Label>Switches</Label>
              <Switch
                label="Email notifications"
                checked={switchOn}
                onChange={(e) => setSwitchOn(e.target.checked)}
              />
              <Switch label="Small size" size="sm" checked={true} onChange={() => {}} />
              <Switch label="Large size" size="lg" checked={false} onChange={() => {}} />
              <Switch label="Disabled" disabled checked={true} onChange={() => {}} />
            </div>
          </div>
        </Section>

        {/* ---- Cards ---- */}
        <Section title="Cards">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            <Card shadow="flat">
              <CardHeader title="Flat Card" description="No shadow, clean border" />
              <CardBody>
                <p style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}>
                  Cards are versatile containers for content. Use them to group related information.
                </p>
              </CardBody>
            </Card>

            <Card shadow="raised">
              <CardHeader title="Raised Card" description="Subtle shadow elevation" />
              <CardBody>
                <p style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}>
                  Raised cards use a subtle box shadow to give a sense of elevation.
                </p>
              </CardBody>
              <CardFooter>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button variant="primary" size="sm">
                  Save
                </Button>
              </CardFooter>
            </Card>

            <Card shadow="elevated" interactive>
              <CardHeader
                title="Elevated + Interactive"
                description="Hover for effect"
                action={<Badge variant="accent">New</Badge>}
              />
              <CardBody>
                <p style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}>
                  Interactive cards respond to hover with deeper shadow and border change.
                </p>
              </CardBody>
            </Card>
          </div>
        </Section>

        {/* ---- Avatars ---- */}
        <Section title="Avatars">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label style={{ marginBottom: 8, display: 'block' }}>Sizes</Label>
              <Row>
                <Avatar size="xs" initials="KT" />
                <Avatar size="sm" initials="KT" />
                <Avatar size="md" initials="KT" />
                <Avatar size="lg" initials="KT" />
                <Avatar size="xl" initials="KT" />
                <Avatar size="xxl" initials="KT" />
              </Row>
            </div>
            <div>
              <Label style={{ marginBottom: 8, display: 'block' }}>Variants &amp; Status</Label>
              <Row>
                <Avatar size="md" variant="primary" initials="PR" />
                <Avatar size="md" variant="secondary" initials="SD" />
                <Avatar size="md" variant="accent" initials="OL" />
                <Avatar size="md" variant="neutral" initials="NT" />
                <Avatar size="md" initials="ON" status="online" />
                <Avatar size="md" initials="AW" status="away" />
                <Avatar size="md" initials="BS" status="busy" />
                <Avatar size="md" initials="OF" status="offline" />
              </Row>
            </div>
            <div>
              <Label style={{ marginBottom: 8, display: 'block' }}>Group</Label>
              <AvatarGroup max={4} size="md">
                {['AK', 'BL', 'CM', 'DN', 'EO', 'FP'].map((i) => (
                  <Avatar
                    key={i}
                    initials={i}
                    variant={
                      ['primary', 'secondary', 'accent', 'neutral'][
                        Math.floor(Math.random() * 4)
                      ] as never
                    }
                  />
                ))}
              </AvatarGroup>
            </div>
          </div>
        </Section>

        {/* ---- Tabs ---- */}
        <Section title="Tabs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <Label style={{ marginBottom: 12, display: 'block' }}>Underline variant</Label>
              <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
                <TabList>
                  <Tab id="overview">Overview</Tab>
                  <Tab id="members">Members</Tab>
                  <Tab id="settings">Settings</Tab>
                  <Tab id="disabled" disabled>
                    Disabled
                  </Tab>
                </TabList>
                <TabPanel id="overview">
                  <p style={{ color: 'var(--kt-text-muted)' }}>
                    This is the <strong>Overview</strong> panel. It shows summary information about
                    the project.
                  </p>
                </TabPanel>
                <TabPanel id="members">
                  <p style={{ color: 'var(--kt-text-muted)' }}>
                    The <strong>Members</strong> panel lists all team contributors.
                  </p>
                </TabPanel>
                <TabPanel id="settings">
                  <p style={{ color: 'var(--kt-text-muted)' }}>
                    Configure your <strong>Settings</strong> here.
                  </p>
                </TabPanel>
              </Tabs>
            </div>

            <div>
              <Label style={{ marginBottom: 12, display: 'block' }}>Pill variant</Label>
              <Tabs defaultTab="tab1" variant="pill">
                <TabList>
                  <Tab id="tab1">All</Tab>
                  <Tab id="tab2">Active</Tab>
                  <Tab id="tab3">Archived</Tab>
                </TabList>
                <TabPanel id="tab1">
                  <p style={{ color: 'var(--kt-text-muted)' }}>All items shown.</p>
                </TabPanel>
                <TabPanel id="tab2">
                  <p style={{ color: 'var(--kt-text-muted)' }}>Active items only.</p>
                </TabPanel>
                <TabPanel id="tab3">
                  <p style={{ color: 'var(--kt-text-muted)' }}>Archived items.</p>
                </TabPanel>
              </Tabs>
            </div>
          </div>
        </Section>

        {/* ---- Alerts ---- */}
        <Section title="Alerts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Alert
              variant="info"
              title="Heads up!"
              description="Your account will reset in 3 days. Upgrade to keep your data."
              closable
            />
            <Alert
              variant="success"
              title="Payment received"
              description="Your transaction was processed successfully."
              closable
            />
            <Alert
              variant="warning"
              title="Storage almost full"
              description="You've used 90% of your 5GB storage."
              closable
            />
            <Alert
              variant="danger"
              title="Action required"
              description="Your subscription has expired. Please renew to continue."
              closable
            />
            <Alert
              variant="neutral"
              title="Maintenance window"
              description="Scheduled maintenance on Sunday at 2am UTC."
            />
          </div>
        </Section>

        {/* ---- Progress & Spinners ---- */}
        <Section title="Progress &amp; Spinners">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxWidth: 500,
              marginBottom: 24,
            }}
          >
            <Progress value={progress} label="Upload progress" showValue color="accent" />
            <Progress value={40} label="Storage used" showValue color="warning" size="sm" />
            <Progress value={85} label="Profile completion" showValue color="success" size="lg" />
            <Progress indeterminate label="Loading data..." color="primary" />
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProgress((p) => Math.max(0, p - 10))}
              >
                −10
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProgress((p) => Math.min(100, p + 10))}
              >
                +10
              </Button>
            </div>
          </div>
          <div>
            <Label style={{ marginBottom: 12, display: 'block' }}>Spinners</Label>
            <Row>
              <Spinner size="xs" />
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <Spinner size="xl" />
              <Spinner size="md" color="primary" />
              <Spinner size="md" color="current" />
              <div style={{ background: 'var(--kt-primary)', borderRadius: 8, padding: 8 }}>
                <Spinner size="md" color="white" />
              </div>
              <Spinner size="md" label="Loading..." />
            </Row>
          </div>
        </Section>

        {/* ---- Tooltips ---- */}
        <Section title="Tooltips">
          <Row gap={24}>
            <Tooltip content="Appears above" position="top">
              <Button variant="outline">Top</Button>
            </Tooltip>
            <Tooltip content="Appears below" position="bottom">
              <Button variant="outline">Bottom</Button>
            </Tooltip>
            <Tooltip content="Appears on the left" position="left">
              <Button variant="outline">Left</Button>
            </Tooltip>
            <Tooltip content="Appears on the right" position="right">
              <Button variant="outline">Right</Button>
            </Tooltip>
            <Tooltip content="Detailed tooltip with more text that wraps if needed">
              <Button variant="ghost">Long content</Button>
            </Tooltip>
          </Row>
        </Section>

        {/* ---- Modal ---- */}
        <Section title="Modal">
          <Row>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>
          </Row>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Create new project"
            description="Set up a new workspace for your team"
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setModalOpen(false)}>
                  Create Project
                </Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Project name" placeholder="My awesome project" required />
              <Select
                label="Team"
                placeholder="Select a team..."
                options={[
                  { label: 'Design', value: 'design' },
                  { label: 'Engineering', value: 'eng' },
                  { label: 'Marketing', value: 'mkt' },
                ]}
              />
              <Textarea label="Description" placeholder="What is this project about?" noResize />
            </div>
          </Modal>
        </Section>

        {/* ---- Toast ---- */}
        <Section title="Toast Notifications">
          <Row>
            <Button
              variant="primary"
              onClick={() =>
                toast({
                  title: 'Project saved',
                  description: 'Your changes have been saved.',
                  variant: 'success',
                })
              }
            >
              Success Toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: 'Heads up',
                  description: 'This might take a moment.',
                  variant: 'info',
                })
              }
            >
              Info Toast
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast({
                  title: 'Storage warning',
                  description: 'Running low on storage.',
                  variant: 'warning',
                })
              }
            >
              Warning Toast
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                toast({
                  title: 'Upload failed',
                  description: 'Could not process your file.',
                  variant: 'danger',
                })
              }
            >
              Error Toast
            </Button>
            <Button
              variant="ghost"
              onClick={() => toast({ title: 'Notification', duration: 8000 })}
            >
              No variant
            </Button>
          </Row>
        </Section>

        {/* ---- Typography ---- */}
        <Section title="Typography">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { size: '36px', weight: 700, text: 'Heading 1 — Bold', token: 'text-4xl' },
              { size: '30px', weight: 700, text: 'Heading 2 — Bold', token: 'text-3xl' },
              { size: '24px', weight: 600, text: 'Heading 3 — Semibold', token: 'text-2xl' },
              { size: '20px', weight: 600, text: 'Heading 4 — Semibold', token: 'text-xl' },
              { size: '17px', weight: 500, text: 'Heading 5 — Medium', token: 'text-lg' },
              {
                size: '15px',
                weight: 400,
                text: 'Body — Regular text for paragraphs and UI copy',
                token: 'text-md',
              },
              {
                size: '13px',
                weight: 400,
                text: 'Small — Helper text, captions, meta',
                token: 'text-sm',
              },
              {
                size: '11px',
                weight: 500,
                text: 'XSmall — Labels, badges, tags',
                token: 'text-xs',
              },
            ].map(({ size, weight, text, token }) => (
              <div key={token} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <code
                  style={{
                    fontSize: 11,
                    color: 'var(--kt-text-muted)',
                    background: 'var(--kt-surface-raised)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontFamily: 'var(--kt-font-mono)',
                    minWidth: 80,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {token}
                </code>
                <span style={{ fontSize: size, fontWeight: weight, color: 'var(--kt-text)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </main>

      {/* ---- Footer ---- */}
      <footer
        style={{
          borderTop: '1px solid var(--kt-border)',
          padding: 'var(--kt-space-6) var(--kt-space-8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--kt-text-sm)',
          color: 'var(--kt-text-muted)',
        }}
      >
        <span>Krewtree UI — Brand Guidelines Feb 2026</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Swatch color="#0A232D" name="" hex="" />
          <Swatch color="#E5DAC3" name="" hex="" />
          <Swatch color="#6D7531" name="" hex="" />
        </div>
      </footer>
    </div>
  )
}
