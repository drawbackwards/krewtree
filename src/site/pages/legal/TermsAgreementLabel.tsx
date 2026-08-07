import React from 'react'
import { Link } from 'react-router-dom'

// Link styling per the project link standard (navy-500, bold). stopPropagation
// so clicking a link inside the checkbox's <label> navigates without toggling
// the box; target=_blank keeps the in-progress signup form intact.
const linkStyle: React.CSSProperties = {
  color: 'var(--kt-navy-500)',
  fontWeight: 'var(--kt-weight-bold)',
}

const stop = (e: React.MouseEvent): void => e.stopPropagation()

/**
 * The signup consent label with the Terms of Service and Privacy Policy phrases
 * linked to their pages. Passed as the `label` of the agreement Checkbox on both
 * the worker and company signup forms.
 */
export const TermsAgreementLabel: React.FC = () => (
  <>
    I agree to the{' '}
    <Link to="/terms" target="_blank" rel="noopener noreferrer" onClick={stop} style={linkStyle}>
      Terms of Service
    </Link>{' '}
    and{' '}
    <Link to="/privacy" target="_blank" rel="noopener noreferrer" onClick={stop} style={linkStyle}>
      Privacy Policy
    </Link>
  </>
)
