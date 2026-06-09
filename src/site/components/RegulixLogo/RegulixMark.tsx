/* eslint-disable no-restricted-syntax */
import React from 'react'

/**
 * The standalone Regulix "R" mark — the same red glyph that anchors the
 * left side of the full RegulixLogo wordmark. Used wherever space is too
 * tight for the full word but the brand recognition still matters
 * (worker / job cards, applicant rows, slideovers).
 */
interface RegulixMarkProps {
  size?: number
  color?: string
}

export const RegulixMark: React.FC<RegulixMarkProps> = ({ size = 16, color = '#ff3d00' }) => (
  <svg
    viewBox="0 0 200 231.54"
    height={size}
    width={Math.round(size * (200 / 231.54))}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Regulix Ready"
    style={{ display: 'block' }}
  >
    <rect fill={color} x="0" y="57.89" width="57.89" height="57.89" rx="5.79" ry="5.79" />
    <path
      fill={color}
      d="M197.66,226.6l-35.99-35.99c-8.87-8.87-20.31-14.56-32.57-16.35-.44-.16-.76-.58-.76-1.08,0-.46.28-.86.67-1.05.14-.03.29-.07.43-.11.02,0,.04,0,.05,0h-.03c25.36-6.15,44.2-29,44.2-56.25v-57.89c0-31.97-25.92-57.89-57.89-57.89h-52.1c-3.2,0-5.79,2.59-5.79,5.79v46.31c0,3.2,2.59,5.79,5.79,5.79h46.31c3.2,0,5.79,2.59,5.79,5.79v46.31c0,3.2-2.59,5.79-5.79,5.79h-46.31c-3.2,0-5.79,2.59-5.79,5.79v47.3c0,3.07,1.22,6.02,3.39,8.19l52.8,52.8c1.09,1.09,2.56,1.7,4.09,1.7h77.44c2.58,0,3.87-3.12,2.05-4.94Z"
    />
  </svg>
)
