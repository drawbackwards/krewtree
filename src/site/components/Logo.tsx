import React from 'react'

// ── Internal mark SVG ─────────────────────────────────────────────────────────

interface MarkProps {
  height: number
  treeColor: string
  badgeColor: string
}

const KrewtreeMark: React.FC<MarkProps> = ({ height, treeColor, badgeColor }) => {
  const width = Math.round(height * (52 / 64))
  return (
    <svg
      viewBox="0 0 52 64"
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {/* Olive chevron badge — sits behind the tree */}
      <path d="M2,49 H50 L50,60 L26,64 L2,60 Z" fill={badgeColor} />
      {/* Pine tree — three overlapping tiers, widest at bottom */}
      <polygon points="26,24 3,51 49,51" fill={treeColor} />
      <polygon points="26,12 10,34 42,34" fill={treeColor} />
      <polygon points="26,3 19,19 33,19" fill={treeColor} />
    </svg>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export interface KrewtreeLogoProps {
  /**
   * Height of the mark icon in px — the wordmark scales proportionally.
   * @default 34
   */
  height?: number
  /**
   * `true`  → sand mark + sand "krew"  (dark / navy backgrounds)
   * `false` → navy mark + navy "krew"  (light / white backgrounds)
   * @default true
   */
  onDark?: boolean
  style?: React.CSSProperties
}

export const KrewtreeLogo: React.FC<KrewtreeLogoProps> = ({
  height = 34,
  onDark = true,
  style,
}) => {
  const treeColor = onDark ? '#E5DAC3' : '#0A232D'
  const badgeColor = '#6D7531'
  const krewColor = onDark ? '#E5DAC3' : '#0A232D'
  const treeWordColor = '#6D7531'
  const fontSize = Math.round(height * 0.7)
  const gap = Math.round(height * 0.32)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, ...style }}>
      <KrewtreeMark height={height} treeColor={treeColor} badgeColor={badgeColor} />
      <span
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: '-0.4px',
          lineHeight: 1,
          fontFamily: 'var(--kt-font-sans)',
        }}
      >
        <span style={{ color: krewColor }}>krew</span>
        <span style={{ color: treeWordColor }}>tree</span>
      </span>
    </div>
  )
}
