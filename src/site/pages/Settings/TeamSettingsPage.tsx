import React, { useCallback, useEffect, useState } from 'react'
import { Badge, Button, EmptyState, Input, Modal, Select, Spinner } from '../../../components'
import { OverflowMenu, type OverflowItem } from '../../components/OverflowMenu/OverflowMenu'
import { useAuth } from '../../context/AuthContext'
import {
  changeMemberRole,
  createInvite,
  listMembers,
  listPendingInvites,
  removeMember,
  revokeInvite,
  roleOptions,
  transferOwnership,
  type PendingInvite,
  type TeamMember,
} from '../../services/teamService'
import { SettingsPageHeader } from './SettingsPageHeader'

const card: React.CSSProperties = {
  background: 'var(--kt-surface)',
  border: '1px solid var(--kt-border)',
  borderRadius: 'var(--kt-radius-lg)',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  justifyContent: 'space-between',
  flexWrap: 'wrap',
}
const muted: React.CSSProperties = { fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }

const ROLE_OPTIONS = roleOptions

export const TeamSettingsPage: React.FC = () => {
  const { user, activeCompanyId, companyRole } = useAuth()
  const canManage = companyRole === 'owner' || companyRole === 'admin'
  const isOwner = companyRole === 'owner'

  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [inviteError, setInviteError] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [transferTarget, setTransferTarget] = useState<TeamMember | null>(null)
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!activeCompanyId) return
    setLoading(true)
    const [m, i] = await Promise.all([
      listMembers(activeCompanyId),
      canManage ? listPendingInvites(activeCompanyId) : Promise.resolve({ data: [], error: null }),
    ])
    setMembers(m.data)
    setInvites(i.data)
    setLoading(false)
  }, [activeCompanyId, canManage])

  useEffect(() => {
    load()
  }, [load])

  const handleInvite = async () => {
    if (!activeCompanyId || !inviteEmail.trim()) return
    setInviteStatus('sending')
    setInviteError('')
    setInviteLink(null)
    const { data, error } = await createInvite(activeCompanyId, inviteEmail.trim(), inviteRole)
    if (error || !data) {
      setInviteStatus('error')
      setInviteError(error ?? 'Could not create invite.')
      return
    }
    setInviteStatus('idle')
    setInviteEmail('')
    setInviteLink(data.link)
    setCopied(false)
    load()
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const handleRoleChange = async (m: TeamMember, role: 'admin' | 'member') => {
    if (!activeCompanyId) return
    setBusyUserId(m.userId)
    await changeMemberRole(activeCompanyId, m.userId, role)
    await load()
    setBusyUserId(null)
  }

  const handleRemove = async () => {
    if (!activeCompanyId || !removeTarget) return
    setBusyUserId(removeTarget.userId)
    await removeMember(activeCompanyId, removeTarget.userId)
    setRemoveTarget(null)
    await load()
    setBusyUserId(null)
  }

  const handleTransfer = async () => {
    if (!activeCompanyId || !transferTarget) return
    setBusyUserId(transferTarget.userId)
    await transferOwnership(activeCompanyId, transferTarget.userId)
    setTransferTarget(null)
    await load()
    setBusyUserId(null)
  }

  const roleBadge = (role: string) => (
    <Badge variant={role === 'owner' ? 'primary' : role === 'admin' ? 'info' : 'neutral'}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  )

  if (loading) {
    return (
      <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
        <Spinner />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SettingsPageHeader
        title="Team"
        description="Invite teammates and manage who can access this company."
      />
      <section style={card}>
        <div>
          <h2
            style={{
              fontSize: 'var(--kt-text-lg)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              margin: '0 0 4px',
            }}
          >
            Members
          </h2>
          <p style={muted}>
            {members.length} {members.length === 1 ? 'person has' : 'people have'} access to this
            company.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map((m) => {
            const isSelf = m.userId === user?.id
            const isOwnerRow = m.role === 'owner'
            // "Make owner" and "Remove" live in the row overflow menu; both open
            // a confirmation modal rather than acting immediately.
            const menuItems: OverflowItem[] = []
            if (isOwner && !isOwnerRow) {
              menuItems.push({ label: 'Make owner', onClick: () => setTransferTarget(m) })
            }
            if (canManage && !isOwnerRow && !isSelf) {
              menuItems.push({ label: 'Remove', danger: true, onClick: () => setRemoveTarget(m) })
            }
            return (
              <div key={m.userId} style={rowStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                    {m.displayName}
                    {isSelf && <span style={muted}> (You)</span>}
                  </div>
                  <div style={muted}>{m.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Owner/admins can change other members' roles; the owner seat
                      is fixed and only moves via "Make owner" (transfer). */}
                  {canManage && !isOwnerRow && !isSelf ? (
                    <div style={{ width: 140 }}>
                      <Select
                        value={m.role}
                        disabled={busyUserId === m.userId}
                        options={ROLE_OPTIONS}
                        onChange={(e) => handleRoleChange(m, e.target.value as 'admin' | 'member')}
                      />
                    </div>
                  ) : (
                    roleBadge(m.role)
                  )}
                  {menuItems.length > 0 && (
                    <OverflowMenu items={menuItems} label={`Actions for ${m.displayName}`} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {canManage && (
        <section style={card}>
          <div>
            <h2
              style={{
                fontSize: 'var(--kt-text-lg)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-text)',
                margin: '0 0 4px',
              }}
            >
              Invite a teammate
            </h2>
            <p style={muted}>
              They receive a link to join this company. Admins can manage seats; members can work
              applicants, jobs, pipeline, and messages.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px' }}>
              <Input
                label="Email address"
                type="email"
                value={inviteEmail}
                placeholder="teammate@company.com"
                onChange={(e) => {
                  setInviteEmail(e.target.value)
                  setInviteStatus('idle')
                }}
              />
            </div>
            <div style={{ width: 140 }}>
              <Select
                label="Role"
                value={inviteRole}
                options={ROLE_OPTIONS}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviteStatus === 'sending'}
            >
              {inviteStatus === 'sending' ? 'Creating…' : 'Create invite'}
            </Button>
          </div>
          {inviteStatus === 'error' && (
            <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
              {inviteError}
            </p>
          )}
          {inviteLink && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                background: 'var(--kt-surface-alt)',
                borderRadius: 'var(--kt-radius-md)',
                padding: 12,
              }}
            >
              <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                Invite created. Email delivery isn't set up yet, so share this link with your
                teammate for now:
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Input readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} />
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ ...muted, fontWeight: 'var(--kt-weight-bold)' }}>Pending invites</div>
              {invites.map((inv) => (
                <div key={inv.id} style={rowStyle}>
                  <div>
                    <div style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                      {inv.email}
                    </div>
                    <div style={muted}>
                      {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => revokeInvite(inv.id).then(load)}>
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
          {invites.length === 0 && !inviteLink && <EmptyState message="No pending invites." />}
        </section>
      )}

      <Modal
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        size="sm"
        title="Transfer ownership?"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setTransferTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleTransfer}>
              Transfer ownership
            </Button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
          {transferTarget?.displayName} will become the owner of this company, with full control
          including billing and deletion. You will become an admin. This cannot be undone by you.
        </p>
      </Modal>

      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        size="sm"
        title="Remove teammate?"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRemove}
              disabled={busyUserId === removeTarget?.userId}
            >
              Remove
            </Button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
          {removeTarget?.displayName} will lose access to this company, including its applicants,
          jobs, pipeline, and messages. You can re-invite them later.
        </p>
      </Modal>
    </div>
  )
}

export default TeamSettingsPage
