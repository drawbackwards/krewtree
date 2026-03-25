import React from 'react'
import { colors } from '../../tokens/colors'

// ── Background watermark mark ─────────────────────────────────────────────────

/**
 * Large, barely-there krewtree mark for auth page backgrounds.
 * Uses the official mark SVG paths (RGB/Mark/Two Color-Light).
 * Rendered as a single sand colour at low opacity.
 */
export const KrewtreeBgMark: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    viewBox="0 0 300 464.86"
    width={452}
    height={700}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{
      position: 'absolute',
      left: '-160px',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      userSelect: 'none',
      opacity: 0.07,
      flexShrink: 0,
      color: colors.sand[400],
      ...style,
    }}
  >
    {/* Chevron base */}
    <path
      fill="currentColor"
      d="M150.21,383.35L.43,324.38v79.99l149.79,60.49,149.79-60.49v-79.99l-149.79,58.96Z"
    />
    {/* Tree body */}
    <path
      fill="currentColor"
      d="M299.78,216.31c-56.53,0-103.78-40.58-114.43-94.24,21.52,13.1,46.75,20.66,73.72,20.66v-66.4C217.19,76.34,183.1,42.1,183.1,0h0s-66.43,0-66.43,0h0c0,42.1-34.09,76.34-75.98,76.34v66.4c26.97,0,52.21-7.56,73.73-20.67-10.65,53.67-57.91,94.25-114.43,94.25v66.4c44.19,0,84.78-15.78,116.45-42v90.4l33.45,13.16,33.45-13.16v-90.39c31.67,26.22,72.25,41.99,116.43,41.99v-66.4Z"
    />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Official krewtree horizontal logo.
 *
 * Source: krewtree Brand Assets / RGB / Horizontal / Two Color-Light
 * viewBox: 0 0 1006.19 242  (aspect ratio ≈ 4.16 : 1)
 *
 * onDark = true  → sand mark + sand "krew" / olive "tree"  (dark / navy backgrounds)
 * onDark = false → navy mark + navy "krew" / olive "tree"  (light / white backgrounds)
 */

export interface KrewtreeLogoProps {
  /** Height in px — width scales automatically to maintain aspect ratio. @default 34 */
  height?: number
  /** @default true */
  onDark?: boolean
  /** Override the olive accent color (e.g. 'white' when on an olive background). @default '#6d7531' */
  accentColor?: string
  style?: React.CSSProperties
}

export const KrewtreeLogo: React.FC<KrewtreeLogoProps> = ({
  height = 34,
  onDark = true,
  accentColor,
  style,
}) => {
  const sand = onDark ? colors.sand[400] : colors.navy[900]
  const olive = accentColor ?? colors.olive[700]
  const width = Math.round(height * (1006.19 / 242))

  return (
    <svg
      viewBox="0 0 1006.19 242"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="krewtree"
      style={{ flexShrink: 0, display: 'block', ...style }}
    >
      {/* ── Mark ─────────────────────────────────────────────────────── */}
      {/* Olive chevron base */}
      <path
        fill={olive}
        d="M78.2,199.57L.22,168.87v41.64l77.98,31.49,77.98-31.49v-41.64l-77.98,30.7Z"
      />
      {/* Sand tree body */}
      <path
        fill={sand}
        d="M156.06,112.61c-29.43,0-54.02-21.12-59.57-49.06,11.2,6.82,24.34,10.75,38.38,10.75v-34.57C113.06,39.74,95.32,21.92,95.32,0h0s-34.58,0-34.58,0h0c0,21.92-17.74,39.74-39.55,39.74v34.57c14.04,0,27.18-3.94,38.38-10.76-5.54,27.94-30.15,49.06-59.57,49.06v34.57c23.01,0,44.13-8.21,60.62-21.87v47.06l17.41,6.85,17.41-6.85v-47.05c16.49,13.65,37.61,21.86,60.61,21.86v-34.57Z"
      />

      {/* ── "krew" — sand ─────────────────────────────────────────────── */}
      {/* k */}
      <path
        fill={sand}
        d="M225.08,51.94h21.87v78.77h18.77l25.74-36.97h24.19l-32.32,46.45,34.26,49.93h-24.19l-28.06-40.84h-18.39v40.84h-21.87V51.94Z"
      />
      {/* r */}
      <path
        fill={sand}
        d="M332.1,93.74h20.32v16.45l16.06-16.45h26.71v18.77h-21.87l-19.35,19.74v57.87h-21.87v-96.38Z"
      />
      {/* e */}
      <path
        fill={sand}
        d="M402.94,170.96v-57.87l19.16-19.35h52.45l19.55,19.35v36h-69.29v15.48l7.35,7.35h33.1l6.97-7.16v-5.81h21.68v12.39l-18.77,18.77h-53.22l-18.97-19.16ZM472.22,133.03v-13.35l-7.55-7.74h-32.32l-7.55,7.74v13.35h47.42Z"
      />
      {/* w */}
      <path
        fill={sand}
        d="M506.67,93.74h22.26l12.77,67.16h.77l19.35-67.16h20.13l17.61,67.16h.77l14.13-67.16h22.26l-24.77,96.38h-21.1l-18.97-69.87h-.77l-20.32,69.87h-21.1l-23.03-96.38Z"
      />

      {/* ── "tree" — olive ────────────────────────────────────────────── */}
      {/* t */}
      <path
        fill={olive}
        d="M662.86,170.96v-58.64h-17.42v-18.58h17.81v-31.35h21.48v31.35h29.61v18.58h-29.61v51.68l7.55,7.55h22.06v18.58h-32.32l-19.16-19.16Z"
      />
      {/* r */}
      <path
        fill={olive}
        d="M732.72,93.74h20.32v16.45l16.06-16.45h26.71v18.77h-21.87l-19.35,19.74v57.87h-21.87v-96.38Z"
      />
      {/* e (first) */}
      <path
        fill={olive}
        d="M803.56,170.96v-57.87l19.16-19.35h52.45l19.55,19.35v36h-69.29v15.48l7.35,7.35h33.1l6.97-7.16v-5.81h21.68v12.39l-18.77,18.77h-53.22l-18.97-19.16ZM872.84,133.03v-13.35l-7.55-7.74h-32.32l-7.55,7.74v13.35h47.42Z"
      />
      {/* e (second) */}
      <path
        fill={olive}
        d="M915.03,170.96v-57.87l19.16-19.35h52.45l19.55,19.35v36h-69.29v15.48l7.35,7.35h33.1l6.97-7.16v-5.81h21.68v12.39l-18.77,18.77h-53.22l-18.97-19.16ZM984.32,133.03v-13.35l-7.55-7.74h-32.32l-7.55,7.74v13.35h47.42Z"
      />
    </svg>
  )
}
